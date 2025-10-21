"use client";

import { useState, memo } from 'react';
import Image from 'next/image';

interface ChatListProps {
  chats: any[];
  selectedChat: any;
  onChatSelect: (chat: any) => void;
  currentUserId: string;
}

function ChatList({ chats, selectedChat, onChatSelect }: ChatListProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChats = chats.filter(chat =>
    chat.otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.otherUser.profile?.displayName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
      }
    } catch {
      return '';
    }
  };

  const truncateMessage = (content: string, maxLength: number = 45) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline ? 'bg-green-400' : 'bg-gray-300';
  };

  if (chats.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center px-6 py-8">
          <div className="relative mx-auto mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">No conversations yet</h3>
          <p className="text-gray-600 leading-relaxed max-w-sm">
            Start connecting with amazing people! Your conversations will appear here once you begin chatting.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search */}
      <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50 border-b border-gray-100">
        <div className="relative">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 placeholder-gray-400 text-sm shadow-sm"
          />
          <div className="absolute left-3.5 top-3.5">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
        <div className="divide-y divide-gray-100">
          {filteredChats.map((chat, index) => (
            <div
              key={chat.id}
              onClick={() => onChatSelect(chat)}
              className={`relative px-4 py-4 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 cursor-pointer transition-all duration-200 group ${selectedChat?.id === chat.id
                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-r-3 border-blue-500 shadow-sm'
                : ''
                }`}
            >
              <div className="flex items-center space-x-3">
                {/* User Avatar with Status */}
                <div className="relative flex-shrink-0">
                  {chat.otherUser.profile?.avatar ? (
                    <Image
                      src={chat.otherUser.profile.avatar}
                      alt={chat.otherUser.profile.displayName || chat.otherUser.name || 'User'}
                      width={52}
                      height={52}
                      className="w-13 h-13 rounded-full object-cover ring-2 ring-white shadow-md"
                    />
                  ) : (
                    <div className="w-13 h-13 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-md ring-2 ring-white">
                      {(chat.otherUser.profile?.displayName || chat.otherUser.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Online Status Indicator */}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 ${getStatusColor(index % 3 === 0)} rounded-full border-2 border-white shadow-sm`}></div>
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                      {chat.otherUser.profile?.displayName || chat.otherUser.name || 'Unknown User'}
                    </h4>
                    <div className="flex items-center space-x-2">
                      {chat.latestMessage && (
                        <span className="text-xs text-gray-500 font-medium">
                          {formatTime(chat.latestMessage.createdAt)}
                        </span>
                      )}
                      {chat.unreadCount > 0 && (
                        <div className="w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-white">
                            {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Latest Message */}
                  {chat.latestMessage ? (
                    <div className="flex items-center space-x-1">
                      {chat.latestMessage.isFromMe && (
                        <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                      )}
                      <p className={`text-sm truncate ${chat.unreadCount > 0 && !chat.latestMessage.isFromMe
                        ? 'text-gray-900 font-medium'
                        : 'text-gray-600'
                        }`}>
                        {chat.latestMessage.isFromMe && <span className="text-blue-600 font-medium">You: </span>}
                        {truncateMessage(chat.latestMessage.content)}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      <p className="text-sm text-gray-500 italic">Start a conversation</p>
                    </div>
                  )}

                  {/* User Role/Status */}
                  {chat.otherUser.profile?.role && (
                    <div className="mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 capitalize">
                        {chat.otherUser.profile.role.replace('-', ' ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"></div>
            </div>
          ))}
        </div>

        {filteredChats.length === 0 && searchQuery && (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <p className="text-gray-500 font-medium">No conversations found</p>
            <p className="text-gray-400 text-sm mt-1">Try searching with a different term</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(ChatList);