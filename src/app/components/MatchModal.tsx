"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
  location: string;
  skills: string[];
  experience: string;
  interests: string[];
  status: string;
  bio: string;
  github: string | null;
  linkedin: string | null;
  rating: number;
  projectsCompleted: number;
  hourlyRate?: number | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MatchModalProps {
  matchedUser: Person;
  onClose: () => void;
  onStartChat: () => void;
}

export default function MatchModal({ matchedUser, onClose, onStartChat }: MatchModalProps) {
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setShowAnimation(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-3xl max-w-md w-full p-8 text-center transform transition-all duration-500 ${
        showAnimation ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
      }`}>
        {/* Match Animation */}
        <div className="mb-6">
          <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">It's a Match!</h2>
          <p className="text-gray-600">You and {matchedUser.name} liked each other</p>
        </div>

        {/* Matched User Info */}
        <div className="mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden mx-auto mb-4 border-4 border-green-400 shadow-lg">
            {matchedUser.avatar ? (
              <Image
                src={matchedUser.avatar.startsWith('http') ? matchedUser.avatar : matchedUser.avatar.startsWith('/uploads/') ? matchedUser.avatar : `/uploads/${matchedUser.avatar}`}
                alt={matchedUser.name}
                width={80}
                height={80}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {matchedUser.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">{matchedUser.name}</h3>
          <p className="text-gray-600 mb-2">{matchedUser.role}</p>
          <p className="text-sm text-gray-500">{matchedUser.location}</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center justify-center space-x-1 mb-1">
              <span className="text-yellow-500">★</span>
              <span className="font-semibold text-gray-900">{matchedUser.rating.toFixed(1)}</span>
            </div>
            <p className="text-xs text-gray-600">Rating</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="font-semibold text-gray-900 mb-1">{matchedUser.projectsCompleted}</div>
            <p className="text-xs text-gray-600">Projects</p>
          </div>
        </div>

        {/* Skills Preview */}
        {matchedUser.skills.length > 0 && (
          <div className="mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">Skills</p>
            <div className="flex flex-wrap justify-center gap-2">
              {matchedUser.skills.slice(0, 4).map((skill, index) => (
                <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
                  {skill}
                </span>
              ))}
              {matchedUser.skills.length > 4 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm rounded-full">
                  +{matchedUser.skills.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={onStartChat}
            className="w-full bg-gradient-to-r from-green-500 to-blue-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-green-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <div className="flex items-center justify-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>Start Chatting</span>
            </div>
          </button>
          
          <button
            onClick={onClose}
            className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
          >
            Keep Swiping
          </button>
        </div>

        {/* Celebration Animation */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
          <div className="absolute top-4 left-4 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></div>
          <div className="absolute top-8 right-8 w-3 h-3 bg-pink-400 rounded-full animate-ping animation-delay-1000"></div>
          <div className="absolute bottom-8 left-8 w-2 h-2 bg-blue-400 rounded-full animate-ping animation-delay-2000"></div>
          <div className="absolute bottom-4 right-4 w-3 h-3 bg-green-400 rounded-full animate-ping animation-delay-3000"></div>
        </div>
      </div>
    </div>
  );
}
