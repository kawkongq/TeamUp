import test from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'crypto';

import { createOrGetChat, listChatsForUser } from '@/services/chat-service';

const hex = '0123456789abcdef';

function createObjectId() {
  return Array.from({ length: 24 }, () => hex[Math.floor(Math.random() * hex.length)]).join('');
}

function createChatModels() {
  const users: any[] = [];
  const profiles: any[] = [];
  const chats: any[] = [];
  const messages: any[] = [];

  function clone<T>(value: T): T {
    return value ? JSON.parse(JSON.stringify(value)) : value;
  }

  function matches(doc: any, query: any): boolean {
    if (!query) {
      return true;
    }
    if (query.$or) {
      return query.$or.some((clause: any) => matches(doc, clause));
    }
    if (query.$and) {
      return query.$and.every((clause: any) => matches(doc, clause));
    }
    return Object.entries(query).every(([key, value]) => {
      if (value && typeof value === 'object' && '$ne' in value) {
        return doc[key] !== value.$ne;
      }
      return doc[key] === value;
    });
  }

  const ChatModel: any = function (this: any, data: any) {
    this.senderId = data.senderId;
    this.receiverId = data.receiverId;
  };

  ChatModel.findOne = async (query: any) => {
    const found = chats.find((chat) => matches(chat, query));
    return found ? clone(found) : null;
  };

  ChatModel.find = (query: any) => {
    const filtered = chats.filter((chat) => matches(chat, query));
    return {
      sort() {
        const sorted = filtered.slice().sort((a, b) => Number(b.updatedAt) - Number(a.updatedAt));
        return {
          async lean() {
            return clone(sorted);
          },
        };
      },
      async lean() {
        return clone(filtered);
      },
    };
  };

  ChatModel.prototype.save = async function () {
    const id = createObjectId();
    const doc = {
      _id: id,
      id,
      senderId: this.senderId,
      receiverId: this.receiverId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    chats.push(doc);
    return clone(doc);
  };

  const messageModel = {
    findOne(query: any) {
      const filtered = messages.filter((message) => message.chatId === query.chatId);
      return {
        sort() {
          const sorted = filtered.slice().sort((a, b) => Number(b.createdAt) - Number(a.createdAt));
          return {
            async lean() {
              return clone(sorted.at(-1) ?? null);
            },
          };
        },
        async lean() {
          return clone(filtered[0] ?? null);
        },
      };
    },
    async countDocuments(query: any) {
      return messages.filter((message) => {
        if (message.chatId !== query.chatId) {
          return false;
        }
        if (query.senderId?.$ne && message.senderId === query.senderId.$ne) {
          return false;
        }
        if (typeof query.isRead === 'boolean' && message.isRead !== query.isRead) {
          return false;
        }
        return true;
      }).length;
    },
  };

  const userModel = {
    findById(id: string) {
      const user = users.find((u) => u._id === id);
      return {
        async lean() {
          return user ? clone(user) : null;
        },
      };
    },
  };

  const profileModel = {
    findOne(query: any) {
      const profile = profiles.find((p) => p.userId === query.userId);
      return {
        async lean() {
          return profile ? clone(profile) : null;
        },
      };
    },
  };

  return { users, profiles, chats, messages, ChatModel, messageModel, userModel, profileModel };
}

process.env.NEXTAUTH_SECRET ||= randomBytes(16).toString('hex');

test('createOrGetChat creates chat and listChatsForUser shows latest message', async () => {
  const { users, profiles, chats, messages, ChatModel, messageModel, userModel, profileModel } =
    createChatModels();

  const userA = createObjectId();
  const userB = createObjectId();

  users.push({ _id: userA, id: userA, name: 'Alice', email: 'alice@example.com' });
  users.push({ _id: userB, id: userB, name: 'Bob', email: 'bob@example.com' });
  profiles.push({ userId: userB, displayName: 'Bob' });

  const createdChat = await createOrGetChat(
    { senderId: userA, receiverId: userB },
    {
      chatModel: ChatModel as any,
      userModel: userModel as any,
      profileModel: profileModel as any,
    },
  );

  assert.equal(createdChat.isNew, true);
  assert.equal(chats.length, 1);

  messages.push({
    _id: createObjectId(),
    chatId: createdChat.chat.id,
    senderId: userB,
    content: 'Hello!',
    messageType: 'text',
    isRead: false,
    createdAt: new Date(),
  });

  const chatList = await listChatsForUser(userA, {
    chatModel: ChatModel as any,
    messageModel: messageModel as any,
    userModel: userModel as any,
    profileModel: profileModel as any,
  });

  assert.equal(chatList.length, 1);
  assert.equal(chatList[0].latestMessage?.content, 'Hello!');
  assert.equal(chatList[0].unreadCount, 1);
});
