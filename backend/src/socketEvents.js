export const emitNewBid = (io, auctionId, bid, auction) => {
  console.log(`Emitting newBid for auction ${auctionId}:`, { bid, auction });
  io.to(`auction:${auctionId}`).emit('newBid', {
    bid,
    auction: {
      id: auction.id,
      current_price: bid.amount,
      status: auction.status
    }
  });
};

export const emitPotentialWinner = (io, auctionId, bidder, amount) => {
  console.log(`Emitting potentialWinner for auction ${auctionId}:`, { bidder, amount });
  io.to(`auction:${auctionId}`).emit('potentialWinner', {
    bidder,
    amount
  });
};

export const emitAuctionStatusChanged = (io, auctionId, status, winner) => {
  console.log(`Emitting auctionStatusChanged for auction ${auctionId}:`, { status, winner });
  io.to(`auction:${auctionId}`).emit('auctionStatusChanged', {
    auctionId,
    status,
    winner,
    timestamp: new Date().toISOString()
  });
};

export const emitAuctionEnded = (io, auctionId, auctionDetails, winningBid) => {
  console.log(`Emitting auctionEnded for auction ${auctionId}:`, { auctionDetails, winningBid });
  io.to(`auction:${auctionId}`).emit('auctionEnded', {
    auctionId,
    title: auctionDetails.title,
    status: 'ended',
    winningBid: {
      amount: winningBid?.amount,
      bidder: winningBid?.bidder || null
    },
    endTime: auctionDetails.end_time,
    timestamp: new Date().toISOString(),
    currentPrice: winningBid?.amount || auctionDetails.current_price
  });
};

export const emitAuctionStarted = (io, auctionId, auctionDetails) => {
  console.log(`Emitting auctionStarted for auction ${auctionId}:`, auctionDetails);
  io.to(`auction:${auctionId}`).emit('auctionStarted', {
    auctionId,
    title: auctionDetails.title,
    status: 'live',
    startTime: auctionDetails.start_time,
    timestamp: new Date().toISOString(),
    currentPrice: auctionDetails.starting_price
  });
}; 