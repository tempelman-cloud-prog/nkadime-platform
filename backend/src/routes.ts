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
  approveRentalRequest, declineRentalRequest,
  replyToListingMessage
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

// User routes
router.post('/users', createUser);
router.get('/users/:id', getUser);
router.put('/users/:id', authenticateToken, upload.single('profilePic'), (req, res, next) => {
  updateUser(req, res).catch(next);
});
// User stats (successful transactions, disputes, avg rating, rating count)
router.get('/users/:userId/stats', (req, res, next) => {
  import('./models/controllers').then(mod => mod.getUserStats(req, res)).catch(next);
});

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

// Pre-rental messaging routes
router.post('/listings/:id/messages', authenticateToken, sendListingMessage);
router.get('/listings/:id/messages', authenticateToken, getListingMessages);
// Fetch all messages received by a user (as toUser)
router.get('/messages/received', authenticateToken, getReceivedListingMessages);
// Reply to a message (conversation)
router.post('/messages/:listingId/reply', authenticateToken, replyToListingMessage);
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

// ... Placeholders for admin, analytics, referral, dispute ...

export default router;