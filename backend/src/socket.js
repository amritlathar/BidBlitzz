import { Server } from 'socket.io';
import dotenv from 'dotenv';

dotenv.config();

export const setupSocket = (server) => {
  // Socket.IO setup
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
      allowedHeaders: ["Content-Type", "Authorization"],
      transports: ['websocket', 'polling']
    },
    allowEIO3: true
  });

  // Socket.IO connection handling
  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join auction room when user enters an auction
    socket.on('joinAuction', (auctionId) => {
      socket.join(`auction:${auctionId}`);
      console.log(`Client ${socket.id} joined auction: ${auctionId}`);
      console.log(`Current rooms for ${socket.id}:`, socket.rooms);
    });

    // Leave auction room when user leaves
    socket.on('leaveAuction', (auctionId) => {
      socket.leave(`auction:${auctionId}`);
      console.log(`Client ${socket.id} left auction: ${auctionId}`);
      console.log(`Current rooms for ${socket.id}:`, socket.rooms);
    });

    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, 'Reason:', reason);
    });

    socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  });

  return io;
}; 