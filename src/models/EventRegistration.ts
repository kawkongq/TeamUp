import mongoose, { Document, Schema } from 'mongoose';

export interface IEventRegistration extends Document {
  _id: string;
  eventId: string;
  teamId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>({
  eventId: {
    type: String,
    required: true,
    ref: 'Event'
  },
  teamId: {
    type: String,
    required: true,
    ref: 'Team'
  },
  status: {
    type: String,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    default: 'PENDING'
  },
  message: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate registrations
EventRegistrationSchema.index({ eventId: 1, teamId: 1 }, { unique: true });
EventRegistrationSchema.index({ eventId: 1 });
EventRegistrationSchema.index({ teamId: 1 });
EventRegistrationSchema.index({ status: 1 });

export default mongoose.models.EventRegistration || mongoose.model<IEventRegistration>('EventRegistration', EventRegistrationSchema);