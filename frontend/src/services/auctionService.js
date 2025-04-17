import axios from 'axios';


const API_URL = `https://dbms-h1sr.onrender.com/api/auctions`;


const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, 
});

// Add request interceptor to handle content type
api.interceptors.request.use(
  (config) => {
    // If FormData is being sent, let the browser set the Content-Type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    } else {
      // For regular JSON data
      config.headers['Content-Type'] = 'application/json';
      // If the data is an object but not FormData, stringify it
      if (typeof config.data === 'object' && !(config.data instanceof FormData)) {
        config.data = JSON.stringify(config.data);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log the full error for debugging
    console.error('API Error:', {
      status: error.response?.status,
      data: error.response?.data,
      error: error
    });
    return Promise.reject(error);
  }
);

const auctionService = {
    createAuction: async (auctionData) => {
        try {
            const response = await api.post('/', auctionData);
            return response.data.data;
        } catch (error) {
            console.error('Create Auction Error:', {
                data: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    },

    getAllAuctions: async () => {
        try {
            const response = await api.get('/');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching all auctions:', error);
            throw error;
        }
    },

    getAuctionById: async (id) => {
        try {
            const response = await api.get(`/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error fetching auction:', error);
            throw error;
        }
    },

    searchAuctions: async (query) => {
        try {
            const response = await api.get(`/search/${query}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error searching auctions:', error);
            throw error;
        }
    },

    getAuctionsByStatus: async (status) => {
        try {
            const response = await api.get(`/status/${status}`);
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching auctions by status:', error);
            throw error;
        }
    },

    updateAuction: async (id, auctionData) => {
        try {
            const response = await api.put(`/${id}`, auctionData);
            return response.data.data;
        } catch (error) {
            console.error('Error updating auction:', error);
            throw error;
        }
    },

    deleteAuction: async (id) => {
        try {
            const response = await api.delete(`/${id}`);
            return response.data.data;
        } catch (error) {
            console.error('Error deleting auction:', error);
            throw error;
        }
    },

    // User-specific operations
    getUserCreatedAuctions: async () => {
        try {
            const response = await api.get('/user/created');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching user created auctions:', error);
            throw error;
        }
    },

    getUserParticipatingAuctions: async () => {
        try {
            const response = await api.get('/user/participating');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching user participating auctions:', error);
            throw error;
        }
    },

    getUserWonAuctions: async () => {
        try {
            const response = await api.get('/user/won');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching user won auctions:', error);
            throw error;
        }
    },

    getUserFavoriteAuctions: async () => {
        try {
            const response = await api.get('/user/favorites');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching user favorite auctions:', error);
            throw error;
        }
    },

    toggleFavorite: async (auctionId) => {
        try {
            const response = await api.post(`/${auctionId}/favorite`);
            return response.data.data;
        } catch (error) {
            console.error('Error toggling favorite:', error);
            throw error;
        }
    },

    placeBid: async (auctionId, bidData) => {
        try {
            const response = await api.post(`/${auctionId}/bids`, bidData);
            return response.data.data;
        } catch (error) {
            console.error('Place Bid Error:', {
                data: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }
};

export default auctionService; 