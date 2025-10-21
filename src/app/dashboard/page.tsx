"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ProfileSkeleton, CardSkeleton } from '../components/SkeletonLoader';
import LoadingSpinner from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

interface DashboardData {
  user: {
    id: string;
    email: string;
    profile: {
      displayName: string;
      avatar: string | null;
      role: string;
      bio: string;
      isAvailable: boolean;
      skills?: Array<{ name: string }>;
      interests?: Array<{ name: string }>;
      links?: {
        github?: string;
        linkedin?: string;
        portfolio?: string;
      };
      projectsCompleted?: number;
    } | null;
  };
  stats: {
    totalProjects: number;
    completedProjects: number;
    totalEarnings: number;
    averageRating: number;
  };
  recentTeams: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
  recentEvents: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
  }>;
}

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<Array<{ id: string; name: string; email: string; role: string; createdAt: string }>>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      // Check if user is authenticated and has admin role
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          
          // Check if user has admin role
          if (data.user.role !== 'admin') {
            setError('Access denied. Only admin users can access the dashboard.');
            setLoading(false);
            return;
          }
          
          // If admin, fetch dashboard data and users
          fetchDashboardData(data.user.id);
          fetchAllUsers();
        } else {
          setError('Authentication required. Please sign in.');
          setLoading(false);
        }
      } else {
        setError('Authentication failed. Please sign in.');
        setLoading(false);
      }
    } catch (err) {
      setError('Failed to check authentication');
      setLoading(false);
      console.error('Auth check error:', err);
    }
  };

  const fetchDashboardData = async (userId?: string) => {
    try {
      setLoading(true);
      const url = userId ? `/api/dashboard?userId=${userId}` : '/api/dashboard';
      const response = await fetch(url);
      const result = await response.json();
      
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch (err) {
      setUsers([]);
    } finally {
      setUsersLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const confirmed = window.confirm('Delete this user and related data?');
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/admin/users/${userId}/soft-delete`, { method: 'POST' });
      if (response.ok) {
        setUsers(prev => prev.filter(u => u.id !== userId));
        showToast({ type: 'success', title: 'User deleted', message: 'The user was removed successfully.' });
      } else {
        const err = await response.json().catch(() => ({} as any));
        showToast({ type: 'error', title: 'Delete failed', message: err.error || 'Unable to delete user' });
      }
    } catch (e) {
      showToast({ type: 'error', title: 'Delete failed', message: 'Network error' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Link
              href="/signin"
              className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/"
              className="inline-block px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="xl" className="mb-6" />
          <p className="text-xl text-gray-600 font-medium">Loading dashboard...</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with your TeamUp profile.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              {dashboardData.stats.totalProjects}
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.totalProjects}</p>
            <p className="text-sm text-gray-600">Total Projects</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              {dashboardData.stats.completedProjects}
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.completedProjects}</p>
            <p className="text-sm text-gray-600">Completed</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              ${dashboardData.stats.totalEarnings}
            </div>
            <p className="text-2xl font-bold text-gray-900">${dashboardData.stats.totalEarnings}</p>
            <p className="text-sm text-gray-600">Total Earnings</p>
          </div>
          
          <div className="glass-card rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
              {dashboardData.stats.averageRating}
            </div>
            <p className="text-2xl font-bold text-gray-900">{dashboardData.stats.averageRating}</p>
            <p className="text-sm text-gray-600">Avg Rating</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'profile', 'teams', 'events', 'users'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8"></div>
        )}

        {activeTab === 'teams' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Teams</h3>
            {dashboardData.recentTeams && dashboardData.recentTeams.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentTeams.map((team) => (
                  <div key={team.id} className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{team.name}</h4>
                        <p className="text-sm text-gray-600">{team.description}</p>
                      </div>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        Status: {team.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Created At:</span> {new Date(team.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No teams found yet.</p>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Your Profile</h3>
              <Link href="/profile" className="btn-primary px-4 py-2 text-sm">
                Edit Profile
              </Link>
            </div>
            
            {dashboardData.user ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h4>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                          {dashboardData.user.profile?.displayName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <h5 className="font-semibold text-gray-900 text-lg">
                            {dashboardData.user.profile?.displayName || 'No Name Set'}
                          </h5>
                          <p className="text-gray-600">{dashboardData.user.profile?.role || 'No Role Set'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-gray-500">Bio</label>
                          <p className="text-gray-900">{dashboardData.user.profile?.bio || 'No bio added yet. Add a bio to help others get to know you better!'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Availability</label>
                          <p className="text-gray-900">{dashboardData.user.profile?.isAvailable ? 'Available for matches' : 'Not available for matches'}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">Matches</label>
                          <p className="text-gray-900">{dashboardData.user.profile?.isAvailable ? 'Matches available' : 'No matches available'}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Bio</h4>
                    <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">
                      {dashboardData.user.profile?.bio || 'No bio added yet. Add a bio to help others get to know you better!'}
                    </p>
                  </div>
                </div>

                {/* Skills & Interests */}
                <div className="space-y-6">
                  {/* Skills */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Skills</h4>
                    {dashboardData.user.profile?.skills && dashboardData.user.profile.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dashboardData.user.profile.skills.map((skill: any, index: number) => (
                          <span key={index} className="px-3 py-2 bg-indigo-100 text-indigo-800 text-sm font-medium rounded-full">
                            {skill.name || skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No skills added yet</p>
                    )}
                  </div>

                  {/* Interests */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Interests</h4>
                    {dashboardData.user.profile?.interests && dashboardData.user.profile.interests.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {dashboardData.user.profile.interests.map((interest: any, index: number) => (
                          <span key={index} className="px-3 py-2 bg-purple-100 text-purple-800 text-sm font-medium rounded-full">
                            {interest.name || interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No interests added yet</p>
                    )}
                  </div>

                  {/* Social Links */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Social Links</h4>
                    <div className="space-y-2">
                      {dashboardData.user.profile?.links?.github && (
                        <a href={dashboardData.user.profile.links.github} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                          </svg>
                          <span>GitHub</span>
                        </a>
                      )}
                      {dashboardData.user.profile?.links?.linkedin && (
                        <a href={dashboardData.user.profile.links.linkedin} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                          </svg>
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {dashboardData.user.profile?.links?.portfolio && (
                        <a href={dashboardData.user.profile.links.portfolio} target="_blank" rel="noopener noreferrer" 
                           className="flex items-center space-x-2 text-gray-600 hover:text-gray-900">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                          </svg>
                          <span>Portfolio</span>
                        </a>
                      )}
                      {(!dashboardData.user.profile?.links?.github && !dashboardData.user.profile?.links?.linkedin && !dashboardData.user.profile?.links?.portfolio) && (
                        <p className="text-gray-500 text-sm">No social links added yet</p>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div>
                    <h4 className="text-lg font-medium text-gray-900 mb-3">Profile Stats</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-indigo-600">{dashboardData.user.profile?.projectsCompleted || 0}</p>
                        <p className="text-sm text-gray-600">Projects Completed</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-purple-600">{dashboardData.user.profile?.skills?.length || 0}</p>
                        <p className="text-sm text-gray-600">Skills</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Profile Not Found</h3>
                <p className="text-gray-600 mb-4">We couldn't find your profile information. Please complete your profile to see it here.</p>
                <Link href="/profile" className="btn-primary px-6 py-2">
                  Complete Profile
                </Link>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
            {dashboardData.recentEvents && dashboardData.recentEvents.length > 0 ? (
              <div className="space-y-4">
                {dashboardData.recentEvents.map((event) => (
                  <div key={event.id} className="p-4 border border-gray-100 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">{event.name}</h4>
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                        Event
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                      <span className="flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {event.location}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No upcoming events found.</p>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
              <button
                onClick={fetchAllUsers}
                className="text-sm text-indigo-600 hover:text-indigo-500"
              >
                Refresh
              </button>
            </div>
            {usersLoading ? (
              <div className="text-center py-8">
                <LoadingSpinner />
                <p className="text-gray-600 mt-2">Loading users...</p>
              </div>
            ) : users.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {users.map((u) => (
                  <div key={u.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{u.name || u.email}</p>
                      <p className="text-sm text-gray-600">{u.email}</p>
                    </div>
                    <div className="text-right">
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded-full mr-3">
                        {u.role}
                      </span>
                      <span className="text-xs text-gray-500 mr-3">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </span>
                      <button onClick={() => handleDeleteUser(u.id)} className="px-3 py-1 text-xs bg-red-600 text-white rounded-md hover:bg-red-700">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No users found.</p>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/teams" className="glass-card rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">View Teams</p>
              <p className="text-sm text-gray-600">Browse and join teams</p>
            </Link>

            <Link href="/events" className="glass-card rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">View Events</p>
              <p className="text-sm text-gray-600">Discover upcoming events</p>
            </Link>

            <Link href="/people" className="glass-card rounded-xl p-4 text-center hover:shadow-lg transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mx-auto mb-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="font-medium text-gray-900">View People</p>
              <p className="text-sm text-gray-600">Connect with others</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
