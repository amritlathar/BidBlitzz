import { updateAuctionStatuses } from './auctionStatusManager.js';

const CHECK_INTERVAL = 60000; // Check every minute

export function startAuctionStatusScheduler(io) {
  // Initial check
  updateAuctionStatuses(io).catch(error => {
    console.error('Error in initial auction status check:', error);
  });

  // Set up periodic checks
  const intervalId = setInterval(async () => {
    try {
      const { startedCount, endedCount } = await updateAuctionStatuses(io);
      
      if (startedCount > 0 || endedCount > 0) {
        console.log(`Auction status update: ${startedCount} started, ${endedCount} ended`);
      }
    } catch (error) {
      console.error('Error in scheduled auction status check:', error);
    }
  }, CHECK_INTERVAL);

  // Return the interval ID in case we need to stop the scheduler
  return intervalId;
} 