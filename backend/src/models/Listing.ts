import mongoose, { Schema, Document } from 'mongoose';

export interface IListing extends Document {
  owner: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: string;
  images: string[];
  price: number;
  priceUnit: string;
  location: string;
  status: 'available' | 'pending approval' | 'unavailable';
  createdAt: Date;
}

const ListingSchema: Schema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  images: [{ type: String }],
  price: { type: Number, required: true },
  priceUnit: { type: String, default: 'day' },
  location: { type: String, required: true },
  status: { type: String, enum: ['available', 'pending approval', 'unavailable'], default: 'available' },
  createdAt: { type: Date, default: Date.now }
});

const Listing = mongoose.model<IListing>('Listing', ListingSchema);
export default Listing;
