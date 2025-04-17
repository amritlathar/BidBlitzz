import express from 'express';
import { verifyJwt } from '../middlewares/verifyJwt.js';
import { verifyAdmin } from '../middlewares/verifyAdmin.js';
import * as adminController from '../controllers/adminController.js';

const router = express.Router();


router.use(verifyJwt, verifyAdmin);

// Analytics routes
router.get('/analytics', adminController.getAnalytics);

// User management routes
router.get('/users', adminController.getUsers);
router.put('/users/:id', adminController.handleUpdateUser);
router.delete('/users/:id', adminController.handleDeleteUser);

// Auction management routes
router.get('/auctions', adminController.getAuctions);
router.put('/auctions/:id', adminController.updateAuction);
router.delete('/auctions/:id', adminController.deleteAuction);

// Activity log routes
router.get('/activity-log', adminController.getActivityLog);

// Settings routes
router.get('/settings', adminController.getSettings);
router.put('/settings', adminController.updateSettings);

// Activity data for charts
router.get('/activity-data', adminController.getActivityData);

// Notifications routes
// router.get('/notifications', adminController.getNotifications);
// router.put('/notifications/:id/read', adminController.markNotificationAsRead);

export default router; 