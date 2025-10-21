"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface ChatConversationProps {
  chat: any;
  currentUserId: string;
  onMessageSent: () => void;
  onBack: () => void;
}

export default function ChatConversation({ chat, currentUserId, onMessageSent, onBack }: ChatConversationProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [chat.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async (before?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        userId: currentUserId,
        limit: '50'
      });
      
      if (before) {
        params.append('before', before);
      }

      const response = await fetch(`/api/chat/${chat.id}/messages?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        
        if (before) {
          // Append older messages for pagination
          setMessages(prev => [...data.messages, ...prev]);
        } else {
          setMessages(data.messages || []);
        }
        
        setHasMore(data.hasMore);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sending) return;

    try {
      setSending(true);
      const response = await fetch(`/api/chat/${chat.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUserId,
          content: newMessage.trim(),
          messageType: 'TEXT'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
        onMessageSent();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMoreMessages = () => {
    if (messages.length > 0 && hasMore) {
      const oldestMessage = messages[0];
      fetchMessages(oldestMessage.createdAt);
    }
  };

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } catch {
      return '';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        return 'Today';
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return date.toLocaleDateString('en-US', { weekday: 'long' });
      } else {
        return date.toLocaleDateString('en-US', { 
          year: 'numeric',
          month: 'long', 
          day: 'numeric' 
        });
      }
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div className="flex items-center space-x-3">
            {chat.otherUser.profile?.avatar ? (
              <Image
                src={chat.otherUser.profile.avatar}
                alt={chat.otherUser.profile.displayName || chat.otherUser.name || 'User'}
                width={40}
                height={40}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                {(chat.otherUser.profile?.displayName || chat.otherUser.name || 'U').charAt(0).toUpperCase()}
              </div>
            )}
            
            <div>
              <h3 className="font-medium text-gray-900">
                {chat.otherUser.profile?.displayName || chat.otherUser.name || 'Unknown User'}
              </h3>
              <p className="text-sm text-gray-500">
                {chat.otherUser.profile?.role || 'User'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading messages...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Load More Button */}
            {hasMore && (
              <div className="text-center mb-4">
                <button
                  onClick={loadMoreMessages}
                  className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                >
                  Load more messages
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="space-y-4">
              {messages.map((message, index) => {
                                 const showDate = index === 0 || 
                   formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt);
                
                return (
                  <div key={message.id}>
                    {/* Date Separator */}
                    {showDate && (
                      <div className="text-center mb-4">
                        <span className="inline-block px-3 py-1 text-xs text-gray-500 bg-white rounded-full border border-gray-200">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Message */}
                    <div className={`flex ${message.isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.isFromMe 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}>
                        <p className="text-sm">{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isFromMe ? 'text-indigo-100' : 'text-gray-500'
                        }`}>
                          {formatTime(message.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="px-6 py-2 bg-red-50 border-t border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="flex space-x-3">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows={1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              disabled={sending}
            />
          </div>
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
