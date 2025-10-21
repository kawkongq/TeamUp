import mongoose, { Document, Schema } from 'mongoose';

export interface IChat extends Document {
  _id: string;
  senderId: string;
  receiverId: string;
  lastMessage?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ChatSchema = new Schema<IChat>({
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  receiverId: {
    type: String,
    required: true,
    ref: 'User'
  },
  lastMessage: {
    type: String
  },
  lastMessageAt: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ChatSchema.index({ senderId: 1, receiverId: 1 });
ChatSchema.index({ senderId: 1 });
ChatSchema.index({ receiverId: 1 });
ChatSchema.index({ lastMessageAt: -1 });

export default mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);