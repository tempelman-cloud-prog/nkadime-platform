import { register, login, updateUser } from './models/controllers';
import { Router } from 'express';
import {
  createUser, getUser,
  createListing, getListings,
  addFavorite, getFavorites,
  addReview, getReviews,
  createNotification, getNotifications,
  getRentalHistory, createRentalRequest, updateRentalStatus,
  getAverageRating, updateListing,
  addRentalMessage,
  addRentalPayment,
  addRentalReview,
  exportRentalAudit,
  updateRentalStatusWithAudit,
  sendListingMessage, getListingMessages,
  getReceivedListingMessages,
  markNotificationAsRead, markAllNotificationsRead,
  raiseDispute, resolveDispute, getOpenDisputes,
  getMyRentalRequests, getIncomingRentalRequests,
  approveRentalRequest, declineRentalRequest,  // replyToListingMessage,  // Removed: not implemented/exported
  getAdmins, adminGetAllListings, adminDeleteListing,
  adminGetAllRentals, adminUpdateRentalStatus,
  adminGetAnalytics,
} from './models/controllers';
import multer from 'multer';
import path from 'path';
import { authenticateToken } from './middleware/auth'; // <-- Add this import

const router = Router();

// Set up multer for image uploads
const storage = multer.diskStorage({
  destination: function (
    req: import('express').Request,
    file: Express.Multer.File,
    cb: (error: Error | null, destination: string) => void
  ) {
    cb(null, path.join(__dirname, '../../uploads'));
  },
  filename: function (
    req: import('express').Request,
    file: Express.Multer.File,
    cb: (error: Error | null, filename: string) => void
  ) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Auth routes
router.post('/auth/register', register);
router.post('/auth/login', login);
// Change admin password route
// router.post('/auth/change-password', authenticateToken, changePassword); // Removed: not implemented/exported

// User routes
router.post('/users', createUser);
router.get('/users/:id', getUser);
router.put('/users/:id', authenticateToken, upload.single('profilePic'), (req, res, next) => {
  updateUser(req, res).catch(next);
});
// User stats (successful transactions, disputes, avg rating, rating count)
// router.get('/users/:userId/stats', getUserStats); // Removed: getUserStats is not implemented

// Listing routes (protected)
router.post('/listings', authenticateToken, upload.array('images', 10), (req, res, next) => {
  const multerReq = req as import('express').Request & { files: Express.Multer.File[] };
  createListing(multerReq, res).catch(next);
});
router.get('/listings', getListings);
router.patch('/listings/:id', authenticateToken, upload.array('images', 10), async (req, res, next) => {
  try {
    const multerReq = req as import('express').Request & { files: Express.Multer.File[] };
    await updateListing(multerReq, res);
  } catch (err) {
    next(err);
  }
});
router.delete('/listings/:id', authenticateToken, async (req, res, next) => {
  try {
    await (await import('./models/controllers')).deleteListing(req, res);
  } catch (err) {
    next(err);
  }
});

// Favorite routes (protected for adding)
router.post('/favorites', authenticateToken, addFavorite);
router.get('/favorites/:userId', getFavorites);

// Review routes (protected)
router.post('/reviews', authenticateToken, upload.array('images', 5), (req, res, next) => {
  const multerReq = req as import('express').Request & { files: Express.Multer.File[] };
  addReview(multerReq, res).catch(next);
});
router.get('/reviews/:listingId', getReviews); // for listing
router.get('/user-reviews/:userId', getReviews); // for user
router.get('/average-rating/listing/:listingId', getAverageRating);
router.get('/average-rating/user/:userId', getAverageRating);

// Notification routes (protected for creating)
router.post('/notifications', authenticateToken, createNotification);
router.get('/notifications/:userId', getNotifications);
router.patch('/notifications/:id/read', authenticateToken, markNotificationAsRead);
router.patch('/notifications/user/:userId/read', authenticateToken, markAllNotificationsRead);

// Rental routes
router.post('/rentals', authenticateToken, createRentalRequest);
router.get('/rentals/history/:userId', authenticateToken, getRentalHistory);
// New robust endpoints for transaction system
router.post('/rentals/:rentalId/message', authenticateToken, addRentalMessage);
router.post('/rentals/:rentalId/payment', authenticateToken, addRentalPayment);
router.post('/rentals/:rentalId/review', authenticateToken, addRentalReview);
router.get('/rentals/:rentalId/export', authenticateToken, exportRentalAudit);
router.patch('/rentals/:rentalId/status-audit', authenticateToken, updateRentalStatusWithAudit);
router.patch('/rentals/:rentalId/status', authenticateToken, updateRentalStatus); // legacy/simple
// Release escrow after rental completion (owner action)
// router.post('/rentals/:rentalId/release-escrow', authenticateToken, releaseEscrow); // Removed: releaseEscrow is not implemented

// Pre-rental messaging routes
router.post('/listings/:id/messages', authenticateToken, sendListingMessage);
router.get('/listings/:id/messages', authenticateToken, getListingMessages);
// Fetch all messages received by a user (as toUser)
router.get('/messages/received', authenticateToken, getReceivedListingMessages);
// Mark all messages from a user for a listing as read (when opening conversation)
router.post('/messages/:listingId/mark-read', authenticateToken, (req, res, next) => {
  import('./models/controllers').then(mod => mod.markListingMessagesRead(req, res)).catch(next);
});

// Dispute routes
router.post('/rentals/:rentalId/dispute', authenticateToken, raiseDispute);
router.post('/rentals/:rentalId/dispute/resolve', authenticateToken, resolveDispute);
router.get('/disputes/open', authenticateToken, getOpenDisputes);

// MyRentals workflow routes
// Get rental requests made by the current user (as renter)
router.get('/rentals/my-requests', authenticateToken, getMyRentalRequests);
// Get rental requests for listings owned by the current user (as owner)
router.get('/rentals/incoming-requests', authenticateToken, getIncomingRentalRequests);
// Approve a rental request
router.patch('/rentals/:rentalId/approve', authenticateToken, approveRentalRequest);
// Decline a rental request
router.patch('/rentals/:rentalId/decline', authenticateToken, declineRentalRequest);

// --- Admin User Management ---
// List all users (admin only)
router.get('/admin/users', authenticateToken, (req, res, next) => {
  import('./models/controllers').then(mod => mod.adminGetAllUsers(req, res)).catch(next);
});
// Admin: Get all listings
router.get('/admin/listings', authenticateToken, adminGetAllListings);
// Admin: Suspend a listing
// router.patch('/admin/listings/:id/suspend', authenticateToken, adminSuspendListing); // Removed: not implemented/exported
// Admin: Activate a listing
// router.patch('/admin/listings/:id/activate', authenticateToken, adminActivateListing); // Removed: not implemented/exported
// Admin: Delete a listing
router.delete('/admin/listings/:id', authenticateToken, adminDeleteListing);
// Admin: Get all rentals
router.get('/admin/rentals', authenticateToken, adminGetAllRentals);
// Admin: Force update rental status
router.patch('/admin/rentals/:id/status', authenticateToken, adminUpdateRentalStatus);
// Suspend a user (admin only)
// router.patch('/users/:id/suspend', authenticateToken, suspendUser); // Removed: suspendUser is not implemented/exported
// Activate a user (admin only)
// router.patch('/users/:id/activate', authenticateToken, activateUser); // Removed: activateUser is not implemented/exported
// Delete a user (admin only)
// router.delete('/users/:id', authenticateToken, (req, res, next) => {
//   import('./models/controllers').then(mod => mod.deleteUser(req, res)).catch(next);
// });

// Admin analytics route
router.get('/admin/analytics', authenticateToken, adminGetAnalytics);

// ... Placeholders for admin, analytics, referral, dispute ...

export default router;
// router.get('/admin/analytics', authenticateToken, adminGetAnalytics); // Removed: adminGetAnalytics is not exported