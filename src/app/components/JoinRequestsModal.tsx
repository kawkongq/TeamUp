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

interface JoinRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  ownerId: string;
  onRequestProcessed?: () => void;
}

export default function JoinRequestsModal({
  isOpen,
  onClose,
  teamId,
  teamName,
  ownerId,
  onRequestProcessed
}: JoinRequestsModalProps) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen, teamId, ownerId]);

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

  const pendingRequests = requests.filter(req => req.status === 'PENDING');
  const processedRequests = requests.filter(req => req.status !== 'PENDING');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Join Requests</h2>
              <p className="text-indigo-100 mt-1">{teamName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
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
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading join requests...</p>
            </div>
          ) : error ? (
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
          ) : (
            <div className="space-y-6">
              {/* Pending Requests */}
              {pendingRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                    Pending Requests ({pendingRequests.length})
                  </h3>
                  <div className="space-y-4">
                    {pendingRequests.map((request) => (
                      <div
                        key={request.id}
                        className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start space-x-4">
                          {/* User Avatar */}
                          <div className="flex-shrink-0">
                            {request.user.profile?.avatar ? (
                              <Image
                                src={request.user.profile.avatar}
                                alt={request.user.profile.displayName || request.user.name || 'User'}
                                width={56}
                                height={56}
                                className="w-14 h-14 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium text-xl">
                                {(request.user.profile?.displayName || request.user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>

                          {/* Request Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="text-lg font-medium text-gray-900">
                                  {request.user.profile?.displayName || request.user.name || 'Unknown User'}
                                </h4>
                                <p className="text-sm text-gray-600">{request.user.email}</p>
                                {request.user.profile?.role && (
                                  <p className="text-sm text-indigo-600 font-medium">{request.user.profile.role}</p>
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
                              <div className="mb-4">
                                <p className="text-sm text-gray-700 bg-white rounded-lg p-3 border">
                                  "{request.message}"
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="flex items-center space-x-3">
                              <button
                                onClick={() => handleRequestAction(request.id, 'approve')}
                                disabled={processingRequest === request.id}
                                className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>{processingRequest === request.id ? 'Processing...' : 'Approve'}</span>
                              </button>
                              <button
                                onClick={() => handleRequestAction(request.id, 'reject')}
                                disabled={processingRequest === request.id}
                                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                <span>{processingRequest === request.id ? 'Processing...' : 'Reject'}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Processed Requests */}
              {processedRequests.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-gray-400 rounded-full mr-2"></span>
                    Recent Activity ({processedRequests.length})
                  </h3>
                  <div className="space-y-3">
                    {processedRequests.slice(0, 5).map((request) => (
                      <div
                        key={request.id}
                        className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            {request.user.profile?.avatar ? (
                              <Image
                                src={request.user.profile.avatar}
                                alt={request.user.profile.displayName || request.user.name || 'User'}
                                width={40}
                                height={40}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                {(request.user.profile?.displayName || request.user.name || 'U').charAt(0).toUpperCase()}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900">
                                {request.user.profile?.displayName || request.user.name || 'Unknown User'}
                              </p>
                              <div className="flex items-center space-x-2">
                                {getStatusBadge(request.status)}
                                <span className="text-xs text-gray-500">
                                  {formatDate(request.updatedAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {requests.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No join requests</h3>
                  <p className="text-gray-600">When people request to join your team, they'll appear here.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t">
          <div className="flex items-center justify-between">
            <button
              onClick={fetchRequests}
              className="text-sm text-indigo-600 hover:text-indigo-800 transition-colors flex items-center space-x-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Refresh</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}