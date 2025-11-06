import Chat from '@/models/Chat';
import Message from '@/models/Message';
import Profile from '@/models/Profile';
import User from '@/models/User';

type ChatModel = typeof Chat;
type MessageModel = typeof Message;
type UserModel = typeof User;
type ProfileModel = typeof Profile;

export interface ChatDependencies {
  chatModel?: ChatModel;
  messageModel?: MessageModel;
  userModel?: UserModel;
  profileModel?: ProfileModel;
}

export type CreateChatInput = {
  senderId: string;
  receiverId: string;
};

const defaultChatDeps: Required<ChatDependencies> = {
  chatModel: Chat,
  messageModel: Message,
  userModel: User,
  profileModel: Profile,
};

function assertObjectId(id: string, label: string) {
  if (!id || typeof id !== 'string') {
    throw new Error(`${label} is required`);
  }
  if (id.length !== 24) {
    throw new Error(`Invalid ${label}`);
  }
}

function docId(doc: any): string | undefined {
  if (!doc) {
    return undefined;
  }
  const raw = doc._id ?? doc.id;
  if (typeof raw === 'string') {
    return raw;
  }
  if (raw && typeof raw.toString === 'function') {
    return raw.toString();
  }
  return undefined;
}

export async function createOrGetChat(
  input: CreateChatInput,
  dependencies: ChatDependencies = {},
): Promise<{ chat: any; isNew: boolean }> {
  const deps = { ...defaultChatDeps, ...dependencies };
  const { senderId, receiverId } = input;

  assertObjectId(senderId, 'Sender ID');
  assertObjectId(receiverId, 'Receiver ID');

  if (senderId === receiverId) {
    throw new Error('Cannot create chat with yourself');
  }

  const existing = await deps.chatModel.findOne({
    $or: [
      { senderId, receiverId },
      { senderId: receiverId, receiverId: senderId },
    ],
  });

  let chat = existing;
  let isNew = false;

  if (!chat) {
    const ordered = senderId < receiverId;
    const created = await new deps.chatModel({
      senderId: ordered ? senderId : receiverId,
      receiverId: ordered ? receiverId : senderId,
    }).save();
    chat = created;
    isNew = true;
  }

  const otherUserId = chat.senderId === senderId ? chat.receiverId : chat.senderId;
  const otherUser = await deps.userModel.findById(otherUserId).lean();
  const otherProfile = await deps.profileModel.findOne({ userId: otherUserId }).lean();

  return {
    chat: {
      id: docId(chat),
      otherUser: otherUser
        ? {
            id: docId(otherUser),
            name: (otherUser as any)?.name,
            email: (otherUser as any)?.email,
            profile: otherProfile ?? null,
          }
        : null,
      latestMessage: null,
      unreadCount: 0,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    },
    isNew,
  };
}

export async function listChatsForUser(
  userId: string,
  dependencies: ChatDependencies = {},
) {
  const deps = { ...defaultChatDeps, ...dependencies };

  assertObjectId(userId, 'User ID');

  const chats = await deps.chatModel
    .find({
      $or: [
        { senderId: userId },
        { receiverId: userId },
      ],
    })
    .sort({ updatedAt: -1 })
    .lean();

  const results = await Promise.all(
    chats.map(async (chat) => {
      const isSender = chat.senderId === userId;
      const otherUserId = isSender ? chat.receiverId : chat.senderId;

      const otherUser = await deps.userModel.findById(otherUserId).lean();
      const otherProfile = await deps.profileModel.findOne({ userId: otherUserId }).lean();
      const chatIdentifier = docId(chat);
      const latestMessage = await deps.messageModel
        .findOne({ chatId: chatIdentifier })
        .sort({ createdAt: -1 })
        .lean();
      const unreadCount = await deps.messageModel.countDocuments({
        chatId: chatIdentifier,
        senderId: { $ne: userId },
        isRead: false,
      });

      const messageData = latestMessage as any;

      return {
        id: chatIdentifier,
        otherUser: otherUser
          ? {
              id: docId(otherUser),
              name: (otherUser as any)?.name,
              email: (otherUser as any)?.email,
              profile: otherProfile ?? null,
            }
          : null,
        latestMessage: latestMessage
          ? {
              id: docId(messageData),
              content: messageData?.content,
              messageType: messageData?.messageType,
              isRead: messageData?.isRead,
              createdAt: messageData?.createdAt,
              senderId: messageData?.senderId,
              isFromMe: messageData?.senderId === userId,
            }
          : null,
        unreadCount,
        updatedAt: chat.updatedAt,
        createdAt: chat.createdAt,
      };
    }),
  );

  return results;
}
