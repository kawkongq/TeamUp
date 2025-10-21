import mongoose, { Schema, Document } from 'mongoose';

export interface IMatch extends Document {
  userAId: string;
  userBId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MatchSchema: Schema = new Schema({
  userAId: {
    type: String,
    required: true
  },
  userBId: {
    type: String,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
MatchSchema.index({ userAId: 1, userBId: 1 }, { unique: true });

export default mongoose.models.Match || mongoose.model<IMatch>('Match', MatchSchema);