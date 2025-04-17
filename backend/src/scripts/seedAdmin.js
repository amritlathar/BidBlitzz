import pool from '../db/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const seedAdmin = async () => {
  try {
    // Check if admin already exists
    const checkAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@auction.com']
    );

    if (checkAdmin.rows.length > 0) {
      console.log('Admin user already exists');
      return;
    }

    // Hash the password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash('admin123', saltRounds);

    // Generate tokens
    const accessToken = jwt.sign(
      { email: 'admin@auction.com', role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { email: 'admin@auction.com', role: 'admin' },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Insert admin user
    const result = await pool.query(
      `INSERT INTO users (
        email,
        password,
        full_name,
        contact,
        role,
        access_token,
        refresh_token,
        created_at,
        updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, email, full_name, role, contact`,
      [
        'admin@auction.com',
        hashedPassword,
        'Admin User',
        '+1234567890', // Default contact number
        'admin',
        accessToken,
        refreshToken
      ]
    );

    console.log('Admin user created successfully:', result.rows[0]);
  } catch (error) {
    console.error('Error seeding admin user:', error);
  } finally {
    pool.end();
  }
};

seedAdmin(); 