"use client";

import { useState, useEffect } from 'react';
import { useToast } from './Toast';

interface Registration {
  id: string;
  status: string;
  message?: string;
  createdAt: string;
  team: {
    id: string;
    name: string;
    description: string;
    maxMembers: number;
    tags: string;
    owner: {
      id: string;
      email: string;
      profile?: {
        displayName?: string;
      };
    };
    members: Array<{
      id: string;
      role: string;
      user: {
        id: string;
        email: string;
        profile?: {
          displayName?: string;
        };
      };
    }>;
  };
}

interface EventRegistrationsProps {
  eventId: string;
  eventName: string;
  onClose: () => void;
}

export default function EventRegistrations({ eventId, eventName, onClose }: EventRegistrationsProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchRegistrations();
  }, [eventId]);

  const fetchRegistrations = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setRegistrations(data.registrations || []);
      } else {
        const errorData = await response.json();
        showToast({
          type: 'error',
          title: 'Failed to Load Registrations',
          message: errorData.error || 'Could not load registrations'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      case 'PENDING':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Team Registrations</h2>
              <p className="text-indigo-100 mt-1">{eventName}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              <span className="ml-3 text-gray-600">Loading registrations...</span>
            </div>
          ) : registrations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No team registrations yet</h3>
              <p className="text-gray-600">No teams have registered for this event yet.</p>
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Total Registrations</p>
                      <p className="text-2xl font-bold text-gray-900">{registrations.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Approved</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {registrations.filter(r => r.status === 'APPROVED').length}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-600">Pending</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {registrations.filter(r => r.status === 'PENDING').length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Team Registrations List */}
              <div className="space-y-4">
                {registrations.map((registration) => (
                  <div key={registration.id} className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {/* Team Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                            <span className="text-white font-bold text-lg">
                              {registration.team.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 text-lg">{registration.team.name}</h4>
                            <p className="text-sm text-gray-600">{registration.team.description}</p>
                          </div>
                        </div>
                        
                        {/* Team Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Team Owner:</span> {registration.team.owner.profile?.displayName || registration.team.owner.email}
                            </p>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Max Members:</span> {registration.team.maxMembers}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Current Members:</span> {registration.team.members.length + 1}
                            </p>
                            {registration.team.tags && (
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Tags:</span> {registration.team.tags}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Team Members */}
                        {registration.team.members.length > 0 && (
                          <div className="mb-3">
                            <p className="text-sm font-medium text-gray-700 mb-2">Team Members:</p>
                            <div className="flex flex-wrap gap-2">
                              {registration.team.members.map((member) => (
                                <div key={member.id} className="bg-white px-3 py-1 rounded-full text-xs border">
                                  <span className="font-medium">{member.user.profile?.displayName || member.user.email}</span>
                                  <span className="text-gray-500 ml-1">({member.role})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {registration.message && (
                          <div className="mb-3">
                            <p className="text-sm text-gray-700">
                              <span className="font-medium">Registration Message:</span> {registration.message}
                            </p>
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500">
                          Registered on {formatDate(registration.createdAt)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                          {registration.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}