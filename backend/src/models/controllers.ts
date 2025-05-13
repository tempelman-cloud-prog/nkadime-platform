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
        profilePic: freshUser.profilePic,
        bio: freshUser.bio // Return bio on login
      }
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};
import { Request, Response } from 'express';
import { User, Listing, Favorite, Review, Notification, Rental } from './index';
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
    if (typeof req.body.bio === 'string') updateData.bio = req.body.bio; // Add bio update
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
      profilePic: user.profilePic,
      bio: user.bio // Return bio
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
    // Advanced search: filter by category, location, price, availability, sorting, pagination
    const { category, location, minPrice, maxPrice, available, sortBy, sortOrder, limit, page } = req.query;
    const filter: any = {};
    if (category) filter.category = category;
    if (location) filter.location = location;
    if (available !== undefined) filter.available = available === 'true';
    if (minPrice || maxPrice) filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
    // Sorting
    let sort: any = {};
    if (sortBy) {
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;
    } else {
      sort['createdAt'] = -1; // Default: newest first
    }
    // Pagination
    const pageNum = Number(page) || 1;
    const pageSize = Number(limit) || 12;
    const skip = (pageNum - 1) * pageSize;
    const [listings, total] = await Promise.all([
      Listing.find(filter).sort(sort).skip(skip).limit(pageSize),
      Listing.countDocuments(filter)
    ]);
    res.json({ listings, total, page: pageNum, pageSize });
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
    let images: string[] = [];
    if (req.files && Array.isArray(req.files)) {
      images = (req.files as Express.Multer.File[]).map(file => '/uploads/' + file.filename);
    }
    const reviewData = { ...req.body, images };
    // At least one of listing or reviewedUser must be present
    if (!reviewData.listing && !reviewData.reviewedUser) {
      return res.status(400).json({ error: 'Must provide listing or reviewedUser' });
    }
    const review = new Review(reviewData);
    await review.save();
    // Notification for listing owner or reviewed user
    if (review.listing) {
      const listing = await Listing.findById(review.listing);
      if (listing && listing.owner) {
        await Notification.create({
          user: listing.owner,
          type: 'review',
          message: 'Your listing received a new review.',
          data: { review: review._id, listing: listing._id }
        });
      }
    } else if (review.reviewedUser) {
      await Notification.create({
        user: review.reviewedUser,
        type: 'review',
        message: 'You received a new review.',
        data: { review: review._id }
      });
    }
    res.status(201).json(review);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get reviews for a listing or user
export const getReviews = async (req: Request, res: Response) => {
  try {
    const { listingId, userId } = req.params;
    let reviews;
    if (listingId) {
      reviews = await Review.find({ listing: listingId }).populate('reviewer');
    } else if (userId) {
      reviews = await Review.find({ reviewedUser: userId }).populate('reviewer');
    } else {
      return res.status(400).json({ error: 'Must provide listingId or userId' });
    }
    res.json(reviews);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get average rating for a listing or user
export const getAverageRating = async (req: Request, res: Response) => {
  try {
    const { listingId, userId } = req.params;
    let match: any = {};
    if (listingId) match.listing = listingId;
    if (userId) match.reviewedUser = userId;
    if (!match.listing && !match.reviewedUser) {
      return res.status(400).json({ error: 'Must provide listingId or userId' });
    }
    const result = await Review.aggregate([
      { $match: match },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    if (result.length === 0) return res.json({ avg: null, count: 0 });
    res.json({ avg: result[0].avg, count: result[0].count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Notification Controller
export const createNotification = async (req: Request, res: Response) => {
  try {
    const { user, type, message, data } = req.body;
    if (!user || !type || !message) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const notification = new Notification({ user, type, message, data });
    await notification.save();
    res.status(201).json(notification);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get rental history for a user (as renter or owner)
export const getRentalHistory = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    // Find rentals where user is renter or owner
    const rentals = await Rental.find({
      $or: [
        { renter: userId },
        { owner: userId }
      ]
    })
      .populate('listing')
      .populate('renter', 'name profilePic')
      .populate('owner', 'name profilePic')
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Create a rental request (user requests to rent a listing)
export const createRentalRequest = async (req: Request, res: Response) => {
  try {
    const { listing, renter, owner, startDate, endDate } = req.body;
    if (!listing || !renter || !owner || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Optionally: check for overlapping rentals, listing availability, etc.
    const rental = new Rental({
      listing,
      renter,
      owner,
      startDate,
      endDate,
      status: 'pending',
    });
    await rental.save();
    // --- Notification: Notify owner of new rental request ---
    await Notification.create({
      user: owner,
      type: 'rental_request',
      message: 'You have a new rental request for your listing.',
      data: { rental: rental._id, listing }
    });
    res.status(201).json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Approve or decline a rental request (owner action)
export const updateRentalStatus = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { status } = req.body;
    if (!['approved', 'declined', 'active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      { status },
      { new: true }
    ).populate('listing').populate('renter', 'name profilePic').populate('owner', 'name profilePic');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // --- Notification: Notify renter of approval/decline ---
    if (status === 'approved' || status === 'declined') {
      let listingTitle = '';
      if (rental.listing && typeof rental.listing === 'object' && 'title' in rental.listing && typeof (rental.listing as any).title === 'string') {
        listingTitle = (rental.listing as any).title;
      } else {
        listingTitle = 'your listing';
      }
      await Notification.create({
        user: rental.renter._id,
        type: 'rental_status',
        message: `Your rental request for '${listingTitle}' was ${status}.`,
        data: { rental: rental._id, listing: rental.listing._id || rental.listing, status }
      });
    }
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};
// ... Add admin, analytics, referral, and dispute logic as needed ...