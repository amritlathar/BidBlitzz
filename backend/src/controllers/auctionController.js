import Auction from "../models/auctionModel.js";
import  pool  from "../db/index.js";
import { logAuctionCreated, logBidPlaced } from "../utils/logger.js";
import Bid from '../models/bidModel.js';
import { emitAuctionStatusChanged, emitAuctionEnded, emitAuctionStarted } from '../socketEvents.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js';

export const createAuction = async (req, res) => {
  try {
    const { title, description, startingPrice, startTime, endTime, category } = req.body;
    const sellerId = req.user.id;
    
    // Validate required fields
    if (!title || !startingPrice || !startTime || !endTime || !category) {
      return res.status(400).json({ 
        success: false,
        message: 'Missing required fields',
        error: 'Title, starting price, start time, end time, and category are required'
      });
    }

    let imageUrl = null;
    let imagePublicId = null;
    
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer);
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        console.error('Error uploading to Cloudinary:', uploadError);
        return res.status(500).json({ 
          success: false,
          message: 'Error uploading image',
          error: uploadError.message 
        });
      }
    }
    
    const auctionData = {
      title,
      description,
      startingPrice: parseFloat(startingPrice),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      sellerId,
      category,
      image: imageUrl,
      imagePublicId
    };
    
    const newAuction = await Auction.createAuction(auctionData);
    
    res.status(201).json({
      success: true,
      message: 'Auction created successfully',
      data: newAuction
    });
  } catch (error) {
    console.error('Error creating auction:', error);
    
    // If image was uploaded but auction creation failed, clean up
    if (imagePublicId) {
      try {
        await deleteFromCloudinary(imagePublicId);
      } catch (deleteError) {
        console.error('Error deleting image from Cloudinary:', deleteError);
      }
    }
    
    // Check for specific error types
    if (error.message.includes('auction_category')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid category',
        error: 'Category must be one of: Electronics, Collectibles, Fashion, Home, Sports, Toys, Other'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating auction',
      error: error.message 
    });
  }
};

