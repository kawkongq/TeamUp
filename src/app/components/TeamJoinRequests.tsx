"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface JoinRequest {
  id: string;
  userId: string;
  message: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
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
}

interface TeamJoinRequestsProps {
  teamId: string;
  ownerId: string;
  onRequestProcessed?: () => void;
}

export default function TeamJoinRequests({
  teamId,
  ownerId,
  onRequestProcessed
}: TeamJoinRequestsProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [teamId, ownerId]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/teams/${teamId}/requests?ownerId=${ownerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch join requests');
      }
    } catch (error) {
      console.error('Error fetching join requests:', error);
      setError('Failed to fetch join requests');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      setProcessingRequest(requestId);
      
      const response = await fetch(`/api/teams/${teamId}/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestId,
          action,
          ownerId
        }),
      });

      if (response.ok) {
        // Update the local state
        setRequests(prev => prev.map(req => 
          req.id === requestId 
            ? { ...req, status: action === 'approve' ? 'APPROVED' : 'REJECTED' }
            : req
        ));
        
        // Notify parent component
        onRequestProcessed?.();
      } else {
        const errorData = await response.json();
        setError(errorData.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
      setError(`Failed to ${action} request`);
    } finally {
      setProcessingRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800', text: 'Pending' },
      APPROVED: { color: 'bg-green-100 text-green-800', text: 'Approved' },
      REJECTED: { color: 'bg-red-100 text-red-800', text: 'Rejected' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING;

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading join requests...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
        {error}
        <button
          onClick={() => {
            setError('');
            fetchRequests();
          }}
          className="ml-2 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No join requests</h3>
        <p className="text-gray-600">When people request to join your team, they'll appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Join Requests ({requests.length})</h3>
        <button
          onClick={fetchRequests}
          className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          Refresh
        </button>
      </div>

      {requests.map((request) => (
        <div
          key={request.id}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-3">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {request.user.profile?.avatar ? (
                <Image
                  src={request.user.profile.avatar}
                  alt={request.user.profile.displayName || request.user.name || 'User'}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {(request.user.profile?.displayName || request.user.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Request Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    {request.user.profile?.displayName || request.user.name || 'Unknown User'}
                  </h4>
                  <p className="text-sm text-gray-500">{request.user.email}</p>
                  {request.user.profile?.role && (
                    <p className="text-xs text-gray-400">{request.user.profile.role}</p>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(request.status)}
                  <span className="text-xs text-gray-500">
                    {formatDate(request.createdAt)}
                  </span>
                </div>
              </div>

              {request.message && (
                <div className="mt-3">
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                    "{request.message}"
                  </p>
                </div>
              )}

              {/* Action Buttons - Only show for pending requests */}
              {request.status === 'PENDING' && (
                <div className="flex items-center space-x-2 mt-3">
                  <button
                    onClick={() => handleRequestAction(request.id, 'approve')}
                    disabled={processingRequest === request.id}
                    className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingRequest === request.id ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    onClick={() => handleRequestAction(request.id, 'reject')}
                    disabled={processingRequest === request.id}
                    className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processingRequest === request.id ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
