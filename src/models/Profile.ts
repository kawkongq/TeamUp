import mongoose, { Schema, Document } from 'mongoose';

export interface IProfile extends Document {
  userId: string;
  displayName: string;
  bio: string;
  role: string;
  avatar?: string;
  location: string;
  experience: string;
  hourlyRate?: number;
  availability: string;
  timezone: string;
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
  skills: string[];
  interests: string[];
  isAvailable: boolean;
  rating: number;
  projectsCompleted: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProfileSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true,
    trim: true
  },
  bio: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    required: true
  },
  avatar: {
    type: String,
    default: null
  },
  location: {
    type: String,
    default: ''
  },
  experience: {
    type: String,
    default: ''
  },
  hourlyRate: {
    type: Number,
    default: null
  },
  availability: {
    type: String,
    default: 'available'
  },
  timezone: {
    type: String,
    default: 'UTC'
  },
  links: {
    github: String,
    linkedin: String,
    portfolio: String
  },
  skills: [{
    type: String
  }],
  interests: [{
    type: String
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  rating: {
    type: Number,
    default: 0
  },
  projectsCompleted: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.models.Profile || mongoose.model<IProfile>('Profile', ProfileSchema);