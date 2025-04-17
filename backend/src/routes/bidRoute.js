import express from "express";
import { createBid, getBidsByAuction, getUserBids } from "../controllers/bidController.js";
import { verifyJwt } from "../middlewares/verifyJwt.js";

const router = express.Router();

// Create a new bid
router.post("/create", verifyJwt, createBid);

// Get all bids for an auction
router.get("/get-auction-bids/:auctionId", verifyJwt, getBidsByAuction);

// Get all bids for the current user
router.get("/get-user-bids", verifyJwt, getUserBids);

export default router;
