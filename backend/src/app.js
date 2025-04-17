import express from "express";
import dotenv from "dotenv";
import "./db/index.js"; 
import { runMigrations, getDatabaseName } from './db/migrations.js';
import cors from "cors";
import userRoutes from './routes/userRoutes.js';
import auctionRoutes from './routes/auctionRoutes.js';
import bidRoutes from './routes/bidRoute.js';
import cookieParser from 'cookie-parser';
import adminRoutes from './routes/adminRoutes.js';
import { setupSocket } from './socket.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { createServer } from 'http';
import AuctionManager from './services/auctionManager.js';
import { updateAuctionStatuses } from './services/auctionStatusManager.js';

dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true 
}));

// Get and log database name
getDatabaseName()
  .then(dbName => console.log(`Connected to database: ${dbName}`))
  .catch(console.error);

// Run migrations on startup
runMigrations().catch(console.error);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/bids', bidRoutes);
app.use('/api/admin', adminRoutes);

// Error handler
app.use(errorHandler);

// Setup Socket.IO
const io = setupSocket(server);

// Initialize auction manager
const auctionManager = new AuctionManager(io);

// Make io and auctionManager accessible in routes
app.set('io', io);
app.set('auctionManager', auctionManager);

// Start periodic auction status updates
const CHECK_INTERVAL = 10000; // Check every 10 seconds
setInterval(async () => {
  try {
    await updateAuctionStatuses(io);
  } catch (error) {
    console.error('Error in periodic auction status update:', error);
  }
}, CHECK_INTERVAL);

// Initial auction status check
updateAuctionStatuses(io).catch(error => {
  console.error('Error in initial auction status check:', error);
});

export { app, server };
