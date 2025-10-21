"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import CreateTeamForm from '../components/CreateTeamForm';
import JoinTeamButton from '../components/JoinTeamButton';
import JoinRequestsModal from '../components/JoinRequestsModal';
import InviteUserModal from '../components/InviteUserModal';
import { TeamCardSkeleton } from '../components/SkeletonLoader';
import Button from '../components/Button';
import { useToast } from '../components/Toast';
import TeamManagementModal from '../components/TeamManagementModal';
import { canCreateEvents, canCreateTeams } from '@/lib/auth-utils';

interface TeamMember {
  id: string;
  user: {
    id: string;
    name: string;
    email: string;
    profile?: {
      displayName: string;
      avatar: string;
      role: string;
    };
  };
  role: string;
  joinedAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  eventId: string;
  ownerId: string;
  maxMembers: number;
  tags: string;
  lookingFor: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  owner: {
    id: string;
    name: string;
    email: string;
    profile?: {
      displayName: string;
      avatar: string;
      role: string;
    };
  };
  event?: {
    id: string;
    name: string;
    type: string;
    startDate: string;
    endDate: string;
    location?: string;
  };
  members: TeamMember[];
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [error, setError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showJoinRequestsModal, setShowJoinRequestsModal] = useState<Team | null>(null);
  const [showInviteModal, setShowInviteModal] = useState<Team | null>(null);
  const [selectedTeamForManagement, setSelectedTeamForManagement] = useState<Team | null>(null);

