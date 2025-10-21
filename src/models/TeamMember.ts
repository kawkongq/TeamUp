import mongoose, { Document, Schema } from 'mongoose';

export interface ITeamMember extends Document {
  _id: string;
  teamId: string;
  userId: string;
  role: string;
  joinedAt: Date;
  isActive: boolean;
}

const TeamMemberSchema = new Schema<ITeamMember>({
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
  role: {
    type: String,
    required: true,
    default: 'member'
  },
  joinedAt: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicate memberships
TeamMemberSchema.index({ teamId: 1, userId: 1 }, { unique: true });
TeamMemberSchema.index({ teamId: 1 });
TeamMemberSchema.index({ userId: 1 });

export default mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);