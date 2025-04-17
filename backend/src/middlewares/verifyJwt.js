import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import pool from '../db/index.js';

dotenv.config();

export const verifyJwt = async (req, res, next) => {
  try {
    const accessToken = req.cookies.accessToken;
    
    if (!accessToken) {
      return res.status(401).json({
        success: false,
        message: 'No access token provided'
      });
    }
    
    const decoded = jwt.verify(accessToken, process.env.JWT_ACCESS_SECRET);
    
    if (!decoded.userId) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const user = await pool.query(
      'SELECT id, email, full_name, contact, avatar, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (!user.rows.length) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};

