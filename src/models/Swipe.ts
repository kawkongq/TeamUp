import mongoose, { Schema, Document } from 'mongoose';

export interface ISwipe extends Document {
  swiperId: string;
  swipeeId: string;
  direction: 'LIKE' | 'PASS';
  createdAt: Date;
  updatedAt: Date;
}

const SwipeSchema: Schema = new Schema({
  swiperId: {
    type: String,
    required: true
  },
  swipeeId: {
    type: String,
    required: true
  },
  direction: {
    type: String,
    enum: ['LIKE', 'PASS'],
    required: true
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
SwipeSchema.index({ swiperId: 1, swipeeId: 1 }, { unique: true });

export default mongoose.models.Swipe || mongoose.model<ISwipe>('Swipe', SwipeSchema);