"use client";

import { useState, useRef, useEffect } from 'react';
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

interface SwipeCardProps {
  person: Person;
  index: number;
  onSwipe: (action: 'like' | 'pass') => void;
  disabled?: boolean;
}

export default function SwipeCard({ person, index, onSwipe, disabled = false }: SwipeCardProps) {
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showLikeOverlay, setShowLikeOverlay] = useState(false);
  const [showPassOverlay, setShowPassOverlay] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (disabled || index !== 0) return;
    setDragStart({ x: e.clientX, y: e.clientY });
    setIsDragging(true);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled || index !== 0) return;
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX, y: touch.clientY });
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !dragStart || disabled || index !== 0) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });

    // Show overlay based on swipe direction
    const threshold = 50;
    if (deltaX > threshold) {
      setShowLikeOverlay(true);
      setShowPassOverlay(false);
    } else if (deltaX < -threshold) {
      setShowPassOverlay(true);
      setShowLikeOverlay(false);
    } else {
      setShowLikeOverlay(false);
      setShowPassOverlay(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !dragStart || disabled || index !== 0) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });

    // Show overlay based on swipe direction
    const threshold = 50;
    if (deltaX > threshold) {
      setShowLikeOverlay(true);
      setShowPassOverlay(false);
    } else if (deltaX < -threshold) {
      setShowPassOverlay(true);
      setShowLikeOverlay(false);
    } else {
      setShowLikeOverlay(false);
      setShowPassOverlay(false);
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || disabled || index !== 0) return;
    handleSwipeEnd();
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled || index !== 0) return;
    handleSwipeEnd();
  };

  const handleSwipeEnd = () => {
    if (!dragStart) return;

    const threshold = 100;
    
    if (dragOffset.x > threshold) {
      // Swipe right - Like
      onSwipe('like');
    } else if (dragOffset.x < -threshold) {
      // Swipe left - Pass
      onSwipe('pass');
    } else {
      // Return to center
      setDragOffset({ x: 0, y: 0 });
    }

    // Reset state
    setDragStart(null);
    setIsDragging(false);
    setShowLikeOverlay(false);
    setShowPassOverlay(false);
  };

  // Add global mouse/touch event listeners
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!dragStart || disabled || index !== 0) return;
        
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        setDragOffset({ x: deltaX, y: deltaY });

        const threshold = 50;
        if (deltaX > threshold) {
          setShowLikeOverlay(true);
          setShowPassOverlay(false);
        } else if (deltaX < -threshold) {
          setShowPassOverlay(true);
          setShowLikeOverlay(false);
        } else {
          setShowLikeOverlay(false);
          setShowPassOverlay(false);
        }
      };

      const handleGlobalMouseUp = () => {
        if (disabled || index !== 0) return;
        handleSwipeEnd();
      };

      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove);
        document.removeEventListener('mouseup', handleGlobalMouseUp);
      };
    }
  }, [isDragging, dragStart, disabled, index]);

  const rotation = dragOffset.x * 0.1;
  const scale = index === 0 ? 1 : 1 - index * 0.05;
  const zIndex = 10 - index;

  const cardStyle = {
    transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg) scale(${scale})`,
    zIndex,
    opacity: index === 0 ? 1 : 0.8 - index * 0.1,
  };

  return (
    <div
      ref={cardRef}
      className={`absolute inset-0 w-full h-full transition-all duration-200 ${
        disabled ? 'pointer-events-none' : 'cursor-grab active:cursor-grabbing'
      }`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card */}
      <div className="w-full h-full bg-white rounded-3xl shadow-2xl overflow-hidden relative">
        {/* Background Image/Color */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500">
          <div className="absolute inset-0 bg-black/20"></div>
        </div>

        {/* Overlay for swipe feedback */}
        {showLikeOverlay && (
          <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center z-20">
            <div className="bg-green-500 text-white px-8 py-4 rounded-2xl text-2xl font-bold transform rotate-12">
              LIKE
            </div>
          </div>
        )}

        {showPassOverlay && (
          <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center z-20">
            <div className="bg-red-500 text-white px-8 py-4 rounded-2xl text-2xl font-bold transform -rotate-12">
              PASS
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative z-10 h-full flex flex-col">
          {/* Header with avatar and basic info */}
          <div className="p-6 flex-1 flex flex-col justify-end">
            <div className="flex items-end space-x-4 mb-6">
              <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 border-4 border-white shadow-lg">
                {person.avatar ? (
                  <Image
                    src={person.avatar.startsWith('http') ? person.avatar : person.avatar.startsWith('/uploads/') ? person.avatar : `/uploads/${person.avatar}`}
                    alt={person.name}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                    priority={index === 0}
                    quality={75}
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full bg-white flex items-center justify-center text-indigo-600 font-bold text-2xl">
                    {person.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="flex-1 text-white">
                <h2 className="text-3xl font-bold mb-1">{person.name}</h2>
                <p className="text-lg opacity-90 mb-2">{person.role}</p>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="text-sm opacity-80">{person.location}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom section with details */}
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-t-3xl">
            {/* Bio */}
            <p className="text-gray-700 text-sm mb-4 line-clamp-2">{person.bio}</p>

            {/* Skills */}
            {person.skills.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Skills</p>
                <div className="flex flex-wrap gap-1">
                  {person.skills.slice(0, 4).map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                      {skill}
                    </span>
                  ))}
                  {person.skills.length > 4 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{person.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Interests */}
            {person.interests.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-medium text-gray-500 mb-2">Interests</p>
                <div className="flex flex-wrap gap-1">
                  {person.interests.slice(0, 3).map((interest, index) => (
                    <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {interest}
                    </span>
                  ))}
                  {person.interests.length > 3 && (
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                      +{person.interests.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-1">
                <span className="text-yellow-500">★</span>
                <span className="text-gray-600">{person.rating.toFixed(1)}</span>
                <span className="text-gray-500">({person.projectsCompleted} projects)</span>
              </div>
              <span className={`px-2 py-1 text-xs rounded-full ${
                person.status === 'available'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {person.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
