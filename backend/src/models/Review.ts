import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  listing?: mongoose.Types.ObjectId; // Optional for user reviews
  reviewer: mongoose.Types.ObjectId;
  reviewedUser?: mongoose.Types.ObjectId; // New: user being reviewed
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: false },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reviewedUser: { type: Schema.Types.ObjectId, ref: 'User', required: false }, // New
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
