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
import ListingMessage from './ListingMessage';

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
    // Always return the updated user object in a consistent format
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      location: user.location,
      profilePic: user.profilePic,
      bio: user.bio
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

// Delete Listing
export const deleteListing = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const listing = await Listing.findByIdAndDelete(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    // Optionally: remove associated favorites, reviews, notifications, etc.
    res.json({ success: true });
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
    // Mark the listing as unavailable (pending)
    await Listing.findByIdAndUpdate(listing, { available: false });
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
    const userId = (req as any).user?.userId;
    const rentals = await Rental.find({ renter: userId })
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
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      { status: 'approved', $push: { statusHistory: { status: 'approved', by: userId, at: new Date() } } },
      { new: true }
    ).populate('listing').populate('renter', 'email name').populate('owner', 'email name');
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // Mark the listing as unavailable (rented)
    if (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) {
      await Listing.findByIdAndUpdate((rental.listing as any)._id, { available: false });
    }
    await Notification.create({
      user: rental.renter && typeof rental.renter === 'object' && '_id' in rental.renter ? (rental.renter as any)._id : rental.renter,
      type: 'rental_status',
      message: `Your rental request for '${(rental.listing && typeof rental.listing === 'object' && 'title' in rental.listing) ? (rental.listing as any).title : ''}' was approved.`,
      data: { rental: rental._id, listing: (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) ? (rental.listing as any)._id : rental.listing, status: 'approved' }
    });
    res.json(rental);
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
    // If declined, mark the listing as available again
    if (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) {
      await Listing.findByIdAndUpdate((rental.listing as any)._id, { available: true });
    }
    await Notification.create({
      user: rental.renter && typeof rental.renter === 'object' && '_id' in rental.renter ? (rental.renter as any)._id : rental.renter,
      type: 'rental_status',
      message: `Your rental request for '${(rental.listing && typeof rental.listing === 'object' && 'title' in rental.listing) ? (rental.listing as any).title : ''}' was declined.`,
      data: { rental: rental._id, listing: (rental.listing && typeof rental.listing === 'object' && '_id' in rental.listing) ? (rental.listing as any)._id : rental.listing, status: 'declined' }
    });
    res.json(rental);
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
      const listingId = rental.listing instanceof mongoose.Types.ObjectId
        ? rental.listing.toString()
        : ((rental.listing as any)?._id ?? rental.listing);
      await Notification.create({
        // @ts-ignore
        user: rental.renter._id || rental.renter,
        type: 'rental_status',
        message: `Your rental request for '${listingTitle}' was ${status}.`,
        data: { rental: rental._id, listing: listingId, status }
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

// Add payment info to a rental
export const addRentalPayment = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { amount, method, reference, paidAt } = req.body;
    if (!amount || !method || !reference) {
      return res.status(400).json({ error: 'Missing payment info' });
    }
    const rental = await Rental.findByIdAndUpdate(
      rentalId,
      { payment: { amount, method, reference, paidAt: paidAt ? new Date(paidAt) : new Date() } },
      { new: true }
    );
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
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
      flatRental.statusHistory = JSON.stringify(rental.statusHistory || []);
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
    await rental.save();
    // --- Notification: Notify renter of approval/decline ---
    if (['approved', 'declined'].includes(status)) {
      let listingTitle = '';
      if (rental.listing && typeof rental.listing === 'object' && 'title' in rental.listing && typeof (rental.listing as any).title === 'string') {
        listingTitle = (rental.listing as any).title;
      } else {
        listingTitle = 'your listing';
      }
      // Use type guard to extract listingId safely
      const listingId = rental.listing instanceof mongoose.Types.ObjectId
        ? rental.listing.toString()
        : ((rental.listing as any)?._id ?? rental.listing);
      await Notification.create({
        user: rental.renter,
        type: 'rental_status',
        message: `Your rental request for '${listingTitle}' was ${status}.`,
        data: { rental: rental._id, listing: listingId, status }
      });
    }
    res.json(rental);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Pre-rental messaging: send a message to the listing owner
export const sendListingMessage = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const { message } = req.body;
    const userId = (req as any).user?.userId || req.body.userId; // from auth middleware or body
    if (!message) return res.status(400).json({ error: 'Message is required' });
    // Find listing and owner
    const listing = await Listing.findById(listingId);
    if (!listing) return res.status(404).json({ error: 'Listing not found' });
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    // Don't allow owner to message themselves
    if (String(listing.owner) === String(userId)) {
      return res.status(400).json({ error: 'You cannot message yourself about your own listing.' });
    }
    const msg = new ListingMessage({
      listing: listingId,
      fromUser: userId,
      toUser: listing.owner,
      message,
      createdAt: new Date(),
      read: false
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Pre-rental messaging: get all messages for a listing
export const getListingMessages = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.id;
    const userId = (req as any).user?.userId || req.query.userId;
    // Only allow owner or users who have messaged to see messages
    const listing = await Listing.findById(listingId);
    if (!listing) return res
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    // Mark all messages to this user for this listing as read
    await ListingMessage.updateMany({ listing: listingId, toUser: userId, read: { $ne: true } }, { $set: { read: true } });
    // Fetch messages where user is owner or fromUser
    const messages = await ListingMessage.find({
      listing: listingId,
      $or: [
        { fromUser: userId },
        { toUser: userId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('fromUser', 'name email profilePic')
      .populate('toUser', 'name email profilePic');
    res.json(messages);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Fetch all messages received by a user (as toUser) - only latest per (fromUser, listing), add unread count logic
export const getReceivedListingMessages = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || req.params.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    // Get only the latest message per (fromUser, listing)
    const pipeline = [
      { $match: { toUser: typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId } },
      { $sort: { createdAt: -1 as 1 | -1 } },
      { $group: {
        _id: { fromUser: "$fromUser", listing: "$listing" },
        doc: { $first: "$$ROOT" },
        unreadCount: {
          $sum: { $cond: [ { $eq: [ "$read", false ] }, 1, 0 ] }
        }
      }},
      { $replaceRoot: { newRoot: { $mergeObjects: [ "$doc", { unreadCount: "$unreadCount" } ] } } },
      { $sort: { createdAt: -1 as 1 | -1 } }
    ];
    const messages = await ListingMessage.aggregate(pipeline);
    // Populate fromUser and listing fields
    await ListingMessage.populate(messages, [
      { path: 'fromUser', select: 'name email profilePic' },
      { path: 'listing', select: 'title' }
    ]);
    res.json(messages);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Mark all messages from a user for a listing as read (when opening conversation)
export const markListingMessagesRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    const { listingId, fromUserId } = req.body;
    if (!userId || !listingId || !fromUserId) return res.status(400).json({ error: 'Missing params' });
    await ListingMessage.updateMany(
      { toUser: userId, listing: listingId, fromUser: fromUserId, read: { $ne: true } },
      { $set: { read: true } }
    );
    res.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get unread message count for navbar badge
export const getUnreadMessageCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId;
    if (!userId) return res.status(401).json({ error: 'User not authenticated' });
    const count = await ListingMessage.countDocuments({ toUser: userId, read: { $ne: true } });
    res.json({ count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Raise a dispute on a rental
export const raiseDispute = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { reason, evidenceUrl } = req.body;
    const userId = (req as any).user?.userId || req.body.userId;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const rental = await Rental.findById(rentalId);
    if (!rental) return res.status(404).json({ error: 'Rental not found' });
    // Only owner or renter can raise dispute
    if (String(rental.owner) !== String(userId) && String(rental.renter) !== String(userId)) {
      return res.status(403).json({ error: 'Not authorized to dispute this rental' });
    }
    rental.dispute = {
      raisedBy: userId,
      reason,
      evidenceUrl,
      status: 'open',
      raisedAt: new Date(),
    };
    rental.status = 'disputed';
    await rental.save();
    // Notify admin (all admins)
    const admins = await User.find({ isAdmin: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        type: 'dispute_raised',
        message: `A dispute was raised for rental ${rental._id}.`,
        data: { rental: rental._id }
      });
    }
    res.json({ success: true, rental });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: resolve a dispute
export const resolveDispute = async (req: Request, res: Response) => {
  try {
    const { rentalId } = req.params;
    const { resolution, status } = req.body;
    const userId = (req as any).user?.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const rental = await Rental.findById(rentalId);
    if (!rental || !rental.dispute) return res.status(404).json({ error: 'Dispute not found' });
    rental.dispute.status = status;
    rental.dispute.resolution = resolution;
    rental.dispute.resolvedBy = userId;
    rental.dispute.resolvedAt = new Date();
    await rental.save();
    // Notify involved parties
    for (const party of [rental.owner, rental.renter]) {
      await Notification.create({
        user: party,
        type: 'dispute_resolved',
        message: `Dispute for rental ${rental._id} was ${status}.`,
        data: { rental: rental._id, status, resolution }
      });
    }
    res.json({ success: true, rental });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Admin: fetch all open disputes
export const getOpenDisputes = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.userId || req.body.userId;
    const user = await User.findById(userId);
    if (!user || !user.isAdmin) return res.status(403).json({ error: 'Admin only' });
    const disputes = await Rental.find({ 'dispute.status': 'open' })
      .populate('listing')
      .populate('owner', 'name email')
      .populate('renter', 'name email')
      .lean();
    res.json({ disputes });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};
// Reply to a message in a conversation (send a message from current user to toUserId for a listing)
export const replyToListingMessage = async (req: Request, res: Response) => {
  try {
    const listingId = req.params.listingId;
    const { toUserId, message } = req.body;
    const fromUserId = (req as any).user?.userId;
    if (!fromUserId) return res.status(401).json({ error: 'User not authenticated' });
    if (!toUserId || !message) return res.status(400).json({ error: 'Missing toUserId or message' });
    if (!listingId) return res.status(400).json({ error: 'Missing listingId' });
    // Don't allow sending to self
    if (String(fromUserId) === String(toUserId)) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }
    const msg = new ListingMessage({
      listing: listingId,
      fromUser: fromUserId,
      toUser: toUserId,
      message,
      createdAt: new Date(),
      read: false
    });
    await msg.save();
    res.status(201).json(msg);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};

// Get user stats: successful transactions, dispute count, average rating
export const getUserStats = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId) return res.status(400).json({ error: 'Missing userId' });
    // Successful transactions (as owner or renter)
    const successful = await Rental.countDocuments({
      $or: [ { owner: userId }, { renter: userId } ],
      status: 'completed'
    });
    // Dispute count (as owner or renter)
    const disputes = await Rental.countDocuments({
      $or: [ { owner: userId }, { renter: userId } ],
      'dispute.status': { $exists: true, $ne: null }
    });
    // Average rating (reuse existing logic)
    const result = await Review.aggregate([
      { $match: { reviewedUser: userId } },
      { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const avgRating = result.length > 0 ? result[0].avg : null;
    const ratingCount = result.length > 0 ? result[0].count : 0;
    res.json({ successful, disputes, avgRating, ratingCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(400).json({ error: message });
  }
};