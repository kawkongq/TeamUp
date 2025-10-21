import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  _id: string;
  chatId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>({
  chatId: {
    type: String,
    required: true,
    ref: 'Chat'
  },
  senderId: {
    type: String,
    required: true,
    ref: 'User'
  },
  content: {
    type: String,
    required: true
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'file'],
    default: 'text'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  readAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ isRead: 1 });

export default mongoose.models.Message || mongoose.model<IMessage>('Message', MessageSchema);