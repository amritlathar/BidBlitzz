import pool from '../db/index.js';
import { emitNewBid, emitPotentialWinner } from '../socketEvents.js';

export const createBid = async (req, res) => {
  try {
    const { auctionId, amount } = req.body;
    const userId = req.user.id;

    // Get auction details
    const auctionResult = await pool.query(
      `SELECT * FROM auctions WHERE id = $1`,
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    const auction = auctionResult.rows[0];
    const now = new Date();

    // Check if auction is active
    if (now < new Date(auction.start_time)) {
      return res.status(400).json({ message: "Cannot bid on an auction that hasn't started yet" });
    }

    if (now > new Date(auction.end_time)) {
      return res.status(400).json({ message: "Cannot bid on an auction that has already ended" });
    }

    // Check if bidder is the seller
    if (userId === auction.seller_id) {
      return res.status(400).json({ message: "You cannot bid on your own auction" });
    }

    // Check if bid amount is higher than current price
    if (amount <= (auction.current_price || auction.starting_price)) {
      return res.status(400).json({ 
        message: `Bid must be higher than ${auction.current_price || auction.starting_price}` 
      });
    }

    // Create bid
    const bidResult = await pool.query(
      `INSERT INTO bids (auction_id, bidder_id, amount, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [auctionId, userId, amount]
    );

    // Update auction current price
    await pool.query(
      `UPDATE auctions 
       SET current_price = $1
       WHERE id = $2`,
      [amount, auctionId]
    );

    // Get the bid with bidder information
    const populatedBidResult = await pool.query(
      `SELECT b.*, u.full_name as bidder_name, u.email as bidder_email, u.avatar as bidder_avatar
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.id = $1`,
      [bidResult.rows[0].id]
    );

    const populatedBid = populatedBidResult.rows[0];

    // Format the bid data for socket emission
    const bidForSocket = {
      ...populatedBid,
      bidder: {
        id: populatedBid.bidder_id,
        name: populatedBid.bidder_name,
        email: populatedBid.bidder_email,
        avatar: populatedBid.bidder_avatar
      }
    };

    // Emit socket events
    const io = req.app.get('io');
    emitNewBid(io, auctionId, bidForSocket, auction);

    // Check if this is a winning bid (if auction is ending soon)
    const timeRemaining = new Date(auction.end_time) - now;
    if (timeRemaining < 60000) { // Less than 1 minute remaining
      emitPotentialWinner(io, auctionId, bidForSocket.bidder, amount);
    }

    res.status(201).json(bidForSocket);
  } catch (error) {
    console.error('Error in createBid:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getBidsByAuction = async (req, res) => {
  try {
    const { auctionId } = req.params;
    
    const result = await pool.query(
      `SELECT b.*, u.full_name as bidder_name, u.avatar as bidder_avatar
       FROM bids b
       JOIN users u ON b.bidder_id = u.id
       WHERE b.auction_id = $1
       ORDER BY b.amount DESC`,
      [auctionId]
    );

    res.json({
      success: true,
      message: "Bids fetched successfully",
      data: result.rows
    });
  } catch (error) {
    console.error("❌ Error fetching bids:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getUserBids = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(
      `SELECT b.*, a.title as auction_title, a.current_price as auction_current_price
       FROM bids b
       JOIN auctions a ON b.auction_id = a.id
       WHERE b.bidder_id = $1
       ORDER BY b.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      message: "User bids fetched successfully",
      data: result.rows
    });
  } catch (error) {
    console.error("❌ Error fetching user bids:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};


