"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../contexts/NotificationContext';

interface Invitation {
  _id: string;
  teamId: {
    _id: string;
    name: string;
    description: string;
    eventId?: {
      _id: string;
      title: string;
    };
  };
  invitedBy: {
    _id: string;
    name: string;
    email: string;
  };
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export default function InvitationsPage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    checkAuthAndLoadInvitations();
  }, []);

  const checkAuthAndLoadInvitations = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (!response.ok) {
        router.push('/signin');
        return;
      }

      const data = await response.json();
      if (!data.authenticated || !data.user) {
        router.push('/signin');
        return;
      }

      setUserId(data.user.id);
      await loadInvitations(data.user.id);
    } catch (error) {
      console.error('Auth check error:', error);
      showError('Error', 'Failed to verify authentication');
      router.push('/signin');
    }
  };

  const loadInvitations = async (uid: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations?userId=${uid}`);
      
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations || []);
      } else {
        showError('Error', 'Failed to load invitations');
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
      showError('Error', 'Failed to load invitations');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (response.ok) {
        showSuccess(
          action === 'accept' ? 'Invitation Accepted' : 'Invitation Declined',
          action === 'accept' 
            ? 'You have joined the team!' 
            : 'Invitation has been declined'
        );
        await loadInvitations(userId);
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      showError('Error', `Failed to ${action} invitation`);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  const respondedInvitations = invitations.filter(inv => inv.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Loading invitations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Team Invitations
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Manage your team invitations and join exciting projects
          </p>
        </div>

        {/* Pending Invitations */}
        {pendingInvitations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Pending Invitations</h2>
            <div className="space-y-4">
              {pendingInvitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {invitation.teamId.name}
                      </h3>
                      <p className="text-gray-600 mb-3">{invitation.teamId.description}</p>
                      
                      {invitation.teamId.eventId && (
                        <div className="inline-flex items-center space-x-2 bg-purple-50 border border-purple-200 rounded-lg px-3 py-1 mb-3">
                          <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-sm font-medium text-purple-700">
                            {invitation.teamId.eventId.title}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Invited by {invitation.invitedBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>{formatDate(invitation.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleInvitation(invitation._id, 'accept')}
                        className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2 rounded-xl font-semibold hover:from-green-600 hover:to-emerald-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleInvitation(invitation._id, 'decline')}
                        className="bg-gray-200 text-gray-700 px-6 py-2 rounded-xl font-semibold hover:bg-gray-300 transform hover:scale-105 transition-all duration-300"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Responded Invitations */}
        {respondedInvitations.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Past Invitations</h2>
            <div className="space-y-4">
              {respondedInvitations.map((invitation) => (
                <div
                  key={invitation._id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">
                        {invitation.teamId.name}
                      </h3>
                      <p className="text-gray-600 mb-3">{invitation.teamId.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>Invited by {invitation.invitedBy.name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>{formatDate(invitation.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className={`px-4 py-2 rounded-xl font-semibold ${
                      invitation.status === 'accepted'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {invitation.status === 'accepted' ? 'Accepted' : 'Declined'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {invitations.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Invitations</h3>
            <p className="text-gray-600 mb-6">You don't have any team invitations at the moment</p>
            <button
              onClick={() => router.push('/teams')}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg"
            >
              Browse Teams
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
