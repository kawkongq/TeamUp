import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';
import User from '@/models/User';
import Profile from '@/models/Profile';
import mongoose from 'mongoose';

// GET - Get all chats for a user
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    console.log('[Chat API] Getting chats for user:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    // Get all chats where the user is either sender or receiver
    const chats = await Chat.find({
      $or: [
        { senderId: userId },
        { receiverId: userId }
      ]
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Format chats to show the other user and latest message
    const formattedChats = await Promise.all(
      chats.map(async (chat) => {
        const isSender = chat.senderId === userId;
        const otherUserId = isSender ? chat.receiverId : chat.senderId;
        
        // Get other user details
        const otherUser = await User.findById(otherUserId).lean();
        const otherUserProfile = await Profile.findOne({ userId: otherUserId }).lean();
        
        // Get latest message
        const latestMessage = await Message.findOne({ chatId: chat._id.toString() })
          .sort({ createdAt: -1 })
          .lean();
        
        // Get unread count
        const unreadCount = await Message.countDocuments({
          chatId: chat._id.toString(),
          senderId: { $ne: userId },
          isRead: false
        });

        return {
          id: chat._id.toString(),
          otherUser: {
            id: otherUser?._id.toString(),
            name: otherUser?.name,
            email: otherUser?.email,
            profile: otherUserProfile
          },
          latestMessage: latestMessage ? {
            id: latestMessage._id.toString(),
            content: latestMessage.content,
            messageType: latestMessage.messageType,
            isRead: latestMessage.isRead,
            createdAt: latestMessage.createdAt,
            senderId: latestMessage.senderId,
            isFromMe: latestMessage.senderId === userId
          } : null,
          unreadCount,
          updatedAt: chat.updatedAt,
          createdAt: chat.createdAt
        };
      })
    );

    console.log(`[Chat API] Found ${formattedChats.length} chats for user ${userId}`);

    return NextResponse.json({
      success: true,
      chats: formattedChats
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
    
    console.log('[Chat API] POST request received');
    
    const body = await request.json();
    const { senderId, receiverId } = body;

    console.log('[Chat API] Creating/getting chat:', { senderId, receiverId });

    if (!senderId || !receiverId) {
      console.log('[Chat API] Missing senderId or receiverId');
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
      console.log('[Chat API] Cannot create chat with yourself');
      return NextResponse.json(
        { error: 'Cannot create chat with yourself' },
        { status: 400 }
      );
    }

    console.log('[Chat API] Checking if chat exists...');
    
    try {
      // Check if chat already exists (either direction)
      let chat = await Chat.findOne({
        $or: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId }
        ]
      }).lean();

      console.log('[Chat API] Existing chat check result:', chat ? `Found chat ${chat._id}` : 'No existing chat');

      let isNew = false;
      // If chat doesn't exist, create it
      if (!chat) {
        console.log('[Chat API] Creating new chat...');
        try {
          const newChat = new Chat({
            senderId: senderId < receiverId ? senderId : receiverId,
            receiverId: senderId < receiverId ? receiverId : senderId
          });
          chat = await newChat.save();
          isNew = true;
          console.log('[Chat API] New chat created successfully:', chat._id);
        } catch (createError) {
          console.error('[Chat API] Error creating chat:', createError);
          throw createError;
        }
      } else {
        console.log('[Chat API] Existing chat found:', chat._id);
      }

      // Get other user details
      const isSender = chat.senderId === senderId;
      const otherUserId = isSender ? chat.receiverId : chat.senderId;
      
      const otherUser = await User.findById(otherUserId).lean();
      const otherUserProfile = await Profile.findOne({ userId: otherUserId }).lean();

      const formattedChat = {
        id: chat._id.toString(),
        otherUser: {
          id: otherUser?._id.toString(),
          name: otherUser?.name,
          email: otherUser?.email,
          profile: otherUserProfile
        },
        latestMessage: null,
        unreadCount: 0,
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt
      };

      console.log('[Chat API] Returning formatted chat:', formattedChat.id);

      return NextResponse.json({
        success: true,
        chat: formattedChat,
        isNew: isNew
      });

    } catch (dbError) {
      console.error('[Chat API] Database operation error:', dbError);
      return NextResponse.json(
        { error: 'Database operation failed', details: dbError instanceof Error ? dbError.message : 'Unknown database error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Chat API] POST Error:', error);
    return NextResponse.json(
      { error: 'Failed to create/get chat', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
