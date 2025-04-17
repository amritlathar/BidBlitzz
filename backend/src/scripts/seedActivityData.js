import pool from '../db/index.js';
import { logActivity } from '../utils/logger.js';

console.log('Starting activity log data seeding...');

// Function to generate a random date within the last 30 days
const getRandomDate = (days = 30) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * days));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  return date;
};

async function seedActivityData() {
  try {
    // Get all users
    const usersResult = await pool.query('SELECT id FROM users');
    const users = usersResult.rows;
    
    if (users.length === 0) {
      console.log('No users found. Please create some users first.');
      return;
    }

    // Get all auctions
    const auctionsResult = await pool.query('SELECT id, title FROM auctions');
    const auctions = auctionsResult.rows;

    if (auctions.length === 0) {
      console.log('No auctions found. Please create some auctions first.');
    }

    console.log(`Found ${users.length} users and ${auctions.length} auctions`);

    // Generate login activities for each user
    for (const user of users) {
      const loginCount = Math.floor(Math.random() * 10) + 5; // 5-15 logins per user
      console.log(`Generating ${loginCount} login activities for user ${user.id}`);
      
      for (let i = 0; i < loginCount; i++) {
        // Insert directly into activity_log for better performance
        await pool.query(
          `INSERT INTO activity_log (user_id, type, details, created_at)
           VALUES ($1, $2, $3, $4)`,
          [
            user.id,
            'login',
            JSON.stringify({ ip: '127.0.0.1', user_agent: 'Seed Script' }),
            getRandomDate()
          ]
        );
      }
    }
    
    // Generate registration activities - one per user
    console.log(`Generating ${users.length} registration activities`);
    for (const user of users) {
      await pool.query(
        `INSERT INTO activity_log (user_id, type, details, created_at) 
         VALUES ($1, $2, $3, $4)`,
        [
          user.id,
          'registration',
          JSON.stringify({ ip: '127.0.0.1' }),
          getRandomDate(60) // Registrations could be older
        ]
      );
    }

    // Generate auction creation activities
    if (auctions.length > 0) {
      console.log(`Generating ${auctions.length} auction creation activities`);
      
      for (const auction of auctions) {
        // Get seller ID for this auction
        const sellerResult = await pool.query('SELECT seller_id FROM auctions WHERE id = $1', [auction.id]);
        const sellerId = sellerResult.rows[0].seller_id;
        
        await pool.query(
          `INSERT INTO activity_log (user_id, type, details, created_at) 
           VALUES ($1, $2, $3, $4)`,
          [
            sellerId,
            'auction_created',
            JSON.stringify({ auction_id: auction.id, title: auction.title }),
            getRandomDate(15) // Auctions created in last 15 days
          ]
        );
      }
    }

    // Generate bid activities
    if (auctions.length > 0) {
      console.log('Generating bid activities');
      
      for (const auction of auctions) {
        const bidCount = Math.floor(Math.random() * 15) + 1; // 1-15 bids per auction
        
        for (let i = 0; i < bidCount; i++) {
          // Pick a random user who isn't the seller
          const sellerResult = await pool.query('SELECT seller_id FROM auctions WHERE id = $1', [auction.id]);
          const sellerId = sellerResult.rows[0].seller_id;
          
          const eligibleUsers = users.filter(user => user.id !== sellerId);
          
          if (eligibleUsers.length > 0) {
            const bidder = eligibleUsers[Math.floor(Math.random() * eligibleUsers.length)];
            const amount = 100 + Math.floor(Math.random() * 10000); // Random bid amount
            
            await pool.query(
              `INSERT INTO activity_log (user_id, type, details, created_at) 
               VALUES ($1, $2, $3, $4)`,
              [
                bidder.id,
                'bid_placed',
                JSON.stringify({ 
                  auction_id: auction.id, 
                  amount,
                  auction_title: auction.title
                }),
                getRandomDate(10) // Bids in last 10 days
              ]
            );
          }
        }
      }
    }

    console.log('Activity data seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding activity data:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the seeding function
seedActivityData(); 