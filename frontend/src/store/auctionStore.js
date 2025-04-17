import { create } from 'zustand';
import auctionService from '../services/auctionService';
import bidService from '../services/bidService';

const useAuctionStore = create((set, get) => ({
    auctions: [],
    currentAuction: null,
    userBids: [],
    loading: false,
    error: null,

    // Auction actions
    fetchAllAuctions: async () => {
        set({ loading: true, error: null });
        try {
            const auctions = await auctionService.getAllAuctions();
            set({ auctions, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchAuctionById: async (id) => {
        set({ loading: true, error: null });
        try {
            const auction = await auctionService.getAuctionById(id);
            set({ currentAuction: auction, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    createAuction: async (auctionData) => {
        set({ loading: true, error: null });
        try {
            const newAuction = await auctionService.createAuction(auctionData);
            set(state => ({
                auctions: [...state.auctions, newAuction],
                loading: false
            }));
            return newAuction;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateAuction: async (id, auctionData) => {
        set({ loading: true, error: null });
        try {
            const updatedAuction = await auctionService.updateAuction(id, auctionData);
            set(state => ({
                auctions: state.auctions.map(auction => 
                    auction._id === id ? updatedAuction : auction
                ),
                currentAuction: state.currentAuction?._id === id ? updatedAuction : state.currentAuction,
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // Bid actions
    createBid: async (bidData) => {
        set({ loading: true, error: null });
        try {
            const newBid = await bidService.createBid(bidData);
            set(state => ({
                currentAuction: state.currentAuction ? {
                    ...state.currentAuction,
                    bids: [...(state.currentAuction.bids || []), newBid]
                } : null,
                loading: false
            }));
            return newBid;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    fetchUserBids: async () => {
        set({ loading: true, error: null });
        try {
            const bids = await bidService.getUserBids();
            set({ userBids: bids, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    fetchAuctionBids: async (auctionId) => {
        set({ loading: true, error: null });
        try {
            const bids = await bidService.getBidsByAuction(auctionId);
            set(state => ({
                currentAuction: state.currentAuction ? {
                    ...state.currentAuction,
                    bids
                } : null,
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // Clear state
    clearCurrentAuction: () => set({ currentAuction: null }),
    clearError: () => set({ error: null })
}));

export default useAuctionStore; 