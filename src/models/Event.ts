import mongoose, { Document, Schema } from 'mongoose';

export interface IEvent extends Document {
  _id: string;
  name: string;
  description?: string;
  type: string;
  category?: string;
  tags?: string;
  startDate: Date;
  endDate: Date;
  location?: string;
  imageUrl?: string;
  maxTeams?: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  type: {
    type: String,
    required: true,
    enum: ['hackathon', 'case-competition', 'innovation-challenge', 'conference', 'meetup', 'workshop']
  },
  category: {
    type: String,
    trim: true
  },
  tags: {
    type: String,
    trim: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  location: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  maxTeams: {
    type: Number,
    min: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
EventSchema.index({ name: 1 });
EventSchema.index({ type: 1 });
EventSchema.index({ isActive: 1 });
EventSchema.index({ startDate: 1 });
EventSchema.index({ endDate: 1 });

export default mongoose.models.Event || mongoose.model<IEvent>('Event', EventSchema);