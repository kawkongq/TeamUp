"use client";

import { useState, useEffect } from 'react';
import Button from './Button';
import { useToast } from './Toast';
import LoadingSpinner from './LoadingSpinner';

interface Person {
  id: string;
  name: string;
  role: string;
  avatar: string | null;
}

interface Team {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  members: any[];
  ownerId: string;
}

interface InviteToTeamModalProps {
  person: Person;
  currentUserId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function InviteToTeamModal({ 
  person, 
  currentUserId, 
  onClose, 
  onSuccess 
}: InviteToTeamModalProps) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [message, setMessage] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    fetchUserTeams();
    
    // Prevent body scroll when modal is open
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const fetchUserTeams = async () => {
    try {
      const response = await fetch(`/api/teams?ownerId=${currentUserId}`);
      if (response.ok) {
        const data = await response.json();
        // Filter teams where user is owner and team is not full
        const availableTeams = (data.teams || []).filter((team: Team) => 
          team.ownerId === currentUserId && 
          team.members.length < team.maxMembers
        );
        setTeams(availableTeams);
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

  const handleInvite = async () => {
    if (!selectedTeam) {
      showToast({
        type: 'warning',
        title: 'Team Required',
        message: 'Please select a team to invite to'
      });
      return;
    }

    setInviting(true);
    try {
      const response = await fetch('/api/team-invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamId: selectedTeam,
          inviteeId: person.id,
          inviterId: currentUserId,
          message: message.trim() || `Hi ${person.name}, you've been invited to join our team!`
        })
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Invitation Sent!',
          message: `Invitation sent to ${person.name}`
        });
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Invitation Failed',
        message: error instanceof Error ? error.message : 'Failed to send invitation'
      });
    } finally {
      setInviting(false);
    }
  };

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
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-sm sm:max-w-md my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b">
          <div className="min-w-0 flex-1 pr-4">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">Invite to Team</h2>
            <p className="text-sm sm:text-base text-gray-600 truncate">Invite {person.name} to join your team</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          {/* Person Info */}
          <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl mb-6">
            <div className="w-12 h-12 rounded-xl overflow-hidden">
              {person.avatar ? (
                <img
                  src={person.avatar.startsWith('http') ? person.avatar : 
                       person.avatar.startsWith('/uploads/') ? person.avatar : 
                       `/uploads/${person.avatar}`}
                  alt={person.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
                  {person.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">{person.name}</h3>
              <p className="text-sm text-gray-600">{person.role}</p>
            </div>
          </div>

          {/* Team Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Team *
            </label>
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <LoadingSpinner size="sm" />
                <span className="ml-2 text-sm text-gray-500">Loading your teams...</span>
              </div>
            ) : teams.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">You don't have any teams with available spots.</p>
                <a href="/teams" className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                  Create a team →
                </a>
              </div>
            ) : (
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Choose a team...</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.members.length}/{team.maxMembers} members)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Message */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Invitation Message (Optional)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder={`Hi ${person.name}, you've been invited to join our team!`}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={handleInvite}
              loading={inviting}
              loadingText="Sending..."
              disabled={!selectedTeam || teams.length === 0}
              fullWidth
            >
              Send Invitation
            </Button>
            <Button
              variant="secondary"
              onClick={onClose}
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}