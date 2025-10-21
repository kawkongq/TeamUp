import mongoose, { Document, Schema } from 'mongoose';

export interface IJoinRequest extends Document {
  _id: string;
  teamId: string;
  userId: string;
  message?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const JoinRequestSchema = new Schema<IJoinRequest>({
  teamId: {
    type: String,
    required: true,
    ref: 'Team'
  },
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  message: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
JoinRequestSchema.index({ teamId: 1 });
JoinRequestSchema.index({ userId: 1 });
JoinRequestSchema.index({ status: 1 });
JoinRequestSchema.index({ teamId: 1, userId: 1 }, { unique: true });

export default mongoose.models.JoinRequest || mongoose.model<IJoinRequest>('JoinRequest', JoinRequestSchema);