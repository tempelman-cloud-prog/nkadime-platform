import mongoose, { Schema, Document } from 'mongoose';

export interface IRental extends Document {
  listing: mongoose.Types.ObjectId; // Reference to Listing
  renter: mongoose.Types.ObjectId; // Reference to User (who rents)
  owner: mongoose.Types.ObjectId; // Reference to User (listing owner)
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'approved' | 'declined' | 'active' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const RentalSchema: Schema = new Schema({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  renter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined', 'active', 'completed', 'cancelled'],
    default: 'pending',
  },
}, { timestamps: true });

export default mongoose.model<IRental>('Rental', RentalSchema);
