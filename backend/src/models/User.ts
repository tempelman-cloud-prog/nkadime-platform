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
  bio?: string; // Add bio to interface
  suspended?: boolean; // Add suspended to interface
  mapPosition?: [number, number] | null; // Add mapPosition to interface
  showMapLocation?: boolean; // Add showMapLocation to interface
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
  location: { type: String },
  bio: { type: String, default: '' }, // Add bio to schema
  suspended: { type: Boolean, default: false }, // Add suspended to schema
  mapPosition: {
    type: [Number],
    default: null,
    validate: {
      validator: function (arr: any) {
        return arr === null || (Array.isArray(arr) && arr.length === 2 && arr.every((n: any) => typeof n === 'number'));
      },
      message: 'mapPosition must be [lat, lng] or null',
    },
  },
  showMapLocation: { type: Boolean, default: false },
});

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
