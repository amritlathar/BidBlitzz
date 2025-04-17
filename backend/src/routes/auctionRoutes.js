import express from "express";
import * as auctionController from "../controllers/auctionController.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";
import upload from '../middlewares/uploadMiddleware.js';

const router = express.Router();

// Public routes
router.get("/stats", auctionController.getPublicStats);
router.get("/status/:status", auctionController.getAuctionsByStatus);
router.get("/search/:term", auctionController.searchAuctions);

// Protected routes
router.use(verifyJwt);

// Auction CRUD operations
router.get("/", auctionController.getAllAuctions);
router.get("/:id", auctionController.getAuctionById);
router.post("/", upload.single('image'), auctionController.createAuction);
router.put("/:id", upload.single('image'), auctionController.updateAuction);
router.delete("/:id", auctionController.deleteAuction);

// User-specific routes
router.get("/user/created", auctionController.getUserCreatedAuctions);
router.get("/user/participating", auctionController.getUserParticipatingAuctions);
router.get("/user/won", auctionController.getUserWonAuctions);
router.get("/user/favorites", auctionController.getUserFavoriteAuctions);

// Status and search routes
router.get("/statistics/:id", auctionController.getAuctionStatistics);

// Auction-specific operations with ID parameter
router.post("/:id/favorite", auctionController.toggleFavoriteAuction);

// Bid placement
router.post("/:auctionId/bids", auctionController.placeBid);

export default router;