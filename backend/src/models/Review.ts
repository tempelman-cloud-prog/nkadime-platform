import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  listing: mongoose.Types.ObjectId;
  reviewer: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
  images?: string[];
  createdAt: Date;
}

const ReviewSchema: Schema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String },
  images: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
