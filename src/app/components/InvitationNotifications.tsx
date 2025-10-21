"use client";

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNotification } from '../contexts/NotificationContext';

interface Invitation {
  id: string;
  message: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    description: string;
    memberCount: number;
    maxMembers: number;
    tags: string;
    lookingFor: string;
    owner: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
    event: {
      id: string;
      name: string;
      startDate: string;
      endDate: string;
      location?: string;
    } | null;
  };
}

interface InvitationNotificationsProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvitationNotifications({ userId, isOpen, onClose }: InvitationNotificationsProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  useEffect(() => {
    if (isOpen && userId) {
      loadInvitations();
    }
  }, [isOpen, userId]);

  const loadInvitations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invitations?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setInvitations(data.invitations);
      } else {
        console.error('Failed to load invitations');
      }
    } catch (error) {
      console.error('Error loading invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResponse = async (invitationId: string, action: 'accept' | 'reject') => {
    try {
      const response = await fetch(`/api/invitations/${invitationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        const data = await response.json();
        showSuccess(
          action === 'accept' ? 'Invitation Accepted' : 'Invitation Rejected',
          data.message
        );
        
        // Remove the invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        const errorData = await response.json();
        showError('Error', errorData.error || `Failed to ${action} invitation`);
      }
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error);
      showError('Error', `Failed to ${action} invitation`);
    }
  };

  if (!isOpen) return null;

  // Use portal to render outside of navbar's DOM tree
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Team Invitations</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {invitations.length > 0 && (
            <p className="text-gray-600 mt-2">You have {invitations.length} pending team invitation{invitations.length > 1 ? 's' : ''}</p>
          )}
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Team Invitations</h3>
              <p className="text-gray-600">You don't have any pending team invitations at the moment.</p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                  {/* Team Owner Info */}
                  <div className="flex items-center space-x-4 mb-4">
                    {invitation.team.owner.avatar ? (
                      <img
                        src={invitation.team.owner.avatar}
                        alt={invitation.team.owner.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        {invitation.team.owner.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-gray-900">
                        <span className="text-indigo-600">{invitation.team.owner.name}</span> invited you to join
                      </p>
                      <p className="text-sm text-gray-600">{new Date(invitation.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>

                  {/* Team Info */}
                  <div className="bg-white rounded-lg p-4 mb-4">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{invitation.team.name}</h3>
                    <p className="text-gray-600 mb-3">{invitation.team.description}</p>
                    
                    {invitation.team.event && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                        <h4 className="font-medium text-purple-900 mb-1">Event: {invitation.team.event.name}</h4>
                        <p className="text-sm text-purple-700">
                          {new Date(invitation.team.event.startDate).toLocaleDateString()} - {new Date(invitation.team.event.endDate).toLocaleDateString()}
                        </p>
                        {invitation.team.event.location && (
                          <p className="text-sm text-purple-700">📍 {invitation.team.event.location}</p>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Members:</span>
                        <span className="ml-2 text-gray-900">{invitation.team.memberCount}/{invitation.team.maxMembers}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Looking for:</span>
                        <span className="ml-2 text-gray-900">{invitation.team.lookingFor}</span>
                      </div>
                    </div>

                    {invitation.team.tags && (
                      <div className="mt-3">
                        <span className="font-medium text-gray-700 text-sm">Skills:</span>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {invitation.team.tags.split(',').map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {tag.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Personal Message */}
                  {invitation.message && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-yellow-800 mb-1">Personal Message:</p>
                      <p className="text-yellow-700">"{invitation.message}"</p>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4">
                    <button
                      onClick={() => handleResponse(invitation.id, 'accept')}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Accept Invitation</span>
                    </button>
                    <button
                      onClick={() => handleResponse(invitation.id, 'reject')}
                      className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold flex items-center justify-center space-x-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}