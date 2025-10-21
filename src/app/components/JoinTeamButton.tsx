"use client";

import { useState } from 'react';

interface JoinTeamButtonProps {
  teamId: string;
  teamName: string;
  currentUserId?: string;
  isOwner: boolean;
  isAlreadyMember: boolean;
  isTeamFull: boolean;
  onJoinRequest?: () => void;
}

export default function JoinTeamButton({
  teamId,
  teamName,
  currentUserId,
  isOwner,
  isAlreadyMember,
  isTeamFull,
  onJoinRequest
}: JoinTeamButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleRequestJoin = async () => {
    if (!currentUserId) {
      setError('You must be logged in to join a team');
      return;
    }

    if (!message.trim()) {
      setError('Please add a message explaining why you want to join');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch(`/api/teams/${teamId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: currentUserId,
          message: message.trim()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message || 'Join request sent successfully!');
        setMessage('');
        setTimeout(() => {
          setShowModal(false);
          setSuccess('');
          onJoinRequest?.();
        }, 2000);
      } else {
        setError(data.error || 'Failed to send join request');
      }
    } catch (error) {
      console.error('Error sending join request:', error);
      setError('Failed to send join request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show button if user is owner or already a member
  if (isOwner || isAlreadyMember) {
    return null;
  }

  // Show different button states
  if (isTeamFull) {
    return (
      <button
        disabled
        className="w-full px-4 py-2 bg-gray-300 text-gray-600 rounded-lg cursor-not-allowed"
      >
        Team Full
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full btn-primary py-3 text-center block"
      >
        Request to Join
      </button>

      {/* Join Request Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">Request to Join Team</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-2">
                Requesting to join: <span className="font-medium">{teamName}</span>
              </p>
            </div>

            <div className="p-6">
              {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {success && (
                <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  {success}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Why do you want to join this team? *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Tell the team about your skills, experience, and why you'd be a great addition..."
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 transition-colors"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestJoin}
                  disabled={isSubmitting || !message.trim()}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
