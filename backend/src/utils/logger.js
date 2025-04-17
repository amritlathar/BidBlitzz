import pool from '../db/index.js';

/**
 * Logs a user activity to the activity_log table
 * @param {number} userId - The user ID (can be null for anonymous actions)
 * @param {string} type - Activity type: 'login', 'registration', 'auction_created', 'bid_placed', etc.
 * @param {object} details - Additional details about the activity (JSON object)
 * @returns {Promise<object>} The created log entry
 */
export const logActivity = async (userId, type, details = {}) => {
  try {
    const query = `
      INSERT INTO activity_log (user_id, type, details)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    const result = await pool.query(query, [userId, type, JSON.stringify(details)]);
    return result.rows[0];
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - logging should not interrupt the main flow
    return null;
  }
};

/**
 * Logs a user login activity
 * @param {number} userId - The user ID
 * @param {object} details - Additional details (IP, device, etc.)
 */
export const logLogin = async (userId, details = {}) => {
  return await logActivity(userId, 'login', details);
};

/**
 * Logs a user registration activity
 * @param {number} userId - The user ID
 * @param {object} details - Additional details (email, etc.)
 */
export const logRegistration = async (userId, details = {}) => {
  return await logActivity(userId, 'registration', details);
};

/**
 * Logs an auction creation activity
 * @param {number} userId - The seller ID
 * @param {number} auctionId - The auction ID
 * @param {object} details - Additional details (title, etc.)
 */
export const logAuctionCreated = async (userId, auctionId, details = {}) => {
  return await logActivity(userId, 'auction_created', {
    auction_id: auctionId,
    ...details
  });
};

/**
 * Logs a bid placement activity
 * @param {number} userId - The bidder ID
 * @param {number} auctionId - The auction ID
 * @param {number} amount - The bid amount
 * @param {object} details - Additional details
 */
export const logBidPlaced = async (userId, auctionId, amount, details = {}) => {
  return await logActivity(userId, 'bid_placed', {
    auction_id: auctionId,
    amount,
    ...details
  });
}; 