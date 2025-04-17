import pool from "../db/index.js";

const Bid = {
  createBid: async ({ auctionId, bidderId, amount }) => {
    // Start a transaction since we need to update multiple tables
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get the auction to check if it's still active
      const auctionResult = await client.query(
        `SELECT * FROM auctions WHERE id = $1`,
        [auctionId]
      );

      const auction = auctionResult.rows[0];
      if (!auction) {
        throw new Error("Auction not found");
      }

      // Check if auction is still active
      const now = new Date();
      if (now < new Date(auction.start_time)) {
        throw new Error("Auction has not started yet");
      }
      if (now > new Date(auction.end_time)) {
        throw new Error("Auction has ended");
      }

      // Check if bid amount is higher than current price
      if (amount <= auction.current_price) {
        throw new Error("Bid must be higher than current price");
      }

      // Create the bid
      const bidResult = await client.query(
        `INSERT INTO bids (auction_id, bidder_id, amount) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [auctionId, bidderId, amount]
      );

      // Update the auction's current price
      await client.query(
        `UPDATE auctions 
         SET current_price = $1, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2`,
        [amount, auctionId]
      );

      await client.query('COMMIT');
      return bidResult.rows[0];
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  getBidsByAuction: async (auctionId) => {
    const result = await pool.query(
      `SELECT b.*, u.full_name as bidder_name 
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.auction_id = $1
       ORDER BY b.amount DESC`,
      [auctionId]
    );
    return result.rows;
  },

  getBidsByUser: async (userId) => {
    const result = await pool.query(
      `SELECT 
        b.*,
        a.title as auction_title,
        a.current_price,
        a.end_time,
        a.start_time,
        CASE 
          WHEN a.end_time <= NOW() THEN true
          ELSE false
        END as is_completed,
        CASE 
          WHEN a.end_time <= NOW() AND b.amount = a.current_price THEN true
          ELSE false
        END as is_winner
       FROM bids b
       JOIN auctions a ON b.auction_id = a.id
       WHERE b.bidder_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );
    return result.rows;
  },

  getHighestBid: async (auctionId) => {
    const result = await pool.query(
      `SELECT b.*, u.full_name as bidder_name 
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.auction_id = $1
       ORDER BY b.amount DESC
       LIMIT 1`,
      [auctionId]
    );
    return result.rows[0] || null;
  }
};

export default Bid; 