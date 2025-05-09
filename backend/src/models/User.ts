import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone?: string;
  isVerified: boolean;
  isAdmin: boolean;
  createdAt: Date;
  profilePic?: string;
  location?: string;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  isVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  profilePic: { type: String },
  location: { type: String }
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
