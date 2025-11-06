// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import User from '@/models/User';
import Profile from '@/models/Profile';
import mongoose from 'mongoose';

// GET - Get messages for a specific chat
export async function GET(
  request: NextRequest,
  context: any,
) {
  try {
    await connectDB();
    
    const { chatId } = context.params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const before = searchParams.get('before');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Verify user is part of this chat
    const chat = await Chat.findById(chatId).lean();

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    if (chat.senderId !== userId && chat.receiverId !== userId) {
      return NextResponse.json(
        { error: 'Access denied to this chat' },
        { status: 403 }
      );
    }

    // Build query for messages
    const query: any = { chatId };
    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Mark messages as read if they're from the other user
    const unreadMessages = messages.filter(
      m => !m.isRead && m.senderId !== userId
    );

    if (unreadMessages.length > 0) {
      await Message.updateMany(
        { _id: { $in: unreadMessages.map(m => m._id) } },
        { isRead: true, readAt: new Date() }
      );
    }

    // Format messages with sender details
    const formattedMessages = await Promise.all(
      messages.map(async (message) => {
        const sender = await User.findById(message.senderId).lean();
        const senderProfile = await Profile.findOne({ userId: message.senderId }).lean();

        return {
          id: message._id.toString(),
          content: message.content,
          messageType: message.messageType,
          isRead: message.isRead,
          createdAt: message.createdAt,
          sender: {
            id: sender?._id.toString(),
            name: sender?.name,
            email: sender?.email,
            profile: senderProfile
          },
          isFromMe: message.senderId === userId
        };
      })
    );

    // Update chat's updatedAt timestamp
    await Chat.findByIdAndUpdate(chatId, { 
      updatedAt: new Date(),
      lastMessage: formattedMessages[0]?.content,
      lastMessageAt: new Date()
    });

    return NextResponse.json({
      success: true,
      messages: formattedMessages.reverse(), // Reverse to show oldest first
      hasMore: formattedMessages.length === limit
    });

  } catch (error) {
    console.error('[Messages API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Send a new message
export async function POST(
  request: NextRequest,
  context: any,
) {
  try {
    await connectDB();
    
    const { chatId } = context.params;
    const body = await request.json();
    const { senderId, content, messageType = 'text' } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        { error: 'Sender ID and content are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(chatId) || !mongoose.Types.ObjectId.isValid(senderId)) {
      return NextResponse.json({ error: 'Invalid IDs' }, { status: 400 });
    }

    // Verify user is part of this chat
    const chat = await Chat.findById(chatId).lean();

    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }

    if (chat.senderId !== senderId && chat.receiverId !== senderId) {
      return NextResponse.json(
        { error: 'Access denied to this chat' },
        { status: 403 }
      );
    }

    // Create the message
    const message = new Message({
      chatId,
      senderId,
      content: content.trim(),
      messageType,
      isRead: false
    });

    await message.save();

    // Update chat's updatedAt timestamp and last message
    await Chat.findByIdAndUpdate(chatId, { 
      updatedAt: new Date(),
      lastMessage: content.trim(),
      lastMessageAt: new Date()
    });

    // Get sender details for response
    const sender = await User.findById(senderId).lean();
    const senderProfile = await Profile.findOne({ userId: senderId }).lean();

    // Format the response
    const formattedMessage = {
      id: message._id.toString(),
      content: message.content,
      messageType: message.messageType,
      isRead: message.isRead,
      createdAt: message.createdAt,
      sender: {
        id: sender?._id.toString(),
        name: sender?.name,
        email: sender?.email,
        profile: senderProfile
      },
      isFromMe: true
    };

    return NextResponse.json({
      success: true,
      message: formattedMessage
    });

  } catch (error) {
    console.error('[Messages API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to send message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
