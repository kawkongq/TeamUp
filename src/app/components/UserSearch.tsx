"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface UserSearchProps {
  currentUserId: string;
  onUserSelect: (user: any) => void;
  onBack: () => void;
}

export default function UserSearch({ currentUserId, onUserSelect, onBack }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timeoutId = setTimeout(() => {
        searchUsers();
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setUsers([]);
    }
  }, [searchQuery]);

  const searchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}&currentUserId=${currentUserId}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to search users');
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  };

  const handleUserSelect = (user: any) => {
    onUserSelect(user);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <h3 className="text-lg font-medium text-gray-900">New Chat</h3>
        </div>
      </div>

      {/* Search Input */}
      <div className="p-6 border-b border-gray-200">
        <div className="relative">
          <input
            type="text"
            placeholder="Search for users by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            autoFocus
          />
          <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        {searchQuery.length > 0 && searchQuery.length < 2 && (
          <p className="text-sm text-gray-500 mt-2">
            Type at least 2 characters to search
          </p>
        )}
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching users...</p>
            </div>
          </div>
        ) : error ? (
          <div className="px-6 py-8 text-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        ) : searchQuery.length >= 2 && users.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Try adjusting your search terms or check back later.</p>
          </div>
        ) : searchQuery.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Search for users</h3>
            <p className="text-gray-600">Enter a name, email, or role to find users to chat with.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div
                key={user.id}
                onClick={() => handleUserSelect(user)}
                className="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {/* User Avatar */}
                  <div className="flex-shrink-0">
                    {user.profile?.avatar ? (
                      <Image
                        src={user.profile.avatar}
                        alt={user.profile.displayName || user.name || 'User'}
                        width={48}
                        height={48}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                        {(user.profile?.displayName || user.name || 'U').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">
                      {user.profile?.displayName || user.name || 'Unknown User'}
                    </h4>
                    <p className="text-sm text-gray-500 truncate">{user.email}</p>
                    {user.profile?.role && (
                      <p className="text-xs text-gray-400 mt-1">{user.profile.role}</p>
                    )}
                    {user.profile?.bio && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{user.profile.bio}</p>
                    )}
                  </div>

                  {/* Start Chat Button */}
                  <div className="flex-shrink-0">
                    <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors">
                      Start Chat
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
