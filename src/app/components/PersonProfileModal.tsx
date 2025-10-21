"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Button from './Button';

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
}

interface PersonProfileModalProps {
  person: Person;
  onClose: () => void;
  onInviteToTeam: (person: Person) => void;
  onStartChat: (personId: string) => void;
  currentUser: any;
}

export default function PersonProfileModal({
  person,
  onClose,
  onInviteToTeam,
  onStartChat,
  currentUser
}: PersonProfileModalProps) {
  const [activeTab, setActiveTab] = useState<'about' | 'skills' | 'projects'>('about');

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-xs sm:max-w-lg md:max-w-2xl lg:max-w-4xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto my-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative flex-shrink-0">
          {/* Background */}
          <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-2 right-2 sm:top-4 sm:right-4 w-8 h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Profile Info Section */}
          <div className="px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="relative flex-shrink-0">
                <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-2xl overflow-hidden border-4 border-white shadow-xl">
                  {person.avatar ? (
                    <Image
                      src={person.avatar.startsWith('http') ? person.avatar :
                        person.avatar.startsWith('/uploads/') ? person.avatar :
                          `/uploads/${person.avatar}`}
                      alt={person.name}
                      width={160}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-5xl">
                      {person.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {/* Status indicator */}
                <div className={`absolute -bottom-2 -right-2 w-8 h-8 rounded-full border-4 border-white shadow-lg ${person.status === 'available' ? 'bg-green-400' : 'bg-gray-400'
                  }`} />
              </div>

              <div className="flex-1 text-center sm:text-left space-y-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">{person.name}</h1>
                  <p className="text-xl sm:text-2xl text-indigo-600 font-medium mb-3">{person.role}</p>

                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-gray-600">
                    <div className="flex items-center justify-center sm:justify-start">
                      <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className="text-lg">{person.location}</span>
                    </div>
                    {person.timezone && (
                      <div className="flex items-center justify-center sm:justify-start">
                        <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-lg">{person.timezone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="flex justify-center sm:justify-start space-x-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{person.rating.toFixed(1)}</div>
                    <div className="text-sm text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{person.projectsCompleted}</div>
                    <div className="text-sm text-gray-500">Projects</div>
                  </div>
                  {person.hourlyRate && (
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">${person.hourlyRate}</div>
                      <div className="text-sm text-gray-500">Per Hour</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 sm:px-6 lg:px-8 pb-6">

            {/* Tabs */}
            <div className="flex border-b mb-6 overflow-x-auto">
              {[
                { id: 'about', label: 'About', shortLabel: 'About', icon: '👤' },
                { id: 'skills', label: 'Skills & Interests', shortLabel: 'Skills', icon: '🛠️' },
                { id: 'projects', label: 'Projects', shortLabel: 'Projects', icon: '📁' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 sm:px-6 py-2 sm:py-3 font-medium transition-colors flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600'
                    : 'text-gray-500 hover:text-gray-700'
                    }`}
                >
                  <span className="text-sm sm:text-base">{tab.icon}</span>
                  <span className="text-sm sm:text-base sm:hidden">{tab.shortLabel}</span>
                  <span className="text-sm sm:text-base hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[200px]">
              {activeTab === 'about' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">About</h3>
                    <p className="text-gray-600 leading-relaxed text-lg">{person.bio}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Availability
                      </h4>
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-base font-medium ${person.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                        }`}>
                        <div className={`w-3 h-3 rounded-full mr-3 ${person.status === 'available' ? 'bg-green-400' : 'bg-gray-400'
                          }`} />
                        {person.status === 'available' ? 'Available for work' : 'Currently busy'}
                      </span>
                    </div>

                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                        <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                        Experience
                      </h4>
                      <p className="text-lg font-medium text-blue-800">{person.experience}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'skills' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-3">
                      {person.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-full font-medium hover:bg-blue-200 transition-colors"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Interests</h3>
                    <div className="flex flex-wrap gap-3">
                      {person.interests.map((interest, index) => (
                        <span
                          key={index}
                          className="px-4 py-2 bg-purple-100 text-purple-700 rounded-full font-medium hover:bg-purple-200 transition-colors"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'projects' && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Projects Portfolio</h3>
                  <p className="text-gray-600">Project details will be available soon</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 mt-6">
              <div className="flex flex-col space-y-4">
                {/* Main Action Buttons */}
                <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    variant="primary"
                    onClick={() => onStartChat(person.id)}
                    disabled={!currentUser}
                    className="flex-1 py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Start Chat
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={() => onInviteToTeam(person)}
                    disabled={!currentUser}
                    className="flex-1 py-3 text-lg font-semibold"
                    size="lg"
                  >
                    <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    Invite to Team
                  </Button>
                </div>

                {/* Social Links */}
                {(person.github || person.linkedin) && (
                  <div className="flex justify-center space-x-4 pt-2">
                    <div className="text-sm text-gray-500 font-medium">Connect:</div>
                    {person.github && (
                      <a
                        href={person.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12z" />
                        </svg>
                        GitHub
                      </a>
                    )}

                    {person.linkedin && (
                      <a
                        href={person.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                        </svg>
                        LinkedIn
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}