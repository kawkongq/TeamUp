"use client";

import { useState } from 'react';
import Image from 'next/image';
import Button from './Button';
import { useToast } from './Toast';

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
  portfolio: string | null;
  rating: number;
  projectsCompleted: number;
  hourlyRate?: number | null;
  timezone?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PersonCardProps {
  person: Person;
  currentUser: any;
  onViewProfile: (person: Person) => void;
  onInviteToTeam: (person: Person) => void;
  onStartChat: (personId: string) => void;
}

export default function PersonCard({ 
  person, 
  currentUser, 
  onViewProfile, 
  onInviteToTeam, 
  onStartChat 
}: PersonCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { showToast } = useToast();

  const handleChatClick = () => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to start a chat'
      });
      return;
    }
    onStartChat(person.id);
  };

  const handleInviteClick = () => {
    if (!currentUser) {
      showToast({
        type: 'warning',
        title: 'Sign In Required',
        message: 'Please sign in to invite people to teams'
      });
      return;
    }
    onInviteToTeam(person);
  };

  return (
    <div 
      className={`group relative bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden ${
        isHovered ? 'transform -translate-y-1 sm:-translate-y-2' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-purple-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Status Indicator */}
      <div className="absolute top-4 right-4 z-10">
        <div className={`w-3 h-3 rounded-full ${
          person.status === 'available' ? 'bg-green-400' : 'bg-gray-400'
        } shadow-lg`} />
      </div>

      {/* Card Content */}
      <div className="relative p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-start space-x-3 sm:space-x-4 mb-4">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden shadow-lg">
              {person.avatar ? (
                <Image
                  src={person.avatar.startsWith('http') ? person.avatar : 
                       person.avatar.startsWith('/uploads/') ? person.avatar : 
                       `/uploads/${person.avatar}`}
                  alt={person.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
                  {person.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            {/* Online indicator */}
            {person.status === 'available' && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white rounded-full" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors">
              {person.name}
            </h3>
            <p className="text-sm sm:text-base text-indigo-600 font-medium truncate">{person.role}</p>
            <div className="flex items-center text-xs sm:text-sm text-gray-500 mt-1">
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate">{person.location}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
          {person.bio}
        </p>

        {/* Skills */}
        {person.skills.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Skills</p>
            <div className="flex flex-wrap gap-2">
              {person.skills.slice(0, 3).map((skill, index) => (
                <span 
                  key={index} 
                  className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full hover:bg-blue-200 transition-colors"
                >
                  {skill}
                </span>
              ))}
              {person.skills.length > 3 && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                  +{person.skills.length - 3}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-xl">
          <div className="flex items-center space-x-1">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className={`w-4 h-4 ${i < Math.floor(person.rating) ? 'fill-current' : 'text-gray-300'}`} viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-700">{person.rating.toFixed(1)}</span>
          </div>
          <div className="text-sm text-gray-600">
            <span className="font-medium">{person.projectsCompleted}</span> projects
          </div>
        </div>

        {/* Social Links */}
        <div className="flex justify-center space-x-3 mb-4">
          {person.github && (
            <a
              href={person.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-800 rounded-xl flex items-center justify-center hover:bg-gray-900 transition-all duration-200 hover:scale-110 shadow-lg"
              title="GitHub Profile"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12z"/>
              </svg>
            </a>
          )}
          
          {person.linkedin && (
            <a
              href={person.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center hover:bg-blue-700 transition-all duration-200 hover:scale-110 shadow-lg"
              title="LinkedIn Profile"
            >
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
          )}

          {person.portfolio && (
            <a
              href={person.portfolio}
              target="_blank"
              rel="noopener noreferrer"
              className="w-10 h-10 bg-gray-700 rounded-xl flex items-center justify-center hover:bg-black transition-all duration-200 hover:scale-110 shadow-lg"
              title="Portfolio"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12c2.21 0 4-1.79 4-4S14.21 4 12 4 8 5.79 8 8s1.79 4 4 4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </a>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="primary"
              size="sm"
              onClick={() => onViewProfile(person)}
              className="text-xs sm:text-sm"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="hidden sm:inline">Profile</span>
              <span className="sm:hidden">View</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleChatClick}
              className="text-xs sm:text-sm"
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Chat
            </Button>
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={handleInviteClick}
            fullWidth
            className="text-xs sm:text-sm"
          >
            <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="hidden sm:inline">Invite to Team</span>
            <span className="sm:hidden">Invite</span>
          </Button>
        </div>
      </div>
    </div>
  );
}