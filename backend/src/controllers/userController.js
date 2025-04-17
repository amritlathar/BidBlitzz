import pool from "../db/index.js";
import { createUser } from "../models/user.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { logLogin, logRegistration } from "../utils/logger.js";
import { uploadToCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";

dotenv.config();

const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 6;
};

const validateContact = (contact) => {
  const contactRegex = /^[0-9]{10}$/;
  return contactRegex.test(contact);
};

const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

const comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

const generateBothToken = (userId) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION,
  });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION,
  });
  return { accessToken, refreshToken };
};

const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
};

// User controller functions
const registerUser = async (req, res) => {
  try {
    const { email, password, full_name, contact, role = "user" } = req.body;
    let avatarUrl = null;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please provide a valid email address.",
      });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long.",
      });
    }

    if (contact && !validateContact(contact)) {
      return res.status(400).json({
        success: false,
        message: "Contact number must be exactly 10 digits.",
      });
    }

    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userExists?.rows?.length > 0) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists.",
      });
    }

    // Handle avatar upload if file is present
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        avatarUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload avatar image",
        });
      }
    }

    const hashedPassword = await hashPassword(password);
    const result = await createUser({
      email,
      password: hashedPassword,
      full_name,
      contact,
      role,
      avatar: avatarUrl
    });

    if (!result?.rows?.[0]) {
      // Clean up uploaded image if user creation fails
      if (avatarUrl) {
        try {
          // Extract public_id from avatar URL
          const urlParts = avatarUrl.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const publicId = `user_avatars/${fileName.split('.')[0]}`;
          await deleteFromCloudinary(publicId);
        } catch (deleteError) {
          console.error('Error deleting failed upload:', deleteError);
        }
      }
      throw new Error("Failed to create user");
    }

    const userId = result.rows[0].id;
    const { accessToken, refreshToken } = generateBothToken(userId);
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      userId,
    ]);

    // Log the registration activity
    await logRegistration(userId, { 
      email, 
      full_name, 
      role,
      ip: req.ip || 'unknown'
    });

    const userData = {
      id: userId,
      email: result.rows[0].email,
      full_name: result.rows[0].full_name,
      contact: result.rows[0].contact,
      avatar: result.rows[0].avatar,
      role: result.rows[0].role,
    };

    res
      .status(201)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "User registered successfully",
        data: userData,
      });
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format. Please provide a valid email address.",
      });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "email not found",
      });
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid  password",
      });
    }

    const { accessToken, refreshToken } = generateBothToken(user.id);
    await pool.query("UPDATE users SET refresh_token = $1 WHERE id = $2", [
      refreshToken,
      user.id,
    ]);

    // Log the login activity
    await logLogin(user.id, {
      email: user.email,
      ip: req.ip || 'unknown',
      user_agent: req.headers['user-agent'] || 'unknown'
    });

    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      contact: user.contact,
      avatar: user.avatar,
      role: user.role,
    };

    res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json({
        success: true,
        message: "Login successful",
        data: userData,
      });
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const logoutUser = async (req, res) => {
  try {
    const { userId } = req.user;

    await pool.query("UPDATE users SET refresh_token = NULL WHERE id = $1", [
      userId,
    ]);

    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Error in logoutUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const getUser = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json({
      success: true,
      message: "User fetched successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error in getUser:", error);
  }
};

const updateUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const { full_name, contact } = req.body;
    let avatarUrl = null;

    if (full_name && !validateName(full_name)) {
      return res.status(400).json({
        success: false,
        message: "Invalid name format. Please provide a valid name.",
      });
    }
    
    if (contact && !validateContact(contact)) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact format. Please provide a valid contact number.",
      });
    }

    // Handle new avatar upload if file is present
    if (req.file) {
      try {
        console.log('File received:', req.file);
        // Get current user to delete old avatar if exists
        const currentUser = await pool.query(
          "SELECT avatar FROM users WHERE id = $1",
          [userId]
        );

        if (currentUser.rows[0]?.avatar) {
          try {
            const urlParts = currentUser.rows[0].avatar.split('/');
            const fileName = urlParts[urlParts.length - 1];
            const publicId = `user_avatars/${fileName.split('.')[0]}`;
            console.log('Attempting to delete old avatar with publicId:', publicId);
            await deleteFromCloudinary(publicId);
          } catch (deleteError) {
            console.error('Error deleting old avatar:', deleteError);
          }
        }

        console.log('Attempting to upload new avatar to Cloudinary');
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        console.log('Upload result:', uploadResult);
        avatarUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error('Error uploading new avatar:', uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload new avatar image",
          error: uploadError.message
        });
      }
    }

    console.log('Updating user in database with avatarUrl:', avatarUrl);
    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           contact = COALESCE($2, contact),
           avatar = COALESCE($3, avatar),
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, email, full_name, contact, role, avatar`,
      [full_name, contact, avatarUrl, userId]
    );

    if (!result.rows[0]) {
      throw new Error("User not found");
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
      stack: error.stack
    });
  }
};

const updatePassword = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Old and new password are required",
      });
    }
    const isPasswordValid = await comparePassword(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid old password",
      });
    }
    const hashedPassword = await hashPassword(newPassword);
    const result = await pool.query(
      "UPDATE users SET password = $1 WHERE id = $2",
      [hashedPassword, user.id]
    );
    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const result = await pool.query("DELETE FROM users WHERE id = $1", [
      userId,
    ]);
    res.status(200).json({
      success: true,
      message: "User deleted successfully",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

export {
  registerUser,
  loginUser,
  logoutUser,
  getUser,
  updateUser,
  deleteUser,
  updatePassword,
};
