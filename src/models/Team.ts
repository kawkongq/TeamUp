import mongoose, { Document, Schema } from 'mongoose';

export interface ITeam extends Document {
  _id: string;
  name: string;
  description: string;
  eventId: string;
  ownerId: string;
  maxMembers: number;
  tags: string;
  lookingFor: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeamSchema = new Schema<ITeam>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  eventId: {
    type: String,
    required: true,
    ref: 'Event'
  },
  ownerId: {
    type: String,
    required: true,
    ref: 'User'
  },
  maxMembers: {
    type: Number,
    required: true,
    min: 1,
    max: 20
  },
  tags: {
    type: String,
    required: true,
    trim: true
  },
  lookingFor: {
    type: String,
    required: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
TeamSchema.index({ name: 1 });
TeamSchema.index({ eventId: 1 });
TeamSchema.index({ ownerId: 1 });
TeamSchema.index({ isActive: 1 });

export default mongoose.models.Team || mongoose.model<ITeam>('Team', TeamSchema);