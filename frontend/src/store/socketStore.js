import { create } from 'zustand';
import { io } from 'socket.io-client';

const API_URL = `https://dbms-h1sr.onrender.com`;

const useSocketStore = create((set, get) => ({
  socket: null,
  isConnected: false,
  currentAuction: null,
  bids: [],
  winner: null,
  auctionStatus: null,
  error: null,

  connect: () => {
    try {
      const socket = io(API_URL, {
        withCredentials: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Socket connected successfully:', socket.id);
        set({ socket, isConnected: true, error: null });
      });

      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        set({ error: 'Failed to connect to auction server' });
      });

      socket.on('reconnect', (attemptNumber) => {
        console.log('Socket reconnected after', attemptNumber, 'attempts');
        set({ isConnected: true, error: null });
      });

      socket.on('reconnect_error', (error) => {
        console.error('Socket reconnection error:', error);
        set({ error: 'Failed to reconnect to auction server' });
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        set({ isConnected: false });
        
        // If the disconnection was initiated by the server, try to reconnect
        if (reason === 'io server disconnect') {
          socket.connect();
        }
      });

      socket.on('newBid', (data) => {
        console.log('Received new bid:', data);
        set((state) => ({
          bids: [...state.bids, data.bid],
          currentAuction: {
            ...state.currentAuction,
            current_price: data.auction.current_price
          }
        }));
      });

      socket.on('potentialWinner', (data) => {
        console.log('Received potential winner:', data);
        set({ winner: data });
      });

      socket.on('auctionStatusChanged', (data) => {
        console.log('Auction status changed:', data);
        set({
          auctionStatus: data.status,
          winner: data.winner
        });
      });

      socket.on('auctionEnded', (data) => {
        console.log('Auction ended:', data);
        set({
          auctionStatus: 'ended',
          winner: data.winner
        });
      });

      socket.on('auctionStarted', (data) => {
        console.log('Auction started:', data);
        set({
          auctionStatus: 'active',
          winner: null
        });
      });

      set({ socket });
    } catch (error) {
      console.error('Error setting up socket:', error);
      set({ error: 'Failed to connect to auction' });
    }
  },

  disconnect: () => {
    const { socket } = get();
    if (socket) {
      socket.disconnect();
      set({ 
        socket: null, 
        isConnected: false, 
        currentAuction: null,
        bids: [],
        winner: null,
        auctionStatus: null
      });
    }
  },

  joinAuction: (auctionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('joinAuction', auctionId);
      set({ currentAuction: auctionId });
    }
  },

  leaveAuction: (auctionId) => {
    const { socket } = get();
    if (socket) {
      socket.emit('leaveAuction', auctionId);
      set({ 
        currentAuction: null, 
        bids: [], 
        winner: null 
      });
    }
  },

  placeBid: (auctionId, amount) => {
    const { socket } = get();
    if (socket) {
      socket.emit('placeBid', { auctionId, amount });
    }
  }
}));

export default useSocketStore; 