// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import User from '@/models/User';
import Profile from '@/models/Profile';
import mongoose from 'mongoose';
import { createOrGetChat, listChatsForUser } from '@/services/chat-service';

// GET - Get all chats for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const chats = await listChatsForUser(userId, {
      chatModel: Chat,
      messageModel: Message,
      userModel: User,
      profileModel: Profile,
    });

    return NextResponse.json({
      success: true,
      chats,
    });

  } catch (error) {
    console.error('[Chat API] GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST - Create a new chat or get existing chat
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const body = await request.json();
    const { senderId, receiverId } = body;

    if (!senderId || !receiverId) {
      return NextResponse.json(
        { error: 'Sender ID and receiver ID are required' },
        { status: 400 }
      );
    }

    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(senderId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return NextResponse.json({ error: 'Invalid user IDs' }, { status: 400 });
    }

    if (senderId === receiverId) {
      return NextResponse.json(
        { error: 'Cannot create chat with yourself' },
        { status: 400 }
      );
    }

    const { chat, isNew } = await createOrGetChat(
      { senderId, receiverId },
      {
        chatModel: Chat,
        userModel: User,
        profileModel: Profile,
      },
    );

    return NextResponse.json({
      success: true,
      chat,
      isNew,
    });

  } catch (error) {
    console.error('[Chat API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create/get chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
