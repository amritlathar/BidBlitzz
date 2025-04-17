// utils/api.js
// This is a mock API service for demonstration purposes
// In a real application, this would make actual API calls to your backend

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock data
let auctionsData = [
  {
    id: '1',
    title: 'Vintage Mechanical Watch',
    description: 'A beautiful vintage mechanical watch in excellent condition. Features a leather strap and gold-plated case.',
    baseValue: 120,
    currentBid: 150,
    startTime: new Date(new Date().getTime() - 60 * 60000).toISOString(), // Started 1 hour ago
    duration: 120, // 2 hours
    image: 'https://plus.unsplash.com/premium_photo-1728324830661-ac471243bade?q=80&w=2069&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    userId: 'user1',
    category: 'Collectibles',
    viewCount: 45,
    starredBy: ['user2', 'user3'],
    bids: [
      { userId: 'user2', amount: 130, timestamp: new Date(new Date().getTime() - 55 * 60000).toISOString() },
      { userId: 'user3', amount: 140, timestamp: new Date(new Date().getTime() - 40 * 60000).toISOString() },
      { userId: 'user4', amount: 150, timestamp: new Date(new Date().getTime() - 20 * 60000).toISOString() }
    ]
  },
  {
    id: '2',
    title: 'Professional DSLR Camera',
    description: 'High-end DSLR camera with multiple lenses and accessories. Perfect for professional photography.',
    baseValue: 800,
    currentBid: 850,
    startTime: new Date(new Date().getTime() - 30 * 60000).toISOString(), // Started 30 mins ago
    duration: 180, // 3 hours
    image: 'https://images.unsplash.com/photo-1714073482552-f73c9d3dae68?q=80&w=1933&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    userId: 'user2',
    bids: [
      { userId: 'user1', amount: 820, timestamp: new Date(new Date().getTime() - 25 * 60000).toISOString() },
      { userId: 'user3', amount: 850, timestamp: new Date(new Date().getTime() - 15 * 60000).toISOString() }
    ]
  },
  {
    id: '3',
    title: 'Limited Edition Sneakers',
    description: 'Rare limited edition sneakers, size 9. Brand new in box with all original packaging.',
    baseValue: 250,
    currentBid: 250,
    startTime: new Date(new Date().getTime() + 60 * 60000).toISOString(), // Starts in 1 hour
    duration: 240, // 4 hours
    image: 'https://images.unsplash.com/photo-1713649931645-acc95f0bc6c9?q=80&w=1989&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    userId: 'user3',
    category: 'Fashion',
    viewCount: 28,
    starredBy: ['user1'],
    bids: []
  },
  {
    id: '4',
    title: 'Antique Wooden Desk',
    description: 'Beautiful antique wooden desk from the early 1900s. Some signs of wear but in excellent overall condition.',
    baseValue: 400,
    currentBid: 450,
    startTime: new Date(new Date().getTime() - 120 * 60000).toISOString(), // Started 2 hours ago
    duration: 60, // 1 hour (already ended)
    image: 'https://images.unsplash.com/photo-1731506884726-f504ccfd413b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    userId: 'user1',
    bids: [
      { userId: 'user2', amount: 420, timestamp: new Date(new Date().getTime() - 110 * 60000).toISOString() },
      { userId: 'user4', amount: 450, timestamp: new Date(new Date().getTime() - 100 * 60000).toISOString() }
    ]
  }
];

// Keep track of which users have viewed which auctions
const viewedAuctions = new Map();

// Helper to generate a random ID
const generateId = () => Math.random().toString(36).substring(2, 10);

// API functions
export const getAuctions = async () => {
  await delay(500); // Simulate network request
  return auctionsData;
};

export const getLiveAuctions = async () => {
  await delay(500);
  const now = new Date();
  return auctionsData.filter(auction => {
    const startTime = new Date(auction.startTime);
    const endTime = new Date(startTime.getTime() + auction.duration * 60000);
    return startTime <= now && endTime >= now;
  });
};

export const getAuction = async (id, userId = 'anonymous') => {
  await delay(300);
  const auction = auctionsData.find(a => a.id === id);
  if (!auction) throw new Error('Auction not found');
  
  // Get the set of users who have viewed this auction
  const viewerSet = viewedAuctions.get(id) || new Set();
  
  // Only increment view count if this user hasn't viewed it before
  if (!viewerSet.has(userId)) {
    auction.viewCount = (auction.viewCount || 0) + 1;
    viewerSet.add(userId);
    viewedAuctions.set(id, viewerSet);
  }
  
  return auction;
};

export const createAuction = async (auctionData) => {
  await delay(500);
  const newAuction = {
    id: generateId(),
    ...auctionData,
    currentBid: auctionData.baseValue,
    bids: [],
    viewCount: 0,
    starredBy: []
  };
  auctionsData.unshift(newAuction);
  return newAuction;
};

export const placeBid = async (auctionId, userId, amount) => {
  await delay(500);
  const auction = auctionsData.find(a => a.id === auctionId);
  if (!auction) throw new Error('Auction not found');
  
  if (amount <= auction.currentBid) {
    throw new Error('Bid must be higher than current bid');
  }
  
  const bid = {
    userId,
    amount,
    timestamp: new Date().toISOString()
  };
  
  auction.bids.push(bid);
  auction.currentBid = amount;
  
  return auction;
};

export const getUserAuctions = async (userId) => {
  await delay(500);
  return auctionsData.filter(auction => auction.userId === userId);
};

export const getUserBids = async (userId) => {
  await delay(500);
  const userBids = [];
  
  auctionsData.forEach(auction => {
    auction.bids.forEach(bid => {
      if (bid.userId === userId) {
        userBids.push({
          ...bid,
          auction: {
            id: auction.id,
            title: auction.title,
            image: auction.image,
            currentBid: auction.currentBid,
            isCompleted: isAuctionCompleted(auction),
            bids: auction.bids
          }
        });
      }
    });
  });
  
  return userBids;
};

// Helper function to check if an auction is completed
const isAuctionCompleted = (auction) => {
  const startTime = new Date(auction.startTime);
  const endTime = new Date(startTime.getTime() + auction.duration * 60000);
  return endTime < new Date();
};

// Star an auction
export const starAuction = async (auctionId, userId) => {
  await delay(300);
  const auction = auctionsData.find(a => a.id === auctionId);
  if (!auction) throw new Error('Auction not found');
  
  if (!auction.starredBy) {
    auction.starredBy = [];
  }
  
  if (!auction.starredBy.includes(userId)) {
    auction.starredBy.push(userId);
  }
  
  return auction;
};

// Unstar an auction
export const unstarAuction = async (auctionId, userId) => {
  await delay(300);
  const auction = auctionsData.find(a => a.id === auctionId);
  if (!auction) throw new Error('Auction not found');
  
  if (auction.starredBy) {
    auction.starredBy = auction.starredBy.filter(id => id !== userId);
  }
  
  return auction;
};

// Get starred auctions for a user
export const getStarredAuctions = async (userId) => {
  await delay(500);
  return auctionsData.filter(auction => auction.starredBy?.includes(userId));
};

// Search auctions
export const searchAuctions = async (searchTerm) => {
  try {
    const response = await fetch(`/api/auctions/search?q=${encodeURIComponent(searchTerm)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to search auctions');
    }

    const data = await response.json();
    return data.data; // Return the auctions array from the response
  } catch (error) {
    console.error('Error searching auctions:', error);
    throw error;
  }
};