  // Debug logging
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[TeamsPage Debug] ${message}`, data);
    }
  };

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      debugLog('Network came online');
      setIsOnline(true);
      if (error.includes('network') || error.includes('fetch')) {
        setError('');
        fetchTeams();
      }
    };

    const handleOffline = () => {
      debugLog('Network went offline');
      setIsOnline(false);
      setError('Network connection lost. Please check your internet connection.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [error]);

  useEffect(() => {
    fetchCurrentUser();
    fetchTeams();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      debugLog('Starting to fetch teams');
      setLoading(true);
      setError('');

      const response = await fetch('/api/teams', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add timeout for better error handling
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      debugLog('Teams API response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        debugLog('Teams data received:', { count: data.teams?.length || 0 });

        // Validate and sanitize the data
        const validatedTeams = validateTeamsData(data.teams || []);
        setTeams(validatedTeams);
        setRetryCount(0);
      } else {
        const errorText = await response.text();
        debugLog('API error response:', errorText);

        let errorMessage = 'Failed to fetch teams';
        if (response.status === 404) {
          errorMessage = 'Teams service not found';
        } else if (response.status === 500) {
          errorMessage = 'Server error occurred while fetching teams';
        } else if (response.status === 403) {
          errorMessage = 'Access denied to teams';
        }

        setError(errorMessage);
        debugLog('Set error message:', errorMessage);
      }
    } catch (error) {
      debugLog('Error fetching teams:', error);

      let errorMessage = 'Failed to fetch teams';

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Data validation and sanitization
  const validateTeamsData = (teams: any[]): Team[] => {
    debugLog('Validating teams data:', { count: teams.length });

    return teams.filter(team => {
      // Basic validation
      if (!team || typeof team !== 'object') {
        debugLog('Invalid team object:', team);
        return false;
      }

      // Required fields validation
      const requiredFields = ['id', 'name', 'description', 'ownerId', 'maxMembers'];
      for (const field of requiredFields) {
        if (!team[field]) {
          debugLog(`Missing required field: ${field}`, team);
          return false;
        }
      }

      // Ensure members array exists
      if (!Array.isArray(team.members)) {
        team.members = [];
        debugLog('Fixed missing members array for team:', team.id);
      }

      // Ensure owner object exists
      if (!team.owner || typeof team.owner !== 'object') {
        debugLog('Invalid owner object for team:', team.id);
        return false;
      }

      // Ensure event object exists (optional but if present should be valid)
      if (team.event && typeof team.event !== 'object') {
        debugLog('Invalid event object for team:', team.id);
        team.event = undefined;
      }

      return true;
    }).map(team => ({
      ...team,
      // Ensure safe defaults
      tags: team.tags || '',
      lookingFor: team.lookingFor || '',
      isActive: team.isActive ?? true,
      createdAt: team.createdAt || new Date().toISOString(),
      updatedAt: team.updatedAt || new Date().toISOString(),
      maxMembers: Math.max(1, parseInt(team.maxMembers) || 1),
    }));
  };

  const handleRetry = () => {
    debugLog('Retrying teams fetch');
    setRetryCount(prev => prev + 1);
    fetchTeams();
  };

  const handleJoinRequest = () => {
    // Refresh teams to show updated member count
    fetchTeams();
  };

  const handleRequestProcessed = () => {
    // Refresh teams to show updated member count
    fetchTeams();
  };

  const filters = [
    { id: 'all', label: 'All Teams', count: teams.length },
    { id: 'recruiting', label: 'Recruiting', count: teams.filter(t => t.members.length < t.maxMembers).length },
    { id: 'full', label: 'Full', count: teams.filter(t => t.members.length >= t.maxMembers).length }
  ];

  const filteredTeams = teams.filter(team => {
    try {
      const matchesFilter = activeFilter === 'all' ||
        (activeFilter === 'recruiting' && team.members.length < team.maxMembers) ||
        (activeFilter === 'full' && team.members.length >= team.maxMembers);

      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        team.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.tags || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (team.lookingFor || '').toLowerCase().includes(searchQuery.toLowerCase());

      return matchesFilter && matchesSearch;
    } catch (error) {
      debugLog('Error filtering team:', { teamId: team.id, error });
      return false;
    }
  });

  const getStatusColor = (team: Team) => {
    try {
      return team.members.length < team.maxMembers ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800';
    } catch (error) {
      debugLog('Error getting status color for team:', { teamId: team.id, error });
      return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (team: Team) => {
    try {
      return team.members.length < team.maxMembers ? 'Recruiting' : 'Full';
    } catch (error) {
      debugLog('Error getting status text for team:', { teamId: team.id, error });
      return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Unknown date';

      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return '1 day ago';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
      return `${Math.ceil(diffDays / 30)} months ago`;
    } catch (error) {
      debugLog('Error formatting date:', { dateString, error });
      return 'Unknown date';
    }
  };

  const handleCreateSuccess = () => {
    debugLog('Team created successfully, refreshing teams');
    fetchTeams();
    setShowCreateForm(false);
  };

  // Safe access helper for team properties
  const safeGet = (obj: any, path: string, defaultValue: any = '') => {
    try {
      return path.split('.').reduce((current, key) => current?.[key], obj) ?? defaultValue;
    } catch (error) {
      debugLog('Error accessing object path:', { path, error });
      return defaultValue;
    }
  };

  // Helper functions for team interactions
  const isTeamOwner = (team: Team) => currentUser && team.ownerId === currentUser.id;
  const isTeamMember = (team: Team) => currentUser && team.members.some(member => member.userId === currentUser.id);
  const isTeamFull = (team: Team) => team.members.length >= team.maxMembers;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="text-center mb-8">
            <div className="h-10 bg-gray-200 rounded-lg w-80 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-gray-200 rounded-lg w-96 mx-auto animate-pulse"></div>
          </div>

          {/* Search Bar Skeleton */}
          <div className="max-w-md mx-auto mb-6">
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
          </div>

          {/* Filter Tabs Skeleton */}
          <div className="flex justify-center gap-2 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-20 bg-gray-200 rounded-lg animate-pulse"></div>
            ))}
          </div>

          {/* Teams Grid Skeleton */}
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <TeamCardSkeleton key={i} />
              ))}
            </div>
          </div>

          {retryCount > 0 && (
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500">Retry attempt {retryCount}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Find Your Perfect Team</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join existing teams or create your own to collaborate on amazing projects
          </p>
        </div>

        {/* Network Status Warning */}
        {!isOnline && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-lg text-center">
              ⚠️ You appear to be offline. Some features may not work properly.
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search teams..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              />
              <svg className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap justify-center gap-2">
            {filters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${activeFilter === filter.id
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                  }`}
              >
                {filter.label}
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>



        {/* Create Team CTA - For all authenticated users */}
        {canCreateTeams(currentUser) && (
          <div className="text-center mb-8">
            <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to build your dream team?</h3>
              <p className="text-gray-600 mb-4">Create your own team and start collaborating on amazing projects with talented people.</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="btn-primary px-8 py-3 hover:scale-105 transition-transform duration-200"
              >
                Create New Team
              </button>
              <p className="text-sm text-gray-500 mt-2">
                {canCreateEvents(currentUser)
                  ? ''
                  : ''
                }
              </p>
            </div>
          </div>
        )}

        {/* Error Display with Retry */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-center">
              <p className="mb-2">{error}</p>
              <button
                onClick={handleRetry}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTeams.map((team) => (
            <div key={team.id} className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              {/* Team Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {safeGet(team, 'name', 'T').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{safeGet(team, 'name', 'Unnamed Team')}</h3>
                      <p className="text-sm text-gray-500">{formatDate(safeGet(team, 'createdAt', ''))}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(team)}`}>
                    {getStatusText(team)}
                  </span>
                </div>

                <p className="text-gray-600 mb-4 line-clamp-2">{safeGet(team, 'description', 'No description available')}</p>

                {/* Event - with safe access */}
                {team.event && (
                  <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                    <p className="text-sm font-medium text-indigo-900">Event</p>
                    <p className="text-sm text-indigo-700">{safeGet(team.event, 'name', 'Unknown Event')}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs ${safeGet(team.event, 'type') === 'hackathon' ? 'bg-yellow-100 text-yellow-800' :
                        safeGet(team.event, 'type') === 'case-competition' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                        {safeGet(team.event, 'type') === 'hackathon' && '🏆'}
                        {safeGet(team.event, 'type') === 'case-competition' && '📋'}
                        {safeGet(team.event, 'type') === 'innovation-challenge' && '💡'}
                        {safeGet(team.event, 'type', 'other')}
                      </span>
                      {safeGet(team.event, 'location') && (
                        <span className="text-xs text-indigo-600 flex items-center gap-1">
                          📍 {safeGet(team.event, 'location')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Stats */}
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {safeGet(team, 'members.length', 0)}/{safeGet(team, 'maxMembers', 1)} members
                  </span>
                  <span className="text-indigo-600 font-medium">
                    {safeGet(team, 'members.length', 0) < safeGet(team, 'maxMembers', 1)
                      ? `${safeGet(team, 'maxMembers', 1) - safeGet(team, 'members.length', 0)} spots open`
                      : 'Team full'}
                  </span>
                </div>
              </div>

              {/* Team Members */}
              <div className="p-6 border-b border-gray-100">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Team Members</h4>
                <div className="space-y-3">
                  {/* All Members (including owner) */}
                  {Array.isArray(team.members) && team.members.slice(0, 4).map((member) => {
                    const isOwner = member.role === 'owner' || member.userId === team.ownerId;
                    return (
                      <div key={member.id} className={`flex items-center space-x-3 p-2 rounded-lg ${
                        isOwner ? 'bg-indigo-50' : 'bg-gray-50'
                      }`}>
                        <div className="relative">
                          {safeGet(member, 'user.profile.avatar') ? (
                            <Image
                              src={safeGet(member, 'user.profile.avatar')}
                              alt={safeGet(member, 'user.profile.displayName') || safeGet(member, 'user.name') || 'Member'}
                              width={32}
                              height={32}
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                debugLog('Image load error for member:', { memberId: member.id, error: e });
                              }}
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                              isOwner ? 'bg-indigo-600' : 'bg-gray-600'
                            }`}>
                              {(safeGet(member, 'user.profile.displayName') || safeGet(member, 'user.name') || 'M').charAt(0).toUpperCase()}
                            </div>
                          )}
                          {isOwner && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-500 border-2 border-white rounded-full"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {safeGet(member, 'user.profile.displayName') || safeGet(member, 'user.name') || 'Member'}
                          </p>
                          <p className="text-xs text-gray-500">
                            {isOwner ? 'Owner' : (safeGet(member, 'role', 'Member'))} • {formatDate(safeGet(member, 'joinedAt', ''))}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Show more members indicator */}
                  {Array.isArray(team.members) && team.members.length > 4 && (
                    <div className="text-center py-2">
                      <span className="text-xs text-gray-500">
                        +{team.members.length - 4} more members
                      </span>
                    </div>
                  )}

                  {/* Empty state */}
                  {(!Array.isArray(team.members) || team.members.length === 0) && (
                    <div className="text-center py-4 text-gray-500">
                      <p className="text-sm">No members yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Team Skills & Looking For */}
              <div className="p-6">
                {/* Skills */}
                {safeGet(team, 'tags') && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {safeGet(team, 'tags', '').split(',').slice(0, 4).map((tag: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {tag.trim()}
                        </span>
                      ))}
                      {safeGet(team, 'tags', '').split(',').length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{safeGet(team, 'tags', '').split(',').length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Looking For */}
                {safeGet(team, 'lookingFor') && safeGet(team, 'members.length', 0) < safeGet(team, 'maxMembers', 1) && (
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Looking For</h4>
                    <div className="flex flex-wrap gap-2">
                      {safeGet(team, 'lookingFor', '').split(',').slice(0, 3).map((role: string, index: number) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                          {role.trim()}
                        </span>
                      ))}
                      {safeGet(team, 'lookingFor', '').split(',').length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                          +{safeGet(team, 'lookingFor', '').split(',').length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-2">
                  {/* Join Team Button */}
                  <JoinTeamButton
                    teamId={team.id}
                    teamName={safeGet(team, 'name', 'Team')}
                    currentUserId={currentUser?.id}
                    isOwner={isTeamOwner(team)}
                    isAlreadyMember={isTeamMember(team)}
                    isTeamFull={isTeamFull(team)}
                    onJoinRequest={handleJoinRequest}
                  />

                  {/* Team Owner Actions */}
                  {isTeamOwner(team) && (
                    <div className="space-y-3">
                      <button
                        onClick={() => setShowJoinRequestsModal(team)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-xl hover:from-slate-700 hover:to-slate-800 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        <span className="font-medium">View Join Requests</span>
                      </button>
                      <button
                        onClick={() => setShowInviteModal(team)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="font-medium">Invite Users</span>
                      </button>
                      <button
                        onClick={() => setSelectedTeamForManagement(team)}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="font-medium">Manage Team</span>
                      </button>
                    </div>
                  )}

                  {/* Regular Member Actions */}
                  {!isTeamOwner(team) && isTeamMember(team) && (
                    <button
                      onClick={() => setSelectedTeamForManagement(team)}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span className="font-medium">View Team</span>
                    </button>
                  )}
                </div>


              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTeams.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search or filters to find more teams.</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary px-6 py-2"
            >
              Create Your Own Team
            </button>
          </div>
        )}

        {/* Tips Section */}
        <div className="mt-12">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">Tips for Finding the Right Team</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Research Teams</h4>
              <p className="text-gray-600">Look at team descriptions, skills, and project details to find the best match.</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Reach Out</h4>
              <p className="text-gray-600">Don't hesitate to contact teams and ask questions about their projects.</p>
            </div>

            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 100 4m-6 8a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Be Flexible</h4>
              <p className="text-gray-600">Consider teams that might need your skills even if they're not exactly what you envisioned.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Create Team Form Modal */}
      {showCreateForm && (
        <CreateTeamForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}

      {/* Team Management Modal */}
      {selectedTeamForManagement && currentUser && (
        <TeamManagementModal
          team={selectedTeamForManagement}
          currentUserId={currentUser.id}
          onClose={() => setSelectedTeamForManagement(null)}
          onUpdate={() => {
            setSelectedTeamForManagement(null);
            fetchTeams(); // Refresh teams list
          }}
        />
      )}

      {/* Join Requests Modal */}
      {showJoinRequestsModal && (
        <JoinRequestsModal
          isOpen={true}
          onClose={() => setShowJoinRequestsModal(null)}
          teamId={showJoinRequestsModal.id}
          teamName={showJoinRequestsModal.name}
          ownerId={showJoinRequestsModal.ownerId}
          onRequestProcessed={handleRequestProcessed}
        />
      )}

      {/* Invite User Modal */}
      {showInviteModal && (
        <InviteUserModal
          isOpen={true}
          onClose={() => setShowInviteModal(null)}
          teamId={showInviteModal.id}
          teamName={showInviteModal.name}
          onInviteSent={() => {
            fetchTeams(); // Refresh teams list
          }}
        />
      )}
    </div>
  );
}
