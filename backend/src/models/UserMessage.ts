import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMessage extends Document {
  fromUser: mongoose.Types.ObjectId;
  toUser: mongoose.Types.ObjectId;
  message: string;
  createdAt: Date;
}

const UserMessageSchema = new Schema<IUserMessage>({
  fromUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  toUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IUserMessage>('UserMessage', UserMessageSchema);
