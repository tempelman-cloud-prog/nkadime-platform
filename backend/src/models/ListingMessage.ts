import mongoose, { Schema, Document } from 'mongoose';

export interface IListingMessage extends Document {
  listing: mongoose.Types.ObjectId;
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const ListingMessageSchema = new Schema<IListingMessage>({
  listing: { type: Schema.Types.ObjectId, ref: 'Listing', required: true },
  fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IListingMessage>('ListingMessage', ListingMessageSchema);
