import type { Multer } from 'multer';
// Removed duplicate import of Response
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Removed duplicate import of Request

// User Registration
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ name, email, password: hashedPassword, phone });
    await user.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};
// User Login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '7d' }
    );
    // Fetch the latest user data after login
    const freshUser = await User.findById(user._id);
    if (!freshUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      token,
      user: {
        id: freshUser._id,
        name: freshUser.name,
        email: freshUser.email,
        location: freshUser.location,
        profilePic: freshUser.profilePic
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};
import { Request, Response } from 'express';
import { User, Listing, Favorite, Review, Notification } from './index';
import mongoose from 'mongoose';

interface MulterRequest extends Request {
  files?: Express.Multer.File[];
}

// User Controller
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getUser = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Update User Profile
export const updateUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData: any = {};
    // Multer parses multipart/form-data, so req.body fields may be strings
    if (typeof req.body.name === 'string') updateData.name = req.body.name;
    if (typeof req.body.location === 'string') updateData.location = req.body.location;
    if (req.file) {
      updateData.profilePic = '/uploads/' + req.file.filename;
    }
    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      profilePic: user.profilePic
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Listing Controller
export const createListing = async (req: MulterRequest, res: Response) => {
  try {
    // Handle image uploads from multer
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = (req.files as Express.Multer.File[]).map(file => '/uploads/' + file.filename);
    }
    // Merge images with other form data
    const listingData = { ...req.body, images };
    const listing = new Listing(listingData);
    await listing.save();
    res.status(201).json(listing);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getListings = async (req: Request, res: Response) => {
  try {
    // Advanced search: filter by category, location, price, availability
    const { category, location, minPrice, maxPrice, available } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (available !== undefined) filter.available = available === 'true';
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
    const listings = await Listing.find(filter);
    res.json(listings);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Favorite Controller
export const addFavorite = async (req: Request, res: Response) => {
  try {
    const favorite = new Favorite({ user: req.body.user, listing: req.body.listing });
    await favorite.save();
    res.status(201).json(favorite);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getFavorites = async (req: Request, res: Response) => {
  try {
    const favorites = await Favorite.find({ user: req.params.userId }).populate('listing');
    res.json(favorites);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Review Controller
export const addReview = async (req: MulterRequest, res: Response) => {
  try {
    // Handle image uploads from multer
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = (req.files as Express.Multer.File[]).map(file => '/uploads/' + file.filename);
    }
    // Merge images with other form data
    const reviewData = { ...req.body, images };
    const review = new Review(reviewData);
    await review.save();
    res.status(201).json(review);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getReviews = async (req: Request, res: Response) => {
  try {
    const reviews = await Review.find({ listing: req.params.listingId }).populate('reviewer');
    res.json(reviews);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Notification Controller
export const createNotification = async (req: Request, res: Response) => {
  try {
    const notification = new Notification(req.body);
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const notifications = await Notification.find({ user: req.params.userId });
    res.json(notifications);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// ... Add admin, analytics, referral, and dispute logic as needed ...