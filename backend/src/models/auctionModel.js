import pool from "../db/index.js";

const Auction = {
  createAuction: async ({ title, description, image, startingPrice, startTime, endTime, sellerId, category }) => {
    try {
      if (!title || !startingPrice || !startTime || !endTime || !sellerId || !category) {
        throw new Error("Missing required fields");
      }

      if (new Date(endTime) <= new Date(startTime)) {
        throw new Error("End time must be after start time");
      }
      
      const now = new Date();
      const start = new Date(startTime);
      const initialStatus = start <= now ? 'live' : 'upcoming';
      
      const query = `
        INSERT INTO auctions (
          title, description, image, starting_price, 
          start_time, end_time, seller_id, category, 
          status, current_price
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::auction_category, $9, $10) 
        RETURNING *
      `;
      
      const values = [
        title, 
        description || '', 
        image || null,
        parseFloat(startingPrice), 
        startTime, 
        endTime, 
        sellerId, 
        category,
        initialStatus,
        parseFloat(startingPrice)
      ];
      
      const result = await pool.query(query, values);
      return result.rows[0];
    } catch (error) {
      if (error.code === '22P02') {
        throw new Error(`Invalid category. Must be one of: Electronics, Collectibles, Fashion, Home, Sports, Toys, Other`);
      }
      throw error;
    }
  },

  getAllAuctions: async (userId) => {
    // First update any ended auctions that need winner updates
    await Auction.updateAuctionWinner();
    
    const query = userId ? `
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        EXISTS (
          SELECT 1 FROM favorites f 
          WHERE f.auction_id = a.id AND f.user_id = $1
        ) as is_starred,
        f.created_at as favorited_at
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      LEFT JOIN favorites f ON a.id = f.auction_id AND f.user_id = $1
      ORDER BY a.end_time ASC;
    ` : `
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        false as is_starred,
        null as favorited_at
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      ORDER BY a.end_time ASC;
    `;
    
    const result = await pool.query(query, userId ? [userId] : []);
    return result.rows;
  },

  getAuctionById: async (id) => {
    // First update any ended auctions that need winner updates
    await Auction.updateAuctionWinner();
    
    const result = await pool.query(`
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      WHERE a.id = $1;
    `, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  },

  updateAuction: async (id, { title, description, image, startingPrice, startTime, endTime, category }) => {
    const currentAuction = await pool.query(
      "SELECT * FROM auctions WHERE id = $1", 
      [id]
    );
    
    if (currentAuction.rows.length === 0) {
      throw new Error("Auction not found");
    }
    
    const updateFields = [];
    const values = [];
    let paramIndex = 1;
    
    if (title !== undefined) {
      updateFields.push(`title = $${paramIndex}`);
      values.push(title);
      paramIndex++;
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(description);
      paramIndex++;
    }
    
    if (category !== undefined) {
      updateFields.push(`category = $${paramIndex}`);
      values.push(category);
      paramIndex++;
    }
    
    if (startTime !== undefined) {
      updateFields.push(`start_time = $${paramIndex}`);
      values.push(startTime);
      paramIndex++;
    }

    if (endTime !== undefined) {
      if (startTime !== undefined && new Date(endTime) <= new Date(startTime)) {
        throw new Error("End time must be after start time");
      }
      updateFields.push(`end_time = $${paramIndex}`);
      values.push(endTime);
      paramIndex++;
    }
    
    if (image !== undefined) {
      updateFields.push(`image = $${paramIndex}`);
      values.push(image);
      paramIndex++;
    }
    
    if (startingPrice !== undefined) {
      updateFields.push(`starting_price = $${paramIndex}`);
      values.push(startingPrice);
      paramIndex++;
    }
    
    if (updateFields.length === 0) {
      return currentAuction.rows[0]; 
    }
    
    values.push(id);
    
    const query = `
      UPDATE auctions 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    return result.rows[0];
  },
  
  deleteAuction: async (id) => {
    const result = await pool.query(
      "DELETE FROM auctions WHERE id = $1 RETURNING *", 
      [id]
    );
    
    if (result.rows.length === 0) {
      throw new Error("Auction not found");
    }
    
    return result.rows[0];
  },
  
  getAuctionsByStatus: async (status) => {
    const now = new Date();
    let query;
    
    switch (status.toLowerCase()) {
      case 'live':
        query = `
          SELECT 
            a.*,
            u.full_name as seller_name,
            u.avatar as seller_avatar
          FROM auctions a
          JOIN users u ON a.seller_id = u.id
          WHERE a.status = 'live'
          AND a.end_time > $1
          ORDER BY a.end_time ASC
        `;
        break;
      case 'completed':
      case 'ended':
        query = `
          SELECT 
            a.*,
            u.full_name as seller_name,
            u.avatar as seller_avatar,
            w.full_name as winner_name
          FROM auctions a
          JOIN users u ON a.seller_id = u.id
          LEFT JOIN users w ON a.winner_id = w.id
          WHERE a.status = 'ended'
          ORDER BY a.end_time DESC
        `;
        break;
      case 'upcoming':
        query = `
          SELECT 
            a.*,
            u.full_name as seller_name,
            u.avatar as seller_avatar
          FROM auctions a
          JOIN users u ON a.seller_id = u.id
          WHERE a.status = 'upcoming'
          AND a.start_time > $1
          ORDER BY a.start_time ASC
        `;
        break;
      default:
        throw new Error('Invalid auction status');
    }
    
    const result = await pool.query(query, [now]);
    return result.rows;
  },
  
  searchAuctions: async (searchTerm) => {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      WHERE 
        a.title ILIKE $1 OR 
        a.description ILIKE $1 OR
        a.category::text ILIKE $1
      ORDER BY a.end_time ASC
    `, [`%${searchTerm}%`]);
    
    return result.rows;
  },

  getAuctionEndTime: async (id) => {
    const result = await pool.query(
      "SELECT end_time FROM auctions WHERE id = $1",
      [id]
    );
    return result.rows[0].end_time;
  },

  updateAuctionWinner: async () => {
    const query = `
      UPDATE auctions a
      SET winner_id = (
        SELECT bidder_id
        FROM bids b
        WHERE b.auction_id = a.id
        ORDER BY b.amount DESC
        LIMIT 1
      )
      WHERE 
        end_time <= NOW() 
        AND winner_id IS NULL 
        AND EXISTS (
          SELECT 1 
          FROM bids 
          WHERE auction_id = a.id
        )
      RETURNING *;
    `;
    
    const result = await pool.query(query);
    return result.rows;
  },

  getAuctionsBySellerId: async (sellerId) => {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT b.bidder_id) as unique_bidders
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.seller_id = $1
      GROUP BY a.id, u.full_name, u.avatar, w.full_name
      ORDER BY a.created_at DESC
    `, [sellerId]);
    
    return result.rows;
  },

  getAuctionsByBidderId: async (bidderId) => {
    const result = await pool.query(`
      SELECT DISTINCT
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        (SELECT COUNT(*) FROM bids WHERE auction_id = a.id) as total_bids,
        (SELECT COUNT(DISTINCT bidder_id) FROM bids WHERE auction_id = a.id) as unique_bidders,
        (SELECT amount FROM bids WHERE bidder_id = $1 AND auction_id = a.id ORDER BY amount DESC LIMIT 1) as user_highest_bid
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      JOIN bids b ON a.id = b.auction_id
      WHERE b.bidder_id = $1
      ORDER BY a.end_time ASC
    `, [bidderId]);
    
    return result.rows;
  },

  getAuctionsByWinnerId: async (winnerId) => {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT b.bidder_id) as unique_bidders,
        (SELECT amount FROM bids WHERE auction_id = a.id ORDER BY amount DESC LIMIT 1) as winning_bid
      FROM auctions a
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.winner_id = $1
      GROUP BY a.id, u.full_name, u.avatar, w.full_name
      ORDER BY a.end_time DESC
    `, [winnerId]);
    
    return result.rows;
  },

  getAuctionStats: async (auctionId) => {
    // First get the auction stats
    const statsResult = await pool.query(`
      SELECT 
        a.*,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT b.bidder_id) as unique_bidders,
        MAX(b.amount) as highest_bid,
        MIN(b.amount) as lowest_bid,
        AVG(b.amount) as average_bid
      FROM auctions a
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE a.id = $1
      GROUP BY a.id
    `, [auctionId]);

    // Then get the bid history separately
    const historyResult = await pool.query(`
      SELECT 
        b.amount,
        b.created_at,
        u.full_name as user_name,
        u.avatar as user_avatar
      FROM bids b
      JOIN users u ON b.bidder_id = u.id
      WHERE b.auction_id = $1
      ORDER BY b.amount DESC
    `, [auctionId]);

    const stats = statsResult.rows[0] || null;
    if (stats) {
      stats.bidHistory = historyResult.rows;
    }

    return stats;
  },

  toggleFavorite: async (auctionId, userId) => {
    // First check if the favorite exists
    const existingFavorite = await pool.query(
      "SELECT * FROM favorites WHERE auction_id = $1 AND user_id = $2",
      [auctionId, userId]
    );

    let added = false;
    
    if (existingFavorite.rows.length === 0) {
      // Add favorite
      await pool.query(
        "INSERT INTO favorites (auction_id, user_id) VALUES ($1, $2)",
        [auctionId, userId]
      );
      added = true;
    } else {
      // Remove favorite
      await pool.query(
        "DELETE FROM favorites WHERE auction_id = $1 AND user_id = $2",
        [auctionId, userId]
      );
    }
    
    return { added };
  },

  getFavoriteAuctions: async (userId) => {
    const result = await pool.query(`
      SELECT 
        a.*,
        u.full_name as seller_name,
        u.avatar as seller_avatar,
        w.full_name as winner_name,
        COUNT(DISTINCT b.id) as total_bids,
        COUNT(DISTINCT b.bidder_id) as unique_bidders,
        f.created_at as favorited_at
      FROM auctions a
      JOIN favorites f ON a.id = f.auction_id
      JOIN users u ON a.seller_id = u.id
      LEFT JOIN users w ON a.winner_id = w.id
      LEFT JOIN bids b ON a.id = b.auction_id
      WHERE f.user_id = $1
      GROUP BY a.id, u.full_name, u.avatar, w.full_name, f.created_at
      ORDER BY f.created_at DESC
    `, [userId]);
    
    return result.rows;
  },

};

export default Auction;