import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash?: string | null;
  role: 'user' | 'organizer' | 'admin';
  avatar?: string;
  isActive: boolean;
  provider: 'credentials' | 'google' | 'hybrid';
  googleId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  passwordHash: {
    type: String,
    minlength: 6,
    default: null,
    required: function (this: { provider: string }) {
      return this.provider === 'credentials' || this.provider === 'hybrid';
    }
  },
  role: {
    type: String,
    enum: ['user', 'organizer', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: null
  },
  provider: {
    type: String,
    enum: ['credentials', 'google', 'hybrid'],
    default: 'credentials',
    index: true
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
