"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import ChatList from './ChatList';
import ChatConversation from './ChatConversation';
import UserSearch from './UserSearch';

interface ChatInterfaceProps {
  currentUserId: string;
  initialSelectedChat?: any;
}

export default function ChatInterface({ currentUserId, initialSelectedChat }: ChatInterfaceProps) {
  const [selectedChat, setSelectedChat] = useState<any>(initialSelectedChat || null);
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    fetchChats();
  }, [currentUserId]);

  // Set initial selected chat when it's provided
  useEffect(() => {
    if (initialSelectedChat) {
      setSelectedChat(initialSelectedChat);
    }
  }, [initialSelectedChat]);

  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chat?userId=${currentUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setChats(data.chats || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch chats');
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('Failed to fetch chats');
    } finally {
      setLoading(false);
    }
  };

  const handleChatSelect = (chat: any) => {
    setSelectedChat(chat);
    setShowUserSearch(false);
  };

  const handleNewChat = (user: any) => {
    // Create or get existing chat
    createOrGetChat(user.id);
    setShowUserSearch(false);
  };

  const createOrGetChat = async (receiverId: string) => {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newChat = data.chat;
        
        // Add to chats list if it's new
        if (data.isNew) {
          setChats(prev => [newChat, ...prev]);
        }
        
        setSelectedChat(newChat);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      setError('Failed to create chat');
    }
  };

  const handleMessageSent = () => {
    // Refresh chats to update latest message
    fetchChats();
  };

  const handleBackToChats = () => {
    setSelectedChat(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading chats...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
        <button
          onClick={() => {
            setError('');
            fetchChats();
          }}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Messages</h1>
              <p className="text-sm text-gray-500">Stay connected with your team</p>
            </div>
          </div>
          <button
            onClick={() => setShowUserSearch(true)}
            className="group relative px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>New Chat</span>
            </div>
            <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat List Sidebar */}
        <div className={`w-80 flex-shrink-0 ${selectedChat ? 'hidden md:block' : 'block'}`}>
          <div className="h-full bg-white/60 backdrop-blur-sm border-r border-gray-200/50 shadow-sm">
            <ChatList
              chats={chats}
              selectedChat={selectedChat}
              onChatSelect={handleChatSelect}
              currentUserId={currentUserId}
            />
          </div>
        </div>

        {/* Chat Conversation or User Search */}
        <div className="flex-1 flex flex-col">
          {showUserSearch ? (
            <div className="h-full bg-white/60 backdrop-blur-sm">
              <UserSearch
                currentUserId={currentUserId}
                onUserSelect={handleNewChat}
                onBack={() => setShowUserSearch(false)}
              />
            </div>
          ) : selectedChat ? (
            <div className="h-full bg-white/60 backdrop-blur-sm">
              <ChatConversation
                chat={selectedChat}
                currentUserId={currentUserId}
                onMessageSent={handleMessageSent}
                onBack={handleBackToChats}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-white/40 to-blue-50/40 backdrop-blur-sm">
              <div className="text-center max-w-md mx-auto px-6">
                <div className="relative mx-auto mb-8">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center shadow-lg">
                    <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div className="absolute -top-2 -right-2 w-12 h-12 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Welcome to Messages</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Select a conversation from the sidebar or start a new chat to begin connecting with your teammates and collaborators.
                </p>
                <button
                  onClick={() => setShowUserSearch(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Start New Chat</span>
                  </div>
                  <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
