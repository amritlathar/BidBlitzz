import Auction from '../models/auctionModel.js';
import Bid from '../models/bidModel.js';
import { emitAuctionStarted, emitAuctionEnded } from '../socketEvents.js';
import   pool  from '../db/index.js';

class AuctionManager {
  constructor(io) {
    this.io = io;
    this.pendingAuctions = new Map(); // auctionId -> timeout for start
    this.activeAuctions = new Map();  // auctionId -> timeout for end
    this.initialize();
  }

  async initialize() {
    try {
      const now = new Date();
      
      // Get pending auctions (future start time)
      const pendingAuctions = await Auction.getAuctionsByStatus('upcoming');
      
      // Get active auctions (started but not ended)
      const activeAuctions = await Auction.getAuctionsByStatus('live');

      // Set up timers for pending auctions
      pendingAuctions.forEach(auction => {
        this.scheduleAuctionStart(auction);
      });

      // Set up timers for active auctions
      activeAuctions.forEach(auction => {
        this.scheduleAuctionEnd(auction);
      });

      console.log(`Initialized AuctionManager with ${pendingAuctions.length} pending and ${activeAuctions.length} active auctions`);
    } catch (error) {
      console.error('Error initializing AuctionManager:', error);
    }
  }

  scheduleAuctionStart(auction) {
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const delay = startTime.getTime() - now.getTime();
    
    if (delay <= 0) {
      // Start immediately if start time has passed
      this.startAuction(auction);
      return;
    }

    // Schedule auction start
    const timeoutId = setTimeout(() => this.startAuction(auction), delay);
    this.pendingAuctions.set(auction.id.toString(), timeoutId);
  }

  scheduleAuctionEnd(auction) {
    const now = new Date();
    const endTime = new Date(auction.end_time);
    const delay = endTime.getTime() - now.getTime();
    
    if (delay <= 0) {
      // End immediately if end time has passed
      this.endAuction(auction);
      return;
    }

    // Schedule auction end
    const timeoutId = setTimeout(() => this.endAuction(auction), delay);
    this.activeAuctions.set(auction.id.toString(), timeoutId);
  }

  async startAuction(auction) {
    try {
      // Update auction status in database
      await pool.query(
        `UPDATE auctions 
         SET status = 'live'
         WHERE id = $1`,
        [auction.id]
      );

      // Get updated auction data
      const updatedAuction = await Auction.getAuctionById(auction.id);
      if (!updatedAuction) {
        console.error(`Auction ${auction.id} not found`);
        return;
      }
      
      // Clear the pending timeout
      this.pendingAuctions.delete(auction.id.toString());
      
      // Schedule the end
      this.scheduleAuctionEnd(updatedAuction);
      
      // Emit the event with auction details
      emitAuctionStarted(this.io, auction.id, updatedAuction);
      
      console.log(`Started auction: ${auction.id}`);
    } catch (error) {
      console.error('Error starting auction:', error);
    }
  }

  async endAuction(auction) {
    try {
      // Get the latest auction data and highest bid
      const [auctionResult, highestBidResult] = await Promise.all([
        pool.query(
          `SELECT a.*, u.full_name as seller_name 
           FROM auctions a 
           JOIN users u ON a.seller_id = u.id 
           WHERE a.id = $1`,
          [auction.id]
        ),
        pool.query(
          `SELECT b.*, u.full_name as bidder_name, u.email as bidder_email, u.avatar as bidder_avatar
           FROM bids b
           JOIN users u ON b.bidder_id = u.id
           WHERE b.auction_id = $1
           ORDER BY b.amount DESC
           LIMIT 1`,
          [auction.id]
        )
      ]);

      if (!auctionResult.rows[0]) {
        console.error(`Auction ${auction.id} not found`);
        return;
      }

      const updatedAuction = auctionResult.rows[0];
      const winningBid = highestBidResult.rows[0];
      
      // Clear the active timeout
      this.activeAuctions.delete(auction.id.toString());
      
      // Update auction status and winner in database
      await pool.query(
        `UPDATE auctions 
         SET status = 'completed', winner_id = $1, current_price = $2
         WHERE id = $3`,
        [winningBid?.bidder_id || null, winningBid?.amount || updatedAuction.current_price, auction.id]
      );

      // Get the final auction state after updates
      const finalAuctionResult = await pool.query(
        `SELECT a.*, u.full_name as seller_name 
         FROM auctions a 
         JOIN users u ON a.seller_id = u.id 
         WHERE a.id = $1`,
        [auction.id]
      );

      const finalAuction = finalAuctionResult.rows[0];

      // Emit the event with detailed auction and winner information
      emitAuctionEnded(this.io, auction.id, finalAuction, winningBid ? {
        amount: winningBid.amount,
        bidder: {
          id: winningBid.bidder_id,
          name: winningBid.bidder_name,
          email: winningBid.bidder_email,
          avatar: winningBid.bidder_avatar
        }
      } : null);
      
      console.log(`Ended auction: ${auction.id}`);
    } catch (error) {
      console.error('Error ending auction:', error);
    }
  }

  // Call this when a new auction is created
  addNewAuction(auction) {
    const now = new Date();
    const startTime = new Date(auction.start_time);
    const endTime = new Date(auction.end_time);
    
    if (startTime > now) {
      this.scheduleAuctionStart(auction);
    } else if (endTime > now) {
      this.scheduleAuctionEnd(auction);
    }
  }

  // Clean up method to clear all timeouts
  cleanup() {
    [...this.pendingAuctions.values()].forEach(clearTimeout);
    [...this.activeAuctions.values()].forEach(clearTimeout);
    this.pendingAuctions.clear();
    this.activeAuctions.clear();
  }
}

export default AuctionManager; 