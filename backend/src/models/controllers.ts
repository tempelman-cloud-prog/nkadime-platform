import type { Multer } from 'multer';
// Removed duplicate import of Response
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
// Removed duplicate import of Request
const LATE_FEE_RATE = 50; // $50 per day late

// User Registration
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }    const hashedPassword = await bcrypt.hash(password, 10);
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
      { userId: user._id, email: user.email, isAdmin: user.isAdmin },
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
            bio: freshUser.bio, // Return bio on login
            isAdmin: freshUser.isAdmin // Add isAdmin to user object
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
import ListingMessage from './ListingMessage';
import { UserMessage } from './index';
import { Storage } from '@google-cloud/storage';
const { keyPath, bucketName } = require('../gcs-key-loader.js');

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

// Helper to upload a file buffer to GCS and return the public URL
async function uploadBufferToGCS(buffer: Buffer, originalname: string, mimetype: string): Promise<string> {
  const storage = new Storage({ keyFilename: keyPath });
  const bucket = storage.bucket(bucketName); // Use configurable bucket name
  const gcsFile = bucket.file(Date.now() + '-' + originalname);
  await gcsFile.save(buffer, {
    resumable: false,
    contentType: mimetype,
    public: false, // set to true if you want public access
  });
  return `https://storage.googleapis.com/${bucket.name}/${gcsFile.name}`;
}

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
      // Upload profilePic to GCS
      updateData.profilePic = await uploadBufferToGCS(req.file.buffer, req.file.originalname, req.file.mimetype);
    }
    // Add support for mapPosition and showMapLocation
    if (req.body.mapPosition) {
      // Accepts JSON string or array
      let pos = req.body.mapPosition;
      if (typeof pos === 'string') {
        try {
          pos = JSON.parse(pos);
        } catch {}
      }
      if (Array.isArray(pos) && pos.length === 2 && pos.every((n) => typeof n === 'number')) {
        updateData.mapPosition = pos;
      } else if (pos === null) {
        updateData.mapPosition = null;
      }
    }
    if (typeof req.body.showMapLocation !== 'undefined') {
      if (typeof req.body.showMapLocation === 'string') {
        updateData.showMapLocation = req.body.showMapLocation === 'true';
      } else {
        updateData.showMapLocation = !!req.body.showMapLocation;
      }
    }
    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    const user = await User.findByIdAndUpdate(userId, updateData, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Always return the updated user object in a consistent format
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      profilePic: user.profilePic,
      bio: user.bio,
      mapPosition: user.mapPosition,
      showMapLocation: user.showMapLocation
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
    const pageSize = Number(limit) || 20;
    const skip = (pageNum - 1) * pageSize;
    const [listings, total] = await Promise.all([
      Listing.find(filter).sort(sort).skip(skip).limit(pageSize).populate('owner', 'name email'),
      Listing.countDocuments(filter)
    ]);
    res.json({ listings, total });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Update Listing
export const updateListing = async (req: MulterRequest, res: Response) => {
  try {
    const listingId = req.params.id;
    const updateData: any = {};
    // Only allow certain fields to be updated
    if (typeof req.body.title === 'string') updateData.title = req.body.title;
    if (typeof req.body.description === 'string') updateData.description = req.body.description;
    if (typeof req.body.category === 'string') updateData.category = req.body.category;
    if (typeof req.body.location === 'string') updateData.location = req.body.location;
    if (typeof req.body.price !== 'undefined') updateData.price = req.body.price;
    if (typeof req.body.priceUnit === 'string') updateData.priceUnit = req.body.priceUnit;
    if (typeof req.body.available !== 'undefined') updateData.available = req.body.available;
    // Handle new image uploads
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      // Add new images to the images array
      const newImages = (req.files as Express.Multer.File[]).map(file => '/uploads/' + file.filename);
      // Optionally: merge with existing images if you want to keep old ones
      updateData.images = newImages;
    }
    // If no fields to update, return error
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: 'No update data provided' });
    }
    const listing = await Listing.findByIdAndUpdate(listingId, updateData, { new: true });
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json(listing);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Delete Listing (soft delete)
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    // Check for in-progress rentals
    const inProgressRental = await Rental.findOne({
      listing: listingId,
      status: { $nin: ['completed', 'cancelled', 'declined'] }
    });
    if (inProgressRental) {
      return res.status(400).json({ error: 'Cannot delete listing: there are active or pending rentals. Please cancel or complete all rentals first.' });
    }
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { deleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ success: true });
  } catch (err) {
    const deleteListingErrorMsg = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: deleteListingErrorMsg });
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
    // Prevent owner from reviewing their own listing
    if (reviewData.listing && reviewData.reviewer) {
      const listing = await Listing.findById(reviewData.listing);
      if (listing && listing.owner && listing.owner.toString() === reviewData.reviewer.toString()) {
        return res.status(403).json({ error: 'You cannot review your own listing.' });
      }
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

export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    const notificationId = req.params.id;
    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ error: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const markAllNotificationsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const result = await Notification.updateMany(
      { user: userId, read: false },
      { $set: { read: true } }
    );
    res.json({ updated: result.modifiedCount });
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
      statusHistory: [{ status: 'pending', by: renter, at: new Date() }]
    });
    await rental.save();
    // Set listing status to 'pending approval' on request
    await Listing.findByIdAndUpdate(listing, { status: 'pending approval' });
    // Notify the owner of the new rental request
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
// Get rental requests made by the current user (as renter)
export const getMyRentalRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;    const rentals = await Rental.find({ renter: userId })
      .populate('listing')
      .populate('owner', 'email name')
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get rental requests for listings owned by the current user (as owner)
export const getIncomingRentalRequests = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const rentals = await Rental.find({ owner: userId })
      .populate('listing')
      .populate('renter', 'email name')
      .populate('owner', 'email name') // Ensure owner is populated
      .sort({ createdAt: -1 });
    res.json(rentals);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Approve a rental request
