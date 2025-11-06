"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../contexts/NotificationContext';
import PersonProfileModal from '../components/PersonProfileModal';
import { debugLog } from '@/lib/logger';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    status: 'active' | 'inactive';
    avatar?: string;
    createdAt: string;
    teamsOwned?: number;
    teamMemberships?: number;
}

interface Team {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    maxMembers: number;
    createdBy: string;
    createdAt: string;
    isActive: boolean;
}

interface Event {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    location: string;
    participantCount: number;
    maxParticipants: number;
    createdBy: string;
    createdAt: string;
    isActive: boolean;
}

export default function AdminDashboard() {
    const router = useRouter();
    const { showSuccess, showError, showInfo } = useNotification();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [isAdmin, setIsAdmin] = useState(false);

    // Data states
    const [users, setUsers] = useState<User[]>([]);
    const [teams, setTeams] = useState<Team[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0, totalTeams: 0, totalEvents: 0 });

    // Filter states
    const [userFilter, setUserFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [showUserModal, setShowUserModal] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [userDetails, setUserDetails] = useState<any>(null);
    const [passwordDetails, setPasswordDetails] = useState<any>(null);

    // Team modal states
    const [showTeamModal, setShowTeamModal] = useState(false);
    const [showEditTeamModal, setShowEditTeamModal] = useState(false);
    const [teamDetails, setTeamDetails] = useState<any>(null);
    const [editingTeam, setEditingTeam] = useState<any>(null);

    // Event modal states
    const [showEventModal, setShowEventModal] = useState(false);
    const [showEditEventModal, setShowEditEventModal] = useState(false);
    const [eventDetails, setEventDetails] = useState<any>(null);
    const [editingEvent, setEditingEvent] = useState<any>(null);

    const loadData = useCallback(async () => {
        try {
            // Load stats first (always needed)
            const statsResponse = await fetch('/api/admin/stats');
            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                setStats(statsData.stats || { totalUsers: 0, activeUsers: 0, totalTeams: 0, totalEvents: 0 });
            } else {
                setStats({ totalUsers: 0, activeUsers: 0, totalTeams: 0, totalEvents: 0 });
            }

            // Only load data for the active tab to improve performance
            if (activeTab === 'users' || activeTab === 'overview') {
                const usersResponse = await fetch('/api/admin/users');
                if (usersResponse.ok) {
                    const usersData = await usersResponse.json();
                    setUsers(usersData.users || []);
                } else {
                    setUsers([]);
                }
            }

            if (activeTab === 'teams' || activeTab === 'overview') {
                const teamsResponse = await fetch('/api/admin/teams');
                if (teamsResponse.ok) {
                    const teamsData = await teamsResponse.json();
                    setTeams(teamsData.teams || []);
                } else {
                    setTeams([]);
                }
            }

            if (activeTab === 'events' || activeTab === 'overview') {
                const eventsResponse = await fetch('/api/admin/events');
                if (eventsResponse.ok) {
                    const eventsData = await eventsResponse.json();
                    setEvents(eventsData.events || []);
                } else {
                    setEvents([]);
                }
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
            showError('Load Error', 'Failed to load admin data');
        }
    }, [activeTab, showError]);

    const checkAdminAccess = useCallback(async () => {
        try {
            // Check authentication via API
            const response = await fetch('/api/auth/check', {
                credentials: 'include'
            });

            if (!response.ok) {
                router.push('/signin');
                return;
            }

            const authData = await response.json();

            if (!authData.authenticated || !authData.user) {
                router.push('/signin');
                return;
            }

            // Check if user is admin or organizer
            if (authData.user.role !== 'admin' && authData.user.role !== 'organizer') {
                showError('Access Denied', 'You do not have permission to access the admin dashboard');
                router.push('/');
                return;
            }

            setIsAdmin(true);
            await loadData();
        } catch (error) {
            console.error('Error checking admin access:', error);
            showError('Error', 'Failed to verify admin access');
            router.push('/signin');
        } finally {
            setLoading(false);
        }
    }, [router, showError, loadData]);

    useEffect(() => {
        void checkAdminAccess();
    }, [checkAdminAccess]);

    // Load data when tab changes
    useEffect(() => {
        if (isAdmin) {
            void loadData();
        }
    }, [isAdmin, loadData]);

    const handleViewUser = async (userId: string) => {
        try {
            const response = await fetch(`/api/admin/users/${userId}`);
            if (response.ok) {
                const data = await response.json();
                setUserDetails(data.user);
                setShowUserModal(true);
            } else {
                showError('Error', 'Failed to load user details');
            }
        } catch (error) {
            console.error('Error loading user details:', error);
            showError('Error', 'Failed to load user details');
        }
    };

    const handleViewProfile = async (userId: string) => {
        try {
            debugLog('Loading user profile for:', userId);
            const response = await fetch(`/api/admin/users/${userId}`);
            debugLog('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                debugLog('User data loaded:', data.user);
                setUserDetails(data.user);
                setShowProfileModal(true);
            } else {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                showError('Error', 'Failed to load user profile');
            }
        } catch (error) {
            console.error('Error loading user profile:', error);
            showError('Error', 'Failed to load user profile');
        }
    };

    const handleViewPassword = async (userId: string) => {
        try {
            debugLog('Loading user password for:', userId);
            const response = await fetch(`/api/admin/users/${userId}/password`);
            debugLog('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                debugLog('Password data loaded:', data.user);
                setPasswordDetails(data.user);
                setShowPasswordModal(true);
            } else {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                showError('Error', 'Failed to load user password');
            }
        } catch (error) {
            console.error('Error loading user password:', error);
            showError('Error', 'Failed to load user password');
        }
    };

    const handleDeleteUser = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        if (confirm(`Are you sure you want to delete "${user.name}"?\n\nThis will permanently remove:\n• User account and profile\n• All team memberships and owned teams\n• All invitations and join requests\n• All chats and messages\n• All matches and swipes\n• All projects and social links\n\nThis action cannot be undone!`)) {
            try {
                const response = await fetch(`/api/admin/users/${userId}/soft-delete`, {
                    method: 'POST'
                });

                if (response.ok) {
                    await loadData(); // Reload all data
                    showSuccess('User Completely Deleted', 'User and all related data have been permanently removed from the system');
                } else {
                    const errorData = await response.json();
                    console.error('Delete error:', errorData);
                    showError('Delete Failed', errorData.details || 'Failed to delete user and related data');
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                showError('Delete Failed', 'Network error occurred');
            }
        }
    };



    const handleViewTeam = async (teamId: string) => {
        try {
            debugLog('Loading team details for:', teamId);
            const response = await fetch(`/api/admin/teams/${teamId}`);
            debugLog('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                debugLog('Team data loaded:', data.team);
                setTeamDetails(data.team);
                setShowTeamModal(true);
            } else {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                showError('Error', 'Failed to load team details');
            }
        } catch (error) {
            console.error('Error loading team details:', error);
            showError('Error', 'Failed to load team details');
        }
    };

    const handleEditTeam = async (teamId: string) => {
        try {
            const response = await fetch(`/api/admin/teams/${teamId}`);
            if (response.ok) {
                const data = await response.json();
                setEditingTeam(data.team);
                setShowEditTeamModal(true);
            } else {
                showError('Error', 'Failed to load team for editing');
            }
        } catch (error) {
            console.error('Error loading team for editing:', error);
            showError('Error', 'Failed to load team for editing');
        }
    };

    const handleUpdateTeam = async (teamData: any) => {
        try {
            const response = await fetch(`/api/admin/teams/${editingTeam.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(teamData)
            });

            if (response.ok) {
                await loadData(); // Reload all data
                setShowEditTeamModal(false);
                setEditingTeam(null);
                showSuccess('Team Updated', 'Team has been successfully updated');
            } else {
                const errorData = await response.json();
                showError('Update Failed', errorData.error || 'Failed to update team');
            }
        } catch (error) {
            console.error('Error updating team:', error);
            showError('Update Failed', 'Failed to update team');
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        const team = teams.find(t => t.id === teamId);
        if (!team) return;

        if (confirm(`Are you sure you want to delete "${team.name}"? This action cannot be undone.`)) {
            try {
                const response = await fetch(`/api/admin/teams/${teamId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await loadData(); // Reload all data
                    showSuccess('Team Deleted', 'Team has been successfully deleted');
                } else {
                    const errorData = await response.json();
                    showError('Delete Failed', errorData.error || 'Failed to delete team');
                }
            } catch (error) {
                console.error('Error deleting team:', error);
                showError('Delete Failed', 'Failed to delete team');
            }
        }
    };

    const handleViewEvent = async (eventId: string) => {
        try {
            debugLog('Loading event details for:', eventId);
            const response = await fetch(`/api/admin/events/${eventId}`);
            debugLog('Response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                debugLog('Event data loaded:', data.event);
                setEventDetails(data.event);
                setShowEventModal(true);
            } else {
                const errorText = await response.text();
                console.error('API Error:', errorText);
                showError('Error', 'Failed to load event details');
            }
        } catch (error) {
            console.error('Error loading event details:', error);
            showError('Error', 'Failed to load event details');
        }
    };

    const handleEditEvent = async (eventId: string) => {
        try {
            const response = await fetch(`/api/admin/events/${eventId}`);
            if (response.ok) {
                const data = await response.json();
                setEditingEvent(data.event);
                setShowEditEventModal(true);
            } else {
                showError('Error', 'Failed to load event for editing');
            }
        } catch (error) {
            console.error('Error loading event for editing:', error);
            showError('Error', 'Failed to load event for editing');
        }
    };

    const handleUpdateEvent = async (eventData: any) => {
        try {
            const response = await fetch(`/api/admin/events/${editingEvent.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                await loadData(); // Reload all data
                setShowEditEventModal(false);
                setEditingEvent(null);
                showSuccess('Event Updated', 'Event has been successfully updated');
            } else {
                const errorData = await response.json();
                showError('Update Failed', errorData.error || 'Failed to update event');
            }
        } catch (error) {
            console.error('Error updating event:', error);
            showError('Update Failed', 'Failed to update event');
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        const event = events.find(e => e.id === eventId);
        if (!event) return;

        if (confirm(`Are you sure you want to delete "${event.title}"? This will also delete all associated teams and cannot be undone.`)) {
            try {
                const response = await fetch(`/api/admin/events/${eventId}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    await loadData(); // Reload all data
                    showSuccess('Event Deleted', 'Event has been successfully deleted');
                } else {
                    const errorData = await response.json();
                    showError('Delete Failed', errorData.error || 'Failed to delete event');
                }
            } catch (error) {
                console.error('Error deleting event:', error);
                showError('Delete Failed', 'Failed to delete event');
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesFilter = userFilter === 'all' ||
            (userFilter === 'active' && user.status === 'active') ||
            (userFilter === 'inactive' && user.status === 'inactive');

        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesFilter && matchesSearch;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                    <p className="text-xl text-gray-600 font-medium">Loading admin dashboard...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-full mb-6 shadow-2xl">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-red-600 via-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
                        Admin Dashboard
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Manage users, teams, and events across the platform
                    </p>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 font-semibold text-lg">Total Users</p>
                                <p className="text-4xl font-bold text-blue-800">{stats.totalUsers}</p>
                                <p className="text-sm text-blue-600">{stats.activeUsers} active</p>
                                {stats.totalUsers === 0 && (
                                    <p className="text-xs text-red-500 mt-1">No data loaded</p>
                                )}
                            </div>
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 font-semibold text-lg">Total Teams</p>
                                <p className="text-4xl font-bold text-green-800">{stats.totalTeams}</p>
                            </div>
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-2xl p-8 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-600 font-semibold text-lg">Total Events</p>
                                <p className="text-4xl font-bold text-purple-800">{stats.totalEvents}</p>
                            </div>
                            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center">
                                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Management Tabs */}
                <div className="flex flex-wrap justify-center mb-8 bg-white rounded-2xl p-2 shadow-lg border border-gray-200">
                    {[
                        { id: 'overview', label: 'Overview', icon: '' },
                        { id: 'users', label: 'Users', icon: '' },
                        { id: 'teams', label: 'Teams', icon: '' },
                        { id: 'events', label: 'Events', icon: '' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center space-x-2 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-red-500 to-pink-600 text-white shadow-lg'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <span className="text-lg">{tab.icon}</span>
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Content based on active tab */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="p-8">
                            <h2 className="text-3xl font-bold text-gray-900 mb-8">Platform Overview</h2>

                            {/* Quick Actions */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <button
                                    onClick={() => setActiveTab('users')}
                                    className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Users</h3>
                                    <p className="text-gray-600">View, edit, and delete user accounts</p>
                                </button>

                                <button
                                    onClick={() => setActiveTab('teams')}
                                    className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Teams</h3>
                                    <p className="text-gray-600">Oversee team creation and management</p>
                                </button>

                                <button
                                    onClick={() => setActiveTab('events')}
                                    className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Manage Events</h3>
                                    <p className="text-gray-600">Create and moderate platform events</p>
                                </button>

                                <button
                                    onClick={() => showInfo('System Status', 'All systems are running normally')}
                                    className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl hover:shadow-lg transition-all duration-300 group"
                                >
                                    <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">System Reports</h3>
                                    <p className="text-gray-600">View platform analytics and reports</p>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Users Management Tab */}
                    {activeTab === 'users' && (
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900">User Management</h2>
                                <div className="flex space-x-4">
                                    <button
                                        onClick={loadData}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Refresh Data
                                    </button>
                                    <button
                                        onClick={() => window.open('/api/admin/users', '_blank')}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Test Users API
                                    </button>
                                    <input
                                        type="text"
                                        placeholder="Search users..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    />
                                    <select
                                        value={userFilter}
                                        onChange={(e) => setUserFilter(e.target.value)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                    >
                                        <option value="all">All Users</option>
                                        <option value="active">Active Users</option>
                                        <option value="inactive">Inactive Users</option>
                                    </select>
                                </div>
                            </div>

                            {/* User Count */}
                            <div className="mb-4 text-sm text-gray-600">
                                Showing {filteredUsers.length} of {users.length} users
                                {users.length === 0 && (
                                    <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                        <p className="text-yellow-800">No users loaded. Try clicking &quot;Refresh Data&quot; or check the console for errors.</p>
                                        <p className="text-xs text-yellow-600 mt-1">Debug: Check browser console for API errors</p>
                                    </div>
                                )}
                                {users.length > 0 && (
                                    <div className="mt-1 text-xs text-green-600">
                                        Users loaded successfully
                                    </div>
                                )}
                            </div>

                            {/* User List */}
                            <div className="space-y-4">
                                {filteredUsers.map((user) => (
                                    <div key={user.id} className="bg-gray-50 rounded-xl p-6 flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-gray-900">{user.name}</h3>
                                                <p className="text-gray-600">{user.email}</p>
                                                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">ID: {user.id}</p>
                                                <div className="flex items-center space-x-4 mt-1">
                                                    <span className="text-sm text-gray-500 capitalize">{user.role}</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {user.status === 'active' ? 'Active' : 'Inactive'}
                                                    </span>
                                                    <span className="text-sm text-gray-500">Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewUser(user.id)}
                                                className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors"
                                            >
                                                View
                                            </button>
                                            <button
                                                onClick={() => handleViewProfile(user.id)}
                                                className="px-4 py-2 bg-green-100 text-green-800 rounded-lg hover:bg-green-200 transition-colors"
                                            >
                                                View Profile
                                            </button>
                                            <button
                                                onClick={() => handleViewPassword(user.id)}
                                                className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors"
                                            >
                                                View Password
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUser(user.id)}
                                                className="px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Teams Management Tab */}
                    {activeTab === 'teams' && (
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900">Team Management</h2>
                            </div>

                            {/* Mock Team List */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {teams.map((team) => (
                                    <div key={team.id} className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-900">{team.name}</h3>
                                                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">ID: {team.id}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTeam(team.id)}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                        <p className="text-gray-600 mb-4">{team.description}</p>
                                        <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                                            <span>{team.memberCount} members</span>
                                            <span>Created {new Date(team.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewTeam(team.id)}
                                                className="flex-1 px-3 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                                            >
                                                View Details
                                            </button>
                                            <button
                                                onClick={() => handleEditTeam(team.id)}
                                                className="flex-1 px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                                            >
                                                Edit Team
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Events Management Tab */}
                    {activeTab === 'events' && (
                        <div className="p-8">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-3xl font-bold text-gray-900">Event Management</h2>
                            </div>

                            {/* Mock Event List */}
                            <div className="space-y-6">
                                {events.map((event) => (
                                    <div key={event.id} className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h3>
                                                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mb-2 inline-block">ID: {event.id}</p>
                                                <p className="text-gray-600 mb-4">{event.description}</p>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500 mb-4">
                                                    <div>
                                                        <span className="font-semibold">Start:</span> {new Date(event.startDate).toLocaleDateString()}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Location:</span> {event.location}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold">Participants:</span> {event.participantCount}
                                                    </div>
                                                </div>
                                                <div className="flex space-x-4">
                                                    <button
                                                        onClick={() => handleViewEvent(event.id)}
                                                        className="px-4 py-2 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors font-medium"
                                                    >
                                                        View Details
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditEvent(event.id)}
                                                        className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors font-medium"
                                                    >
                                                        Edit Event
                                                    </button>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteEvent(event.id)}
                                                className="ml-4 text-red-600 hover:text-red-800 transition-colors"
                                            >
                                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* User Details Modal */}
                {showUserModal && userDetails && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">User Details</h2>
                                    <button
                                        onClick={() => setShowUserModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Basic Info */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            <p className="text-lg text-gray-900">{userDetails.name}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <p className="text-lg text-gray-900">{userDetails.email}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                            <p className="text-lg text-gray-900 capitalize">{userDetails.role}</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                                {userDetails.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Teams */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Teams Owned ({userDetails.ownedTeams.length})</h3>
                                        {userDetails.ownedTeams.length > 0 ? (
                                            <div className="space-y-2">
                                                {userDetails.ownedTeams.map((team: any) => (
                                                    <div key={team.id} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{team.name}</h4>
                                                                <p className="text-sm text-gray-600">{team.description}</p>
                                                            </div>
                                                            <span className="text-sm text-gray-500">{team.memberCount} members</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No teams owned</p>
                                        )}
                                    </div>

                                    {/* Team Memberships */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Memberships ({userDetails.teamMemberships.length})</h3>
                                        {userDetails.teamMemberships.length > 0 ? (
                                            <div className="space-y-2">
                                                {userDetails.teamMemberships.map((membership: any) => (
                                                    <div key={membership.id} className="bg-gray-50 rounded-lg p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{membership.name}</h4>
                                                                <p className="text-sm text-gray-600">{membership.description}</p>
                                                            </div>
                                                            <span className="text-sm text-gray-500 capitalize">{membership.role}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No team memberships</p>
                                        )}
                                    </div>

                                    {/* Event Participations */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Participations ({userDetails.eventParticipations.length})</h3>
                                        {userDetails.eventParticipations.length > 0 ? (
                                            <div className="space-y-2">
                                                {userDetails.eventParticipations.map((participation: any) => (
                                                    <div key={participation.id} className="bg-gray-50 rounded-lg p-3">
                                                        <h4 className="font-medium text-gray-900">{participation.name}</h4>
                                                        <p className="text-sm text-gray-600">{participation.description}</p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(participation.startDate).toLocaleDateString()} - {new Date(participation.endDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No event participations</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Profile Modal */}
                {showProfileModal && userDetails && (
                    <PersonProfileModal
                        person={userDetails}
                        onClose={() => setShowProfileModal(false)}
                        onInviteToTeam={() => showInfo('Invite', 'Team invitation feature coming soon')}
                        onStartChat={() => showInfo('Chat', 'Chat feature coming soon')}
                        currentUser={{ id: 'admin' }}
                    />
                )}

                {/* Team Details Modal */}
                {showTeamModal && teamDetails && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Team Details</h2>
                                    <button
                                        onClick={() => setShowTeamModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Team Info */}
                                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">{teamDetails.name}</h3>
                                        <p className="text-gray-600 mb-4">{teamDetails.description}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Members:</span>
                                                <span className="ml-2 text-gray-900">{teamDetails.memberCount}/{teamDetails.maxMembers}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${teamDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {teamDetails.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Created:</span>
                                                <span className="ml-2 text-gray-900">{new Date(teamDetails.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {teamDetails.tags && (
                                            <div className="mt-4">
                                                <span className="font-medium text-gray-700">Tags:</span>
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {teamDetails.tags.split(',').map((tag: string, index: number) => (
                                                        <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                            {tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Owner Info */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Owner</h3>
                                        <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-4">
                                            <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold">
                                                {teamDetails.owner.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{teamDetails.owner.name}</h4>
                                                <p className="text-sm text-gray-600">{teamDetails.owner.email}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Event Info */}
                                    {teamDetails.event && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Associated Event</h3>
                                            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                                <h4 className="font-medium text-gray-900">{teamDetails.event.name}</h4>
                                                <p className="text-sm text-gray-600 mb-2">{teamDetails.event.description}</p>
                                                <div className="text-xs text-gray-500">
                                                    <span>{new Date(teamDetails.event.startDate).toLocaleDateString()}</span>
                                                    {teamDetails.event.location && <span> • {teamDetails.event.location}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Team Members */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Team Members ({teamDetails.members.length})</h3>
                                        {teamDetails.members.length > 0 ? (
                                            <div className="space-y-3">
                                                {teamDetails.members.map((member: any) => (
                                                    <div key={member.id} className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                                                        <div className="flex items-center space-x-4">
                                                            <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                                {member.user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h4 className="font-medium text-gray-900">{member.user.name}</h4>
                                                                <p className="text-sm text-gray-600">{member.user.email}</p>
                                                                <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">ID: {member.user.id}</p>
                                                                {member.user.location && (
                                                                    <p className="text-xs text-gray-500">{member.user.location}</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                                                                {member.role}
                                                            </span>
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Joined {new Date(member.joinedAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No members yet</p>
                                        )}
                                    </div>

                                    {/* Join Requests */}
                                    {teamDetails.joinRequests.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Join Requests ({teamDetails.joinRequests.length})</h3>
                                            <div className="space-y-3">
                                                {teamDetails.joinRequests.map((request: any) => (
                                                    <div key={request.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-4">
                                                                <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                                                    {request.user.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-medium text-gray-900">{request.user.name}</h4>
                                                                    <p className="text-sm text-gray-600">{request.user.email}</p>
                                                                    <p className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded mt-1 inline-block">ID: {request.user.id}</p>
                                                                    {request.message && (
                                                                        <p className="text-sm text-gray-700 mt-1">&quot;{request.message}&quot;</p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {new Date(request.createdAt).toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Team Modal */}
                {showEditTeamModal && editingTeam && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Edit Team</h2>
                                    <button
                                        onClick={() => setShowEditTeamModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const teamData = {
                                        name: formData.get('name'),
                                        description: formData.get('description'),
                                        maxMembers: parseInt(formData.get('maxMembers') as string),
                                        tags: formData.get('tags'),
                                        lookingFor: formData.get('lookingFor'),
                                        isActive: formData.get('isActive') === 'on'
                                    };
                                    handleUpdateTeam(teamData);
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={editingTeam.name}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            defaultValue={editingTeam.description}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                                        <input
                                            type="number"
                                            name="maxMembers"
                                            defaultValue={editingTeam.maxMembers}
                                            min="1"
                                            max="20"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
                                        <input
                                            type="text"
                                            name="tags"
                                            defaultValue={editingTeam.tags}
                                            placeholder="React, Node.js, AI, etc."
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Looking For</label>
                                        <textarea
                                            name="lookingFor"
                                            defaultValue={editingTeam.lookingFor}
                                            rows={2}
                                            placeholder="What skills or roles are you looking for?"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            defaultChecked={editingTeam.isActive}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Team is active
                                        </label>
                                    </div>

                                    <div className="flex space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditTeamModal(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                        >
                                            Update Team
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Event Details Modal */}
                {showEventModal && eventDetails && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Event Details</h2>
                                    <button
                                        onClick={() => setShowEventModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Event Info */}
                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                                        <h3 className="text-xl font-bold text-gray-900 mb-4">{eventDetails.name}</h3>
                                        <p className="text-gray-600 mb-4">{eventDetails.description}</p>

                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Type:</span>
                                                <span className="ml-2 text-gray-900 capitalize">{eventDetails.type}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Teams:</span>
                                                <span className="ml-2 text-gray-900">{eventDetails.teamCount}</span>
                                                {eventDetails.maxTeams && <span className="text-gray-500">/{eventDetails.maxTeams}</span>}
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Participants:</span>
                                                <span className="ml-2 text-gray-900">{eventDetails.totalParticipants}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">Status:</span>
                                                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${eventDetails.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {eventDetails.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-sm">
                                            <div>
                                                <span className="font-medium text-gray-700">Start Date:</span>
                                                <span className="ml-2 text-gray-900">{new Date(eventDetails.startDate).toLocaleString()}</span>
                                            </div>
                                            <div>
                                                <span className="font-medium text-gray-700">End Date:</span>
                                                <span className="ml-2 text-gray-900">{new Date(eventDetails.endDate).toLocaleString()}</span>
                                            </div>
                                            <div className="md:col-span-2">
                                                <span className="font-medium text-gray-700">Location:</span>
                                                <span className="ml-2 text-gray-900">{eventDetails.location}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Teams */}
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Participating Teams ({eventDetails.teams.length})</h3>
                                        {eventDetails.teams.length > 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {eventDetails.teams.map((team: any) => (
                                                    <div key={team.id} className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex justify-between items-start mb-2">
                                                            <h4 className="font-medium text-gray-900">{team.name}</h4>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${team.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {team.isActive ? 'Active' : 'Inactive'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 mb-3">{team.description}</p>

                                                        <div className="flex items-center justify-between">
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                                    {team.owner.name.charAt(0)}
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-medium text-gray-900">{team.owner.name}</p>
                                                                    <p className="text-xs text-gray-500">Owner</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-medium text-gray-900">{team.memberCount}/{team.maxMembers}</p>
                                                                <p className="text-xs text-gray-500">Members</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-gray-500">No teams registered yet</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Edit Event Modal */}
                {showEditEventModal && editingEvent && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900">Edit Event</h2>
                                    <button
                                        onClick={() => setShowEditEventModal(false)}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <form onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    const eventData = {
                                        name: formData.get('name'),
                                        description: formData.get('description'),
                                        type: formData.get('type'),
                                        startDate: formData.get('startDate'),
                                        endDate: formData.get('endDate'),
                                        location: formData.get('location'),
                                        maxTeams: formData.get('maxTeams') ? parseInt(formData.get('maxTeams') as string) : null,
                                        isActive: formData.get('isActive') === 'on'
                                    };
                                    handleUpdateEvent(eventData);
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Event Name</label>
                                        <input
                                            type="text"
                                            name="name"
                                            defaultValue={editingEvent.name}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea
                                            name="description"
                                            defaultValue={editingEvent.description}
                                            rows={3}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Event Type</label>
                                            <select
                                                name="type"
                                                defaultValue={editingEvent.type}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            >
                                                <option value="hackathon">Hackathon</option>
                                                <option value="competition">Competition</option>
                                                <option value="workshop">Workshop</option>
                                                <option value="conference">Conference</option>
                                                <option value="meetup">Meetup</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Max Teams</label>
                                            <input
                                                type="number"
                                                name="maxTeams"
                                                defaultValue={editingEvent.maxTeams || ''}
                                                min="1"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input
                                                type="datetime-local"
                                                name="startDate"
                                                defaultValue={new Date(editingEvent.startDate).toISOString().slice(0, 16)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                            <input
                                                type="datetime-local"
                                                name="endDate"
                                                defaultValue={new Date(editingEvent.endDate).toISOString().slice(0, 16)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            defaultValue={editingEvent.location}
                                            placeholder="Bangkok, Thailand or Online"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            name="isActive"
                                            defaultChecked={editingEvent.isActive}
                                            className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                        />
                                        <label className="ml-2 block text-sm text-gray-700">
                                            Event is active
                                        </label>
                                    </div>

                                    <div className="flex space-x-4 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowEditEventModal(false)}
                                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                                        >
                                            Update Event
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Password Details Modal */}
                {showPasswordModal && passwordDetails && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                            <div className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white p-6 rounded-t-2xl">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                            </svg>
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold">Password Details</h2>
                                            <p className="text-yellow-100">{passwordDetails.name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="p-8">
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-6">
                                    <div className="flex items-center space-x-3 mb-4">
                                        <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                        </svg>
                                        <h3 className="text-lg font-semibold text-yellow-800">Security Warning</h3>
                                    </div>
                                    <p className="text-yellow-700">
                                        This information is highly sensitive. Plain text passwords should never be stored or exposed in production environments.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">User Information</label>
                                        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Name:</span>
                                                <span className="font-medium">{passwordDetails.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Email:</span>
                                                <span className="font-medium">{passwordDetails.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">User ID:</span>
                                                <span className="font-mono text-sm bg-gray-200 px-2 py-1 rounded">{passwordDetails.id}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Created:</span>
                                                <span className="font-medium">{new Date(passwordDetails.createdAt).toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Plain Text Password</label>
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span className="text-green-800 font-medium">Readable Password</span>
                                            </div>
                                            <div className="bg-white border border-green-200 rounded p-4">
                                                <div className="text-2xl font-bold text-green-800 text-center py-4">
                                                    {passwordDetails.plainPassword || 'Not available'}
                                                </div>
                                            </div>
                                            <p className="text-green-600 text-sm mt-2">
                                                This is the actual password that the user uses to sign in.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password Hash (Technical)</label>
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-center space-x-2 mb-2">
                                                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                                </svg>
                                                <span className="text-gray-800 font-medium">Encrypted Hash (bcrypt)</span>
                                            </div>
                                            <div className="bg-white border border-gray-200 rounded p-3">
                                                <code className="text-xs font-mono text-gray-600 break-all">
                                                    {passwordDetails.passwordHash}
                                                </code>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <span className="text-blue-800 font-medium">Information</span>
                                        </div>
                                        <ul className="text-blue-700 text-sm space-y-1">
                                            <li>• Passwords are encrypted using bcrypt with salt rounds</li>
                                            <li>• Original passwords cannot be recovered from the hash</li>
                                            <li>• This hash is used for password verification only</li>
                                            <li>• For password reset, generate a new password and hash</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="flex justify-end space-x-4 mt-8">
                                    <button
                                        onClick={() => setShowPasswordModal(false)}
                                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Close
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(passwordDetails.plainPassword || 'Not available');
                                            showSuccess('Copied', 'Password copied to clipboard');
                                        }}
                                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Copy Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(passwordDetails.passwordHash);
                                            showSuccess('Copied', 'Password hash copied to clipboard');
                                        }}
                                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                                    >
                                        Copy Hash
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