export const getAllAuctions = async (req, res) => {
  try {
    const userId = req.user?.id || null;
    const auctions = await Auction.getAllAuctions(userId);
    res.json({
      success: true,
      message: "Auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error fetching auctions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getAuctionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get auction details and increment views in one transaction
    const auction = await pool.query(`
      WITH updated AS (
        UPDATE auctions 
        SET views = COALESCE(views, 0) + 1 
        WHERE id = $1 
        RETURNING *
      )
      SELECT 
        u.*,
        s.full_name as seller_name,
        s.avatar as seller_avatar,
        w.full_name as winner_name
      FROM updated u
      JOIN users s ON u.seller_id = s.id
      LEFT JOIN users w ON u.winner_id = w.id
    `, [id]);

    if (auction.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: "Auction not found" 
      });
    }

    res.json({
      success: true,
      message: "Auction fetched successfully",
      data: auction.rows[0]
    });
  } catch (error) {
    console.error("❌ Error fetching auction:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const updateAuction = async (req, res) => {
  try {
    const auctionId = req.params.id;
    const { title, description, startingPrice, startTime, endTime } = req.body;
    const sellerId = req.user.id;
    
    // Get the existing auction to check ownership and get old image info
    const existingAuction = await Auction.getAuctionById(auctionId);
    
    if (!existingAuction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (existingAuction.seller_id !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized to update this auction' });
    }
    
    let imageUrl = existingAuction.image_url;
    let imagePublicId = existingAuction.image_public_id;
    
    // Handle new image upload
    if (req.file) {
      // Delete old image if it exists
      if (existingAuction.image_public_id) {
        await deleteFromCloudinary(existingAuction.image_public_id);
      }
      
      // Upload new image
      const uploadResult = await uploadToCloudinary(req.file.buffer);
      imageUrl = uploadResult.secure_url;
      imagePublicId = uploadResult.public_id;
    }
    
    const auctionData = {
      id: auctionId,
      title,
      description,
      startingPrice: parseFloat(startingPrice),
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      imageUrl,
      imagePublicId
    };
    
    const updatedAuction = await Auction.updateAuction(auctionData);
    res.json(updatedAuction);
  } catch (error) {
    console.error('Error updating auction:', error);
    res.status(500).json({ message: 'Error updating auction', error: error.message });
  }
};

export const deleteAuction = async (req, res) => {
  try {
    const auctionId = req.params.id;
    const sellerId = req.user.id;
    
    // Get the auction to check ownership and image info
    const auction = await Auction.getAuctionById(auctionId);
    
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }
    
    if (auction.seller_id !== sellerId) {
      return res.status(403).json({ message: 'Unauthorized to delete this auction' });
    }
    
    // Delete image from Cloudinary if it exists
    if (auction.image_public_id) {
      await deleteFromCloudinary(auction.image_public_id);
    }
    
    await Auction.deleteAuction(auctionId);
    res.json({ message: 'Auction deleted successfully' });
  } catch (error) {
    console.error('Error deleting auction:', error);
    res.status(500).json({ message: 'Error deleting auction', error: error.message });
  }
};

export const updateAuctionWinners = async (req, res) => {
  try {
    const updatedAuctions = await Auction.updateAuctionWinner();
    
    res.json({
      success: true,
      message: "Auction winners updated successfully",
      data: {
        updatedCount: updatedAuctions.length,
        updatedAuctions
      }
    });
  } catch (error) {
    console.error("❌ Error updating auction winners:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getAuctionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const auctions = await Auction.getAuctionsByStatus(status);
    
    res.json({
      success: true,
      message: "Auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error fetching auctions by status:", error);
    
    if (error.message.includes("Invalid status")) {
      return res.status(400).json({ error: error.message });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const searchAuctions = async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({ error: "Search term is required" });
    }
    
    const auctions = await Auction.searchAuctions(q);
      res.json({
      success: true,
      message: "Auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error searching auctions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getUserCreatedAuctions = async (req, res) => {
  try {
    const userId = req.user.id;
    const auctions = await Auction.getAuctionsBySellerId(userId);
    
    res.json({
      success: true,
      message: "User's created auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error fetching user's created auctions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getUserParticipatingAuctions = async (req, res) => {
  try {
    const userId = req.user.id;
    const auctions = await Auction.getAuctionsByBidderId(userId);
    
    res.json({
      success: true,
      message: "User's participating auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error fetching user's participating auctions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getUserWonAuctions = async (req, res) => {
  try {
    const userId = req.user.id;
    const auctions = await Auction.getAuctionsByWinnerId(userId);
    
    res.json({
      success: true,
      message: "User's won auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error fetching user's won auctions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getAuctionStatistics = async (req, res) => {
  try {
    const { id } = req.params;
    const stats = await Auction.getAuctionStats(id);
    
    if (!stats) {
      return res.status(404).json({ error: "Auction not found" });
    }
    
    res.json({
      success: true,
      message: "Auction statistics fetched successfully",
      data: stats
    });
  } catch (error) {
    console.error("❌ Error fetching auction statistics:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const toggleFavoriteAuction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const result = await Auction.toggleFavorite(id, userId);
    
    res.json({
      success: true,
      message: result.added ? "Auction added to favorites" : "Auction removed from favorites",
      data: { isFavorite: result.added }
    });
  } catch (error) {
    console.error("❌ Error toggling favorite auction:", error);
    
    if (error.message === "Auction not found") {
      return res.status(404).json({ error: "Auction not found" });
    }
    
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getUserFavoriteAuctions = async (req, res) => {
  try {
    const userId = req.user.id;
    const auctions = await Auction.getFavoriteAuctions(userId);
    
    res.json({
      success: true,
      message: "User's favorite auctions fetched successfully",
      data: auctions
    });
  } catch (error) {
    console.error("❌ Error fetching user's favorite auctions:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const getPublicStats = async (req, res) => {
  try {
    // Get total auctions and their stats
    const auctionsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN start_time <= NOW() AND end_time > NOW() THEN 1 END) as active,
        COUNT(CASE WHEN start_time > NOW() THEN 1 END) as upcoming,
        COUNT(CASE WHEN end_time <= NOW() THEN 1 END) as completed,
        SUM(views) as total_views
      FROM auctions
    `);
    const auctionStats = auctionsResult.rows[0];

    // Get total bids
    const bidsResult = await pool.query('SELECT COUNT(*) as total FROM bids');
    const totalBids = parseInt(bidsResult.rows[0].total);

    res.json({
      success: true,
      data: {
        totalAuctions: parseInt(auctionStats.total),
        totalBids,
        totalViews: parseInt(auctionStats.total_views) || 0,
        activeAuctions: parseInt(auctionStats.active),
        upcomingAuctions: parseInt(auctionStats.upcoming),
        completedAuctions: parseInt(auctionStats.completed)
      }
    });
  } catch (error) {
    console.error('Error getting public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch public stats'
    });
  }
};

export const placeBid = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount } = req.body;
    const bidderId = req.user.id;

    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Bid amount must be a positive number"
      });
    }

    const bidAmount = parseFloat(amount);

    // Get auction details
    const auctionResult = await pool.query(
      'SELECT * FROM auctions WHERE id = $1',
      [auctionId]
    );

    if (auctionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Auction not found"
      });
    }

    const auction = auctionResult.rows[0];

    // Check if auction is active
    const now = new Date();
    if (now < new Date(auction.start_time)) {
      return res.status(400).json({
        success: false,
        message: "Cannot bid on an auction that hasn't started yet"
      });
    }

    if (now > new Date(auction.end_time)) {
      return res.status(400).json({
        success: false,
        message: "Cannot bid on an auction that has already ended"
      });
    }

    // Check if bidder is the seller
    if (bidderId === auction.seller_id) {
      return res.status(400).json({
        success: false,
        message: "You cannot bid on your own auction"
      });
    }

    // Check if bid is higher than current price
    if (bidAmount <= auction.current_price) {
      return res.status(400).json({
        success: false,
        message: `Bid amount must be higher than current price of ${auction.current_price}`
      });
    }

    // Place the bid
    const result = await pool.query(
      `INSERT INTO bids (auction_id, bidder_id, amount, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [auctionId, bidderId, bidAmount]
    );

    // Update auction current price
    await pool.query(
      `UPDATE auctions 
       SET current_price = $1, last_bid_time = NOW()
       WHERE id = $2`,
      [bidAmount, auctionId]
    );

    // Log the bid
    await logBidPlaced(bidderId, auctionId, bidAmount, {
      auction_title: auction.title
    });

    res.status(201).json({
      success: true,
      message: "Bid placed successfully",
      data: result.rows[0]
    });
  } catch (error) {
    console.error("❌ Error placing bid:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal Server Error"
    });
  }
};

export const updateAuctionStatus = async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { status } = req.body;

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({ message: 'Auction not found' });
    }

    auction.status = status;
    await auction.save();

    // Get the highest bid if auction is ending
    let winner = null;
    if (status === 'ended') {
      const highestBid = await Bid.findOne({ auction: auctionId })
        .sort({ amount: -1 })
        .populate('bidder', 'name email avatar')
        .lean();

      if (highestBid) {
        winner = {
          bidder: highestBid.bidder,
          amount: highestBid.amount
        };
      }
    }

    // Emit socket event
    const io = req.app.get('io');
    emitAuctionStatusChanged(io, auctionId, status, winner);

    if (status === 'ended') {
      emitAuctionEnded(io, auctionId, winner);
    } else if (status === 'active') {
      emitAuctionStarted(io, auctionId);
    }

    res.json({ auction, winner });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};