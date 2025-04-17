import pool from '../db/index.js';

export const getSettings = async () => {
  try {
    // Try to get existing settings
    const result = await pool.query('SELECT * FROM settings LIMIT 1');
    
    // If no settings exist, create default settings
    if (result.rows.length === 0) {
      const defaultSettings = {
        site_name: 'Auction Site',
        registration_enabled: true,
        max_auctions_per_user: 10,
        default_auction_duration: 24
      };
      
      const insertResult = await pool.query(
        `INSERT INTO settings (site_name, registration_enabled, max_auctions_per_user, default_auction_duration)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [defaultSettings.site_name, defaultSettings.registration_enabled, 
         defaultSettings.max_auctions_per_user, defaultSettings.default_auction_duration]
      );
      
      return insertResult.rows[0];
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in getSettings:', error);
    throw error;
  }
};

export const updateSettings = async (settings) => {
  try {
    const result = await pool.query(
      `UPDATE settings 
       SET site_name = $1,
           registration_enabled = $2,
           max_auctions_per_user = $3,
           default_auction_duration = $4
       WHERE id = (SELECT id FROM settings LIMIT 1)
       RETURNING *`,
      [settings.siteName, settings.registrationEnabled, 
       settings.maxAuctionsPerUser, settings.defaultAuctionDuration]
    );
    
    if (result.rows.length === 0) {
      throw new Error('No settings found to update');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Error in updateSettings:', error);
    throw error;
  }
}; 