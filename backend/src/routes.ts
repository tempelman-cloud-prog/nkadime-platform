import { register, login, updateUser } from './models/controllers';
import { Router } from 'express';
import {
  createUser, getUser,
  createListing, getListings,
  addFavorite, getFavorites,
  addReview, getReviews,
  createNotification, getNotifications
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

// Listing routes (protected)
router.post('/listings', authenticateToken, upload.array('images', 10), (req, res, next) => {
  const multerReq = req as import('express').Request & { files: Express.Multer.File[] };
  createListing(multerReq, res).catch(next);
});
router.get('/listings', getListings);

// Favorite routes (protected for adding)
router.post('/favorites', authenticateToken, addFavorite);
router.get('/favorites/:userId', getFavorites);

// Review routes (protected)
router.post('/reviews', authenticateToken, upload.array('images', 5), (req, res, next) => {
  const multerReq = req as import('express').Request & { files: Express.Multer.File[] };
  addReview(multerReq, res).catch(next);
});
router.get('/reviews/:listingId', getReviews);

// Notification routes (protected for creating)
router.post('/notifications', authenticateToken, createNotification);
router.get('/notifications/:userId', getNotifications);

// ... Placeholders for admin, analytics, referral, dispute ...

export default router;