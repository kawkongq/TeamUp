"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SwipeCard from '../components/SwipeCard';
import MatchModal from '../components/MatchModal';

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

export default function SwipePage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [people, setPeople] = useState<Person[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [showMatchModal, setShowMatchModal] = useState(false);
  const [matchedUser, setMatchedUser] = useState<Person | null>(null);
  const [swipeHistory, setSwipeHistory] = useState<{userId: string, action: 'like' | 'pass'}[]>([]);
  const router = useRouter();

  useEffect(() => {
    checkAuthAndFetchData();
  }, []);

  const fetchPotentialMatches = async (userId: string) => {
    try {
      const response = await fetch(`/api/swipe/matches?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setPeople(data.people || []);
      } else {
        console.error('Failed to fetch potential matches');
        setPeople([]);
      }
    } catch (err) {
      console.error('Failed to fetch potential matches:', err);
      setPeople([]);
    }
  };

  const checkAuthAndFetchData = async () => {
    try {
      const authResponse = await fetch('/api/auth/check');

      if (!authResponse.ok) {
        router.push('/signin');
        return;
      }

      const authData = await authResponse.json();
      if (!authData.authenticated || !authData.user) {
        router.push('/signin');
        return;
      }

      setCurrentUser(authData.user);

      // Fetch potential matches for this user
      await fetchPotentialMatches(authData.user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/signin');
    } finally {
      setLoading(false);
      setInitialLoad(false);
    }
  };


  const handleSwipe = async (action: 'like' | 'pass') => {
    if (!currentUser || currentIndex >= people.length || swiping) return;

    const targetUser = people[currentIndex];
    setSwiping(true);

    try {
      const response = await fetch('/api/swipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUser.id,
          targetUserId: targetUser.id,
          action: action
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add to swipe history
        setSwipeHistory(prev => [...prev, { userId: targetUser.id, action }]);
        
        // Check if it's a match
        if (data.match && action === 'like') {
          setMatchedUser(targetUser);
          setShowMatchModal(true);
        }
        
        // Move to next person
        setCurrentIndex(prev => prev + 1);
      } else {
        console.error('Swipe failed');
      }
    } catch (error) {
      console.error('Error processing swipe:', error);
    } finally {
      setSwiping(false);
    }
  };

  const handleUndo = () => {
    if (swipeHistory.length === 0 || currentIndex === 0) return;
    
    setSwipeHistory(prev => prev.slice(0, -1));
    setCurrentIndex(prev => prev - 1);
  };

  const handleMatchModalClose = () => {
    setShowMatchModal(false);
    setMatchedUser(null);
  };

  const handleStartChat = () => {
    if (matchedUser) {
      // Create chat and redirect
      fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          senderId: currentUser.id,
          receiverId: matchedUser.id
        }),
      }).then(response => {
        if (response.ok) {
          router.push('/chat');
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Finding your perfect matches...</p>
        </div>
      </div>
    );
  }

  // Skeleton loading for better perceived performance
  if (initialLoad && people.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden animate-pulse">
            <div className="h-96 bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="flex space-x-2">
                <div className="h-6 bg-gray-200 rounded w-16"></div>
                <div className="h-6 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-12 h-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">You must be logged in to use swipe mode.</p>
          <button
            onClick={() => router.push('/signin')}
            className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  if (people.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-4">No More Matches!</h3>
          <p className="text-gray-600 mb-6">
            You've seen everyone in your area. Check back later for new people or try adjusting your preferences.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => fetchPotentialMatches(currentUser.id)}
              className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Refresh Matches
            </button>
            <button
              onClick={() => router.push('/people')}
              className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Browse All People
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / people.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="pt-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h1 className="text-2xl font-bold text-gray-900">Swipe Mode</h1>
              <span className="text-sm text-gray-600">{currentIndex + 1} of {people.length}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-indigo-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Undo Button */}
          {swipeHistory.length > 0 && currentIndex > 0 && (
            <div className="mb-4">
              <button
                onClick={handleUndo}
                disabled={swiping}
                className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Undo</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Swipe Cards Container */}
      <div className="px-4 sm:px-6 lg:px-8 pb-20">
        <div className="max-w-md mx-auto">
          <div className="relative h-[600px]">
            {people.slice(currentIndex, currentIndex + 3).map((person, index) => (
              <SwipeCard
                key={person.id}
                person={person}
                index={index}
                onSwipe={handleSwipe}
                disabled={swiping || index !== 0}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center space-x-8 mt-8">
            <button
              onClick={() => handleSwipe('pass')}
              disabled={swiping || currentIndex >= people.length}
              className="w-16 h-16 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <button
              onClick={() => handleSwipe('like')}
              disabled={swiping || currentIndex >= people.length}
              className="w-16 h-16 bg-green-500 text-white rounded-full flex items-center justify-center hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>
          </div>

          {/* Instructions */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              Swipe right to like, left to pass, or use the buttons below
            </p>
          </div>
        </div>
      </div>

      {/* Match Modal */}
      {showMatchModal && matchedUser && (
        <MatchModal
          matchedUser={matchedUser}
          onClose={handleMatchModalClose}
          onStartChat={handleStartChat}
        />
      )}
    </div>
  );
}
