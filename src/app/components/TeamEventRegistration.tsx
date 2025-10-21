"use client";

import { useState, useEffect } from 'react';
import { useToast } from './Toast';

interface Team {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  tags: string;
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
}

interface Event {
  id: string;
  name: string;
  description?: string;
}

interface TeamEventRegistrationProps {
  event: Event;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TeamEventRegistration({ event, onClose, onSuccess }: TeamEventRegistrationProps) {
  const [userTeams, setUserTeams] = useState<Team[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [registrationStatuses, setRegistrationStatuses] = useState<{[key: string]: boolean}>({});
  const { showToast } = useToast();

  useEffect(() => {
    fetchUserTeams();
  }, []);

  useEffect(() => {
    if (userTeams.length > 0) {
      checkRegistrationStatuses();
    }
  }, [userTeams]);

  const fetchUserTeams = async () => {
    try {
      const response = await fetch('/api/teams/my-teams', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setUserTeams(data.teams || []);
      } else {
        showToast({
          type: 'error',
          title: 'Failed to Load Teams',
          message: 'Could not load your teams'
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

  const checkRegistrationStatuses = async () => {
    const statuses: {[key: string]: boolean} = {};
    
    for (const team of userTeams) {
      try {
        const response = await fetch(`/api/teams/${team.id}/registration-status?eventId=${event.id}`, {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          statuses[team.id] = data.isRegistered;
        }
      } catch (error) {
        console.error(`Failed to check registration status for team ${team.id}:`, error);
      }
    }
    
    setRegistrationStatuses(statuses);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTeamId) {
      showToast({
        type: 'warning',
        title: 'Team Required',
        message: 'Please select a team to register'
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/teams/${selectedTeamId}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          eventId: event.id,
          message
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Registration Successful',
          message: 'Your team has been registered for this event!'
        });
        onSuccess();
      } else {
        showToast({
          type: 'error',
          title: 'Registration Failed',
          message: data?.error || 'Failed to register team'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const availableTeams = userTeams.filter(team => !registrationStatuses[team.id]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Register Team for Event</h2>
              <p className="text-indigo-100 mt-1">{event.name}</p>
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
              <span className="ml-3 text-gray-600">Loading your teams...</span>
            </div>
          ) : userTeams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No teams found</h3>
              <p className="text-gray-600 mb-4">You need to create or join a team first.</p>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Create a Team
              </button>
            </div>
          ) : availableTeams.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">All teams registered</h3>
              <p className="text-gray-600">All your teams are already registered for this event.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Team Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Team to Register
                </label>
                <div className="space-y-3">
                  {availableTeams.map((team) => (
                    <div
                      key={team.id}
                      className={`border rounded-xl p-4 cursor-pointer transition-all ${
                        selectedTeamId === team.id
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setSelectedTeamId(team.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="radio"
                          name="team"
                          value={team.id}
                          checked={selectedTeamId === team.id}
                          onChange={() => setSelectedTeamId(team.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <span className="text-white font-bold text-sm">
                                {team.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{team.name}</h4>
                              <p className="text-sm text-gray-600">{team.description}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{team.members.length + 1}/{team.maxMembers} members</span>
                            {team.tags && <span>Tags: {team.tags}</span>}
                          </div>
                          
                          {team.members.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 mb-1">Members:</p>
                              <div className="flex flex-wrap gap-1">
                                {team.members.map((member) => (
                                  <span key={member.id} className="bg-gray-100 px-2 py-1 rounded text-xs">
                                    {member.user.profile?.displayName || member.user.email}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Message */}
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell the organizers why your team wants to participate..."
                />
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !selectedTeamId}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Registering...' : 'Register Team'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}