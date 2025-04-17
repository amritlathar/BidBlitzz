import pool from '../db/index.js';
import { emitAuctionStarted, emitAuctionEnded } from '../socketEvents.js';

export async function updateAuctionStatuses(io) {
  const now = new Date();
  let startedCount = 0;
  let endedCount = 0;

  try {
    console.log('Checking for auctions to update at:', now);

    // First, let's check what auctions are eligible
    const eligibleAuctionsResult = await pool.query(`
      SELECT id, title, status, start_time, end_time
      FROM auctions
      WHERE (status = 'upcoming' AND start_time <= $1)
      OR (status = 'live' AND end_time <= $1)
    `, [now]);

    console.log('Found eligible auctions:', eligibleAuctionsResult.rows);

    // Find and update auctions that should start
    const startingAuctionsResult = await pool.query(`
      UPDATE auctions 
      SET status = 'live' 
      WHERE start_time <= $1 
      AND status = 'upcoming'
      RETURNING id, title, start_time, end_time, status, current_price, starting_price
    `, [now]);

    const startingAuctions = startingAuctionsResult.rows;
    console.log('Auctions to start:', startingAuctions);
    
    for (const auction of startingAuctions) {
      console.log(`Emitting auctionStarted for auction ${auction.id}`);
      emitAuctionStarted(io, auction.id, auction);
      startedCount++;
      console.log(`Started auction ${auction.id} at ${now}`);
      
      // Verify the room exists
      const rooms = await io.sockets.adapter.rooms;
      console.log(`Active socket rooms for auction ${auction.id}:`, rooms.get(`auction:${auction.id}`));
    }

    // Find and update auctions that should end
    const endingAuctionsResult = await pool.query(`
      WITH winning_bids AS (
        SELECT DISTINCT ON (auction_id)
          b.auction_id,
          b.amount,
          b.bidder_id,
          u.full_name as bidder_name,
          u.email as bidder_email,
          u.avatar as bidder_avatar
        FROM bids b
        JOIN users u ON b.bidder_id = u.id
        ORDER BY b.auction_id, b.amount DESC
      )
      UPDATE auctions a
      SET 
        status = 'completed',
        winner_id = COALESCE(wb.bidder_id, NULL),
        current_price = COALESCE(wb.amount, a.starting_price)
      FROM (
        SELECT id FROM auctions 
        WHERE end_time <= $1 
        AND status = 'live'
      ) as ended_auctions
      LEFT JOIN winning_bids wb ON wb.auction_id = ended_auctions.id
      WHERE a.id = ended_auctions.id
      RETURNING 
        a.id,
        a.title,
        a.end_time,
        wb.bidder_id,
        wb.bidder_name,
        wb.bidder_email,
        wb.bidder_avatar,
        wb.amount,
        a.status
    `, [now]);

    const endingAuctions = endingAuctionsResult.rows;
    console.log('Auctions to end:', endingAuctions);
    
    for (const auction of endingAuctions) {
      const winningBid = auction.bidder_id ? {
        amount: auction.amount,
        bidder: {
          id: auction.bidder_id,
          name: auction.bidder_name,
          email: auction.bidder_email,
          avatar: auction.bidder_avatar
        }
      } : null;
      
      console.log(`Emitting auctionEnded for auction ${auction.id}`);
      emitAuctionEnded(io, auction.id, auction, winningBid);
      endedCount++;
      console.log(`Ended auction ${auction.id} at ${now}`);
      
      // Verify the room exists
      const rooms = await io.sockets.adapter.rooms;
      console.log(`Active socket rooms for auction ${auction.id}:`, rooms.get(`auction:${auction.id}`));
    }

    if (startedCount > 0 || endedCount > 0) {
      console.log(`Updated auction statuses: ${startedCount} started, ${endedCount} ended`);
    } else {
      console.log('No auctions needed updating');
    }

    return { startedCount, endedCount };
  } catch (error) {
    console.error('Error updating auction statuses:', error);
    throw error;
  }
} 