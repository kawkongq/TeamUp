import mongoose, { Document, Schema } from 'mongoose';

export interface IInterest extends Document {
  _id: string;
  name: string;
  category: string;
  icon?: string;
}

const InterestSchema = new Schema<IInterest>({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String
  }
}, {
  timestamps: true
});

// Indexes
InterestSchema.index({ name: 1 });
InterestSchema.index({ category: 1 });

export default mongoose.models.Interest || mongoose.model<IInterest>('Interest', InterestSchema);