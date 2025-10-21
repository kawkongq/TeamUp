"use client";

import { useState, useEffect } from 'react';
import Button from './Button';
import { useToast } from './Toast';
import LoadingSpinner from './LoadingSpinner';

interface TeamMember {
  id: string;
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
  role: string;
  joinedAt: string;
  isActive: boolean;
}

interface JoinRequest {
  id: string;
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
  message?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
  maxMembers: number;
  tags: string;
  lookingFor: string;
  isActive: boolean;
  ownerId: string;
  members: TeamMember[];
  joinRequests: JoinRequest[];
}

interface TeamManagementModalProps {
  team: Team;
  currentUserId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function TeamManagementModal({ 
  team, 
  currentUserId, 
  onClose, 
  onUpdate 
}: TeamManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'requests' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({
    name: team.name,
    description: team.description,
    maxMembers: team.maxMembers,
    lookingFor: team.lookingFor,
    isActive: team.isActive
  });
  const { showToast } = useToast();

  const isOwner = team.ownerId === currentUserId;
  const pendingRequests = team.joinRequests?.filter(req => req.status === 'PENDING') || [];

  // Prevent body scroll when modal is open
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, []);

  const handleUpdateTeam = async () => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData)
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Team Updated',
          message: 'Team information has been updated successfully'
        });
        setEditMode(false);
        onUpdate();
      } else {
        throw new Error('Failed to update team');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Update Failed',
        message: 'Failed to update team information'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRequest = async (requestId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId, 
          action, 
          ownerId: team.ownerId 
        })
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: action === 'approve' ? 'Request Approved' : 'Request Rejected',
          message: `Join request has been ${action}d`
        });
        onUpdate();
      } else {
        throw new Error(`Failed to ${action} request`);
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: `Failed to ${action} join request`
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}/members/${memberId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Member Removed',
          message: 'Team member has been removed'
        });
        onUpdate();
      } else {
        throw new Error('Failed to remove member');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Remove Failed',
        message: 'Failed to remove team member'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!isOwner) return;
    
    if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/teams/${team.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Team Deleted',
          message: 'Team has been deleted successfully'
        });
        onClose();
        onUpdate();
      } else {
        throw new Error('Failed to delete team');
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete team'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden my-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{team.name}</h2>
            <p className="text-gray-600">Team Management</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'members', label: `Members (${team.members?.length || 0})` },
            { id: 'requests', label: `Requests (${pendingRequests.length})` },
            ...(isOwner ? [{ id: 'settings', label: 'Settings' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-indigo-600 border-b-2 border-indigo-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{team.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900">Max Members</h4>
                  <p className="text-gray-600">{team.maxMembers}</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Current Members</h4>
                  <p className="text-gray-600">{team.members?.length || 0}</p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Looking For</h4>
                <p className="text-gray-600">{team.lookingFor}</p>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-2">
                  {team.tags.split(',').map((tag, index) => (
                    <span key={index} className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-4">
              {team.members?.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.user.profile?.displayName?.charAt(0) || member.user.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="font-medium">{member.user.profile?.displayName || member.user.name}</p>
                      <p className="text-sm text-gray-600">{member.user.profile?.role || 'Member'}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">
                      {member.role === 'owner' ? 'Owner' : 'Member'}
                    </span>
                    {isOwner && member.user.id !== currentUserId && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        loading={loading}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No pending join requests</p>
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {request.user.profile?.displayName?.charAt(0) || request.user.name?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p className="font-medium">{request.user.profile?.displayName || request.user.name}</p>
                          <p className="text-sm text-gray-600">{request.user.profile?.role || 'Developer'}</p>
                        </div>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    {request.message && (
                      <p className="text-gray-600 mb-3 text-sm">{request.message}</p>
                    )}
                    
                    {isOwner && (
                      <div className="flex space-x-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoinRequest(request.id, 'approve')}
                          loading={loading}
                        >
                          Approve
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleJoinRequest(request.id, 'reject')}
                          loading={loading}
                        >
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && isOwner && (
            <div className="space-y-6">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Team Name</label>
                    <input
                      type="text"
                      value={editData.name}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={editData.description}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Max Members</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={editData.maxMembers}
                      onChange={(e) => setEditData({ ...editData, maxMembers: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Looking For</label>
                    <input
                      type="text"
                      value={editData.lookingFor}
                      onChange={(e) => setEditData({ ...editData, lookingFor: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={editData.isActive}
                      onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
                      className="mr-2"
                    />
                    <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Team is active and accepting members
                    </label>
                  </div>
                  
                  <div className="flex space-x-3">
                    <Button
                      variant="primary"
                      onClick={handleUpdateTeam}
                      loading={loading}
                    >
                      Save Changes
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    variant="primary"
                    onClick={() => setEditMode(true)}
                  >
                    Edit Team Information
                  </Button>
                  
                  <div className="border-t pt-4">
                    <h4 className="text-lg font-semibold text-red-600 mb-2">Danger Zone</h4>
                    <p className="text-gray-600 mb-4">
                      Once you delete a team, there is no going back. Please be certain.
                    </p>
                    <Button
                      variant="danger"
                      onClick={handleDeleteTeam}
                      loading={loading}
                    >
                      Delete Team
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}