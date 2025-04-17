import pool from "../db/index.js";

export const createUser = async ({
  email,
  password,
  full_name,
  contact,
  role,
  avatar
}) => {
  const query = `
    INSERT INTO users (
      email,
      password,
      full_name,
      contact,
      role,
      avatar,
      created_at,
      updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
    RETURNING id, email, full_name, contact, role, avatar, created_at
  `;

  const values = [
    email,
    password,
    full_name,
    contact,
    role,
    avatar
  ];

  return await pool.query(query, values);
};

export const updateUser = async (id, userData) => {
  const { email, full_name, contact, role } = userData;
  try {
    const result = await pool.query(`
      UPDATE users 
      SET 
        email = COALESCE($1, email),
        full_name = COALESCE($2, full_name),
        contact = COALESCE($3, contact),
        role = COALESCE($4, role)
      WHERE id = $5
      RETURNING id, email, full_name, contact, role
    `, [email, full_name, contact, role, id]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

export const deleteUser = async (id) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};




