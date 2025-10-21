import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamInvitation extends Document {
  _id: string;
  teamId: string;
  inviterId: string;
  inviteeId: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  respondedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TeamInvitationSchema = new Schema<ITeamInvitation>({
  teamId: {
    type: String,
    required: true,
    ref: 'Team'
  },
  inviterId: {
    type: String,
    required: true,
    ref: 'User'
  },
  inviteeId: {
    type: String,
    required: true,
    ref: 'User'
  },
  message: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled'],
    default: 'pending'
  },
  respondedAt: {
    type: Date
  },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
  }
}, {
  timestamps: true
});

// Indexes
TeamInvitationSchema.index({ teamId: 1 });
TeamInvitationSchema.index({ inviterId: 1 });
TeamInvitationSchema.index({ inviteeId: 1 });
TeamInvitationSchema.index({ status: 1 });
TeamInvitationSchema.index({ expiresAt: 1 });

export default mongoose.models.TeamInvitation || mongoose.model<ITeamInvitation>('TeamInvitation', TeamInvitationSchema);