export const approveRentalRequest = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = (req as any).user?.userId;
    // Fetch the rental to check owner/renter
    const rental = await Rental.findById(rentalId).populate('listing').populate('renter', 'email name').populate('owner', 'email name');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // Prevent user from approving their own request (renter cannot approve their own request)
    // rental.renter and rental.owner may be ObjectId or populated object
    const renterId = rental.renter && typeof rental.renter === 'object' && 'id' in rental.renter ? rental.renter.id : rental.renter?.toString();
    const ownerId = rental.owner && typeof rental.owner === 'object' && 'id' in rental.owner ? rental.owner.id : rental.owner?.toString();
    if (renterId === userId) {
      return res.status(403).json({ error: 'You cannot approve your own rental request.' });
    }
    if (ownerId !== userId) {
      return res.status(403).json({ error: 'Only the listing owner can approve this request.' });
    }
    // Now update status
    const updatedRental = await Rental.findByIdAndUpdate(
      rentalId,
      { status: 'approved', $push: { statusHistory: { status: 'approved', by: userId, at: new Date() } } },
      { new: true }
    ).populate('listing').populate('renter', 'email name').populate('owner', 'email name');
    if (!updatedRental) return res.status(404).json({ error: 'Rental not found after update' });
    // Set listing status to 'unavailable' immediately upon approval
    if (updatedRental.listing && typeof updatedRental.listing === 'object' && '_id' in updatedRental.listing) {
      await Listing.findByIdAndUpdate((updatedRental.listing as any)._id, { status: 'unavailable' });
    }
    await Notification.create({
      user: updatedRental.renter && typeof updatedRental.renter === 'object' && '_id' in updatedRental.renter ? (updatedRental.renter as any)._id : updatedRental.renter,
      type: 'rental_status',
      message: `Your rental request for '${(updatedRental.listing && typeof updatedRental.listing === 'object' && 'title' in updatedRental.listing) ? (updatedRental.listing as any).title : ''}' was approved.`,
      data: { rental: updatedRental._id, listing: (updatedRental.listing && typeof updatedRental.listing === 'object' && '_id' in updatedRental.listing) ? (updatedRental.listing as any)._id : updatedRental.listing, status: 'approved' }
    });
    res.json(updatedRental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Decline a rental request
export const declineRentalRequest = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const userId = (req as any).user?.userId;
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      { status: 'declined', $push: { statusHistory: { status: 'declined', by: userId, at: new Date() } } },
      { new: true }
    ).populate('listing').populate('renter', 'email name').populate('owner', 'email name');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // Set listing status to 'available' on decline
    if (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) {
      await Listing.findByIdAndUpdate((rental.listing as any)._id, { status: 'available' });
    }
    await Notification.create({
      user: rental.renter && typeof rental.renter === 'object' && '_id' in rental.renter ? (rental.renter as any)._id : rental.renter,
      type: 'rental_status',
      message: `Your rental request for '${(rental.listing && typeof rental.listing === 'object' && 'title' in rental.listing) ? (rental.listing as any).title : ''}' was declined. We regret to inform you of this decision. Please contact support if you believe this is an error.`,
      data: { rental: rental._id, listing: (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) ? (rental.listing as any)._id : rental.listing, status: 'declined' }
    });
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get rental details (for admin or owner/renter)
export const getRentalDetails = async (req: Request, res: Response) => {
  try {
    const rentalId = req.params.id;
    const rental = await Rental.findById(rentalId)
      .populate('listing')
      .populate('renter', 'name profilePic')
      .populate('owner', 'name profilePic');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Update rental details (admin or owner)
export const updateRentalDetails = async (req: Request, res: Response) => {
  try {
    const rentalId = req.params.id;
    const updateData: any = req.body;
    const rental = await Rental.findByIdAndUpdate(rentalId, updateData, { new: true })
      .populate('listing')
      .populate('renter', 'name profilePic')
      .populate('owner', 'name profilePic');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Add payment info to a rental
export const addRentalPayment = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { amount, method, reference, paidAt } = req.body;
    const userId = (req as any).user?.userId;
    if (!amount || !method || !reference) {
      return res.status(400).json({ error: 'Missing payment info' });
    }
    // Update payment, status, and statusHistory atomically
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      {
        payment: { amount, method, reference, paidAt: paidAt ? new Date(paidAt) : new Date() },
        amount, // <-- Set top-level amount for transaction compatibility
        status: 'paid',
        $push: { statusHistory: { status: 'paid', by: userId, at: new Date(), note: 'Escrow payment made' } }
      },
      { new: true }
    ).populate('owner', 'name email').populate('renter', 'name email').populate('listing', 'title');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // Set listing status to 'unavailable' on payment
    if (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) {
      await Listing.findByIdAndUpdate((rental.listing as any)._id, { status: 'unavailable' });
    }
    // Create notifications for both owner and renter
    const Notification = (await import('./Notification')).default;
    // Get owner and renter IDs
    const ownerId = rental.owner && typeof rental.owner === 'object' && 'id' in rental.owner ? rental.owner.id : rental
    const renterId = rental.renter && typeof rental.renter === 'object' && 'id' in rental.renter ? rental.renter.id : rental.renter.toString();
    // Get listing title if populated
    let listingTitle = '';
    if (
      rental.listing &&
      typeof rental.listing === 'object' &&
      'title' in rental.listing &&
      typeof (rental.listing as any).title === 'string'
    ) {
      listingTitle = (rental.listing as any).title;
    }
    // Notify owner
    await Notification.create({
      user: ownerId,
      type: 'escrow_paid',
      message: `Escrow payment received for rental${listingTitle ? ` '${listingTitle}'` : ''}.`,
      createdAt: new Date(),
    });
    // Notify renter
    await Notification.create({
      user: renterId,
      type: 'escrow_paid',
      message: `You have paid escrow for rental${listingTitle ? ` '${listingTitle}'` : ''}.`,
      createdAt: new Date(),
    });

    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Add review to a rental (in addition to global reviews)
export const addRentalReview = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { by, rating, comment } = req.body;
    if (!by || !rating) {
      return res.status(400).json({ error: 'Missing review info' });
    }
    const review = { by, rating, comment, at: new Date() };
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      { $push: { reviews: review } },
      { new: true }
    );
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Export rental audit trail (PDF/CSV support)
// @ts-ignore
import PDFDocument from 'pdfkit';
// @ts-ignore
import { Parser as CsvParser } from 'json2csv';
import stream from 'stream';

export const exportRentalAudit = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { format } = req.query; // 'pdf', 'csv', or default 'json'
    const rental = await Rental.findById(rentalId)
      .populate('listing')
      .populate('renter', 'name profilePic')
      .populate('owner', 'name profilePic');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="rental_audit_${rentalId}.pdf"`);
      doc.pipe(res);
      doc.fontSize(18).text('Rental Audit Trail', { underline: true });
      doc.moveDown();
      doc.fontSize(12).text(`Rental ID: ${rental._id}`);
      // @ts-ignore
      doc.text(`Listing: ${rental.listing?.title || ''}`);
      // @ts-ignore
      doc.text(`Renter: ${rental.renter?.name || ''}`);
      // @ts-ignore
      doc.text(`Owner: ${rental.owner?.name || ''}`);
      doc.text(`Status: ${rental.status}`);
      doc.text(`Start: ${rental.startDate}`);
      doc.text(`End: ${rental.endDate}`);
      doc.moveDown();
      doc.fontSize(14).text('Status History:', { underline: true });
      (rental.statusHistory || []).forEach((s: any) => {
        doc.fontSize(12).text(`- ${s.status} by ${s.by || ''} at ${s.at ? new Date(s.at).toLocaleString() : ''} ${s.note ? '(' + s.note + ')' : ''}`);
      });
      doc.moveDown();
      doc.fontSize(14).text('Payment Info:', { underline: true });
      if (rental.payment) {
        doc.fontSize(12).text(`Amount: $${rental.payment.amount}`);
        doc.text(`Method: ${rental.payment.method}`);
        doc.text(`Reference: ${rental.payment.reference}`);
        doc.text(`Paid At: ${rental.payment.paidAt ? new Date(rental.payment.paidAt).toLocaleString() : ''}`);
      } else {
        doc.fontSize(12).text('No payment info.');
      }
      doc.moveDown();
      doc.fontSize(14).text('Messages & Evidence:', { underline: true });
      (rental.messages || []).forEach((msg: any) => {
        doc.fontSize(12).text(`- ${msg.from || msg.sender}: ${msg.message || ''} ${msg.evidence ? '[Evidence: ' + msg.evidence + ']' : ''} (${msg.at ? new Date(msg.at).toLocaleString() : ''})`);
      });
      doc.moveDown();
      doc.fontSize(14).text('Reviews:', { underline: true });
      (rental.reviews || []).forEach((rev: any) => {
        doc.fontSize(12).text(`- ${rev.by}: ${rev.rating}★ - ${rev.comment} (${rev.at ? new Date(rev.at).toLocaleString() : ''})`);
      });
      doc.end();
      return;
    } else if (format === 'csv') {
      // Generate CSV
      const fields = [
        { label: 'Rental ID', value: '_id' },
        { label: 'Listing', value: 'listing.title' },
        { label: 'Renter', value: 'renter.name' },
        { label: 'Owner', value: 'owner.name' },
        { label: 'Status', value: 'status' },
        { label: 'Start', value: 'startDate' },
        { label: 'End', value: 'endDate' },
      ];
      const flatRental: any = {
        _id: rental._id,
        // @ts-ignore
        'listing.title': rental.listing?.title || '',
        // @ts-ignore
        'renter.name': rental.renter?.name || '',
        // @ts-ignore
        'owner.name': rental.owner?.name || '',
        status: rental.status,
        startDate: rental.startDate,
        endDate: rental.endDate,
      };
      // Flatten statusHistory, payment, messages, reviews as JSON strings
      flatRental.statusHistory =
      flatRental.payment = JSON.stringify(rental.payment || {});
      flatRental.messages = JSON.stringify(rental.messages || []);
      flatRental.reviews = JSON.stringify(rental.reviews || []);
      const parser = new CsvParser({ fields: fields.concat([
        { label: 'Status History', value: 'statusHistory' },
        { label: 'Payment', value: 'payment' },
        { label: 'Messages', value: 'messages' },
        { label: 'Reviews', value: 'reviews' }
      ]) });
      const csv = parser.parse(flatRental);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="rental_audit_${rentalId}.csv"`);
      res.send(csv);
      return;
    } else {
      // Default: JSON
      res.json({ rental });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Update rental status with audit trail (overwrite original, add audit trail)
export const updateRentalStatusWithAudit = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { status, note, userId } = req.body;
    if (!['approved', 'declined', 'active', 'completed', 'cancelled', 'paid', 'in-progress'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const rental = await Rental.findById(rentalId)
      .populate('listing')
      .populate('renter', 'name profilePic')
      .populate('owner', 'name profilePic');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    rental.status = status;
    rental.statusHistory.push({ status, by: userId, at: new Date(), note });
    // Handle late returns if status is 'completed'
    if (status === 'completed') {
      const currentDate = new Date();
      if (currentDate > new Date(rental.endDate)) {
        const daysLate = Math.ceil((currentDate.getTime() - new Date(rental.endDate).getTime()) / (1000 * 60 * 60 * 24));
        const lateFee = daysLate * LATE_FEE_RATE;
        rental.lateFee = lateFee;
        // Notify both parties about late fee
        await Notification.create({
          user: rental.owner,
          type: 'late_fee',
          message: `Your rental has a late return fee of $${lateFee} applied. Please ensure the equipment is returned promptly.`,
          data: { rental: rental._id, lateFee }
        });
        await Notification.create({
          user: rental.renter,
          type: 'late_fee',
          message: `A late fee of $${lateFee} has been applied to your rental. Please return the equipment by the due date to avoid further charges.`,
          data: { rental: rental._id, lateFee }
        });
      }
      // Set listing to available on completion
      if (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) {
        await Listing.findByIdAndUpdate((rental.listing as any)._id, { status: 'available' });
      }
    }
    // Set listing to available on cancellation
    if (status === 'cancelled') {
      if (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) {
        await Listing.findByIdAndUpdate((rental.listing as any)._id, { status: 'available' });
      }
    }
    await rental.save();
    // Notify parties of completion
    if (status === 'completed') {
      await Notification.create({
        user: rental.owner,
        type: 'rental_status',
        message: `Rental for your listing has been marked as completed.`,
        data: { rental: rental._id, status: 'completed' }
      });
      await Notification.create({
        user: rental.renter,
        type: 'rental_status',
        message: `You have completed your rental. Thank you!`,
        data: { rental: rental._id, status: 'completed' }
      });
    }
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Add message/evidence to a rental
export const addRentalMessage = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { message, evidenceUrl, userId } = req.body;
    if (!message && !evidenceUrl) {
      return res.status(400).json({ error: 'Message or evidence required' });
    }
    const update: any = {};
    if (message) {
      update.$push = { messages: { from: userId, message, at: new Date() } };
    }
    if (evidenceUrl) {
      if (!update.$push) update.$push = {};
      update.$push.evidence = { url: evidenceUrl, uploadedBy: userId, at: new Date() };
    }
    const rental = await Rental.findByIdAndUpdate(rentalId, update, { new: true });
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// --- ADMIN CONTROLLERS ---
// Admin: Get all users
export const adminGetAllUsers = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const users = await User.find().select('-password');
    res.json({ users }); // <-- Ensure response is { users: [...] }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: Get all admins
export const getAdmins = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const admins = await User.find({ isAdmin: true }).select('-password');
    res.json(admins);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: Get all listings
export const adminGetAllListings = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const listings = await Listing.find().populate('owner', 'name email');
    res.json({ listings }); // Return as { listings: [...] }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: Delete a listing (soft delete)
export const adminDeleteListing = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const listingId = req.params.id;
    // Check for in-progress rentals
    const inProgressRental = await Rental.findOne({
      listing: listingId,
      status: { $nin: ['completed', 'cancelled', 'declined'] }
    });
    if (inProgressRental) {
      return res.status(400).json({ error: 'Cannot delete listing: there are active or pending rentals. Please cancel or complete all rentals first.' });
    }
    const listing = await Listing.findByIdAndUpdate(
      listingId,
      { deleted: true, deletedAt: new Date() },
      { new: true }
    );
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin
export const adminGetAnalytics = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const userCount = await User.countDocuments();
    const listingCount = await Listing.countDocuments();
    const rentalCount = await Rental.countDocuments();
    // Rentals currently available: not completed, cancelled, or declined
    const availableRentalStatuses = ['pending', 'approved', 'paid', 'active', 'in-progress'];
    const availableRentals = await Rental.countDocuments({ status: { $in: availableRentalStatuses } });
    const activeRentals = await Rental.countDocuments({ status: { $in: ['active', 'in-progress'] } });
    const completedRentals = await Rental.countDocuments({ status: 'completed' });
    res.json({ userCount, listingCount, rentalCount, availableRentals, activeRentals, completedRentals });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: Get all rentals
export const adminGetAllRentals = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const rentals = await Rental.find()
      .populate('listing')
      .populate('owner', 'email name')
      .populate('renter', 'email name')
      .sort({ createdAt: -1 });
    res.json({ rentals });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: Update rental status
export const adminUpdateRentalStatus = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    // Use the same logic as updateRentalStatusWithAudit
    req.body.adminOverride = true;
    return updateRentalStatusWithAudit(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Direct user-to-user messaging (not tied to a listing)
export const sendUserMessage = async (req: Request, res: Response) => {
  try {
    const fromUser = (req as any).user?.userId;
    const { toUserId, message } = req.body;
    if (!fromUser) return res.status(401).json({ error: 'User not authenticated' });
    if (!toUserId || !message) return res.status(400).json({ error: 'Recipient and message required' });
    if (String(fromUser) === String(toUserId)) {
      return res.status(400).json({ error: 'You cannot message yourself.' });
    }
    // Optionally: check if recipient exists
    const recipient = await User.findById(toUserId);
    if (!recipient) return res.status(404).json({ error: 'Recipient not found' });
    const msg = new UserMessage({
      fromUser,
      toUser: toUserId,
      message,
      createdAt: new Date(),
      read: false,
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Listing-based messaging (pre-rental)
export const sendListingMessage = async (req: Request, res: Response) => {
  try {
    const fromUser = (req as any).user?.userId;
    const { message, toUserId } = req.body;
    const listingId = req.params.id;
    if (!fromUser) return res.status(401).json({ error: 'User not authenticated' });
    if (!message) return res.status(400).json({ error: 'Message required' });
    // Find the listing and owner
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    const ownerId = typeof listing.owner === 'object' ? String(listing.owner._id || listing.owner.id) : String(listing.owner);
    // Determine recipient
    const recipient = toUserId || ownerId;
    // Prevent messaging self
    if (String(fromUser) === String(recipient)) {
      return res.status(400).json({ error: 'You cannot message yourself.' });
    }
    // Optionally: check if recipient exists
    const recipientUser = await User.findById(recipient);
    if (!recipientUser) return res.status(404).json({ error: 'Recipient not found' });
    // Save message
    const msg = new ListingMessage({
      listing: listingId,
      fromUser,
      toUser: recipient,
      message: message,
      createdAt: new Date(),
      read: false,
    });
    await msg.save();
    // Create notification for recipient only
    await Notification.create({
      user: recipient,
      type: 'message',
      message: `You have a new message about a listing.`,
      data: {
        listing: listingId,
        fromUser,
        messageId: msg._id
      },
      read: false,
      createdAt: new Date()
    });
    res.status(201).json(msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

export const getListingMessages = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    // Optionally: restrict to users involved in the listing
    const messages = await ListingMessage.find({ listing: listingId })
      .sort({ createdAt: 1 })
      .populate('fromUser', 'name email')
      .populate('toUser', 'name email');
    res.json(messages);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Mark all messages in a listing conversation as read for the recipient
export const markListingMessagesRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const listingId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    await ListingMessage.updateMany({ listing: listingId, toUser: userId, read: false }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Mark all direct user-to-user messages as read for the recipient
export const markUserMessagesRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const otherUserId = req.params.id;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    await UserMessage.updateMany({
      $or: [
        { fromUser: otherUserId, toUser: userId, read: false },
        { fromUser: userId, toUser: otherUserId, read: false }
      ]
    }, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: Delete a user and all their listings (except admin)
export const adminDeleteUser = async (req: Request, res: Response) => {
  try {
    const adminId = (req as any).user?.userId;
    const adminUser = await User.findById(adminId);
    if (!adminUser || !adminUser.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    // Prevent deleting admin users
    if (user.isAdmin) return res.status(400).json({ error: 'Cannot delete admin user' });
    // Soft delete all listings owned by the user
    await Listing.updateMany({ owner: userId }, { deleted: true, deletedAt: new Date() });
    // Optionally: Remove user's favorites, reviews, and rentals (or anonymize)
    await Favorite.deleteMany({ user: userId });
    await Review.deleteMany({ reviewer: userId });
    await Rental.deleteMany({ $or: [{ renter: userId }, { owner: userId }] });
    await UserMessage.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] });
    await ListingMessage.deleteMany({ $or: [{ fromUser: userId }, { toUser: userId }] });
    // Finally, delete the user
    await User.findByIdAndDelete(userId);
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get all received messages (listing-based and direct)
export const getReceivedMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    // Fetch direct user-to-user messages
    const userMessages = await UserMessage.find({ toUser: userId })
      .populate('fromUser', 'name email')
      .sort({ createdAt: -1 });
    // Fetch listing-based messages
    const listingMessages = await ListingMessage.find({ toUser: userId })
      .populate('fromUser', 'name email')
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
    // Combine and sort all messages by createdAt descending
    const allMessages = [...userMessages, ...listingMessages].sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    res.json({ messages: allMessages });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};