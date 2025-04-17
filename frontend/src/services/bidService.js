import axios from 'axios';

const API_URL = `https://dbms-h1sr.onrender.com/api/bids`;

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

const bidService = {
    createBid: async (bidData) => {
        try {
            const response = await api.post('/create', {
                auctionId: bidData.auctionId,
                amount: bidData.amount
            });
            return response.data;
        } catch (error) {
            console.error('Create Bid Error:', {
                data: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    getBidsByAuction: async (auctionId) => {
        try {
            const response = await api.get(`/get-auction-bids/${auctionId}`);
            return response.data.data || []; // Return the data array directly or empty array as fallback
        } catch (error) {
            console.error('Get Bids Error:', {
                data: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    getUserBids: async () => {
        const response = await api.get('/get-user-bids');
        return response.data;
    }
};

export default bidService; 