import mongoose, { Schema, Document } from 'mongoose';

export interface IRental extends Document {
  listing: Schema.Types.ObjectId;
  owner: Schema.Types.ObjectId;
  renter: Schema.Types.ObjectId;
  status: string;
  statusHistory: Array<{
    status: string;
    by: Schema.Types.ObjectId;
    at: Date;
    note?: string;
  }>;
  payment?: {
    amount: number;
    method: string;
    reference: string;
    paidAt: Date;
  };
  messages: Array<{
    from: Schema.Types.ObjectId;
    message: string;
    at: Date;
  }>;
  evidence: Array<{
    url: string;
    uploadedBy: Schema.Types.ObjectId;
    at: Date;
  }>;
  reviews: Array<{
    by: Schema.Types.ObjectId;
    rating: number;
    comment: string;
    at: Date;
  }>;
  dispute?: {
    raisedBy?: Schema.Types.ObjectId;
    reason?: string;
    evidenceUrl?: string;
    status?: 'open' | 'resolved' | 'rejected';
    resolution?: string;
    resolvedBy?: Schema.Types.ObjectId;
    raisedAt?: Date;
    resolvedAt?: Date;
  };
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RentalSchema = new Schema<IRental>({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  renter: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'declined', 'paid', 'active', 'in-progress', 'completed', 'cancelled'], default: 'pending' },
  statusHistory: [
    {
      status: { type: String, required: true },
      by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      at: { type: Date, default: Date.now },
      note: { type: String },
    }
  ],
  payment: {
    amount: Number,
    method: String,
    reference: String,
    paidAt: Date,
  },
  messages: [
    {
      from: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      message: { type: String, required: true },
      at: { type: Date, default: Date.now },
    }
  ],
  evidence: [
    {
      url: { type: String, required: true },
      uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      at: { type: Date, default: Date.now },
    }
  ],
  reviews: [
    {
      by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      rating: { type: Number, required: true },
      comment: { type: String },
      at: { type: Date, default: Date.now },
    }
  ],
  dispute: {
    raisedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reason: { type: String },
    evidenceUrl: { type: String },
    status: { type: String, enum: ['open', 'resolved', 'rejected'], default: 'open' },
    resolution: { type: String },
    resolvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    raisedAt: { type: Date },
    resolvedAt: { type: Date },
  },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
}, { timestamps: true });

export default mongoose.model<IRental>('Rental', RentalSchema);
