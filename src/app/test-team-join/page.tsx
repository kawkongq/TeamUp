"use client";

import { useState, useEffect } from 'react';
import CreateTeamForm from '../components/CreateTeamForm';
import JoinTeamButton from '../components/JoinTeamButton';
import TeamJoinRequests from '../components/TeamJoinRequests';

export default function TestTeamJoinPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
    fetchTeams();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (response.ok) {
        const data = await response.json();
        setTeams(data.teams || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleCreateSuccess = () => {
    fetchTeams();
    setShowCreateForm(false);
  };

  const handleJoinRequest = () => {
    fetchTeams();
  };

  const handleRequestProcessed = () => {
    fetchTeams();
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Team Join Functionality Test</h1>
          <p className="text-gray-600">Test the team join request system</p>
        </div>

        {/* Current User Info */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Current User</h2>
          {currentUser ? (
            <div className="space-y-2">
              <p><strong>ID:</strong> {currentUser.id}</p>
              <p><strong>Name:</strong> {currentUser.name}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
            </div>
          ) : (
            <p className="text-gray-500">Not authenticated</p>
          )}
        </div>

        {/* Create Team Button */}
        <div className="text-center mb-8">
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary px-8 py-3"
          >
            Create Test Team
          </button>
        </div>

        {/* Teams List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Teams</h2>
          {teams.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-500">No teams found. Create one to test the join functionality.</p>
            </div>
          ) : (
            teams.map((team) => (
              <div key={team.id} className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-gray-600">{team.description}</p>
                    <p className="text-sm text-gray-500">
                      Members: {team.members?.length || 0}/{team.maxMembers}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Owner: {team.owner?.name}</p>
                    <p className="text-sm text-gray-500">Event: {team.event?.name}</p>
                  </div>
                </div>

                {/* Join Button */}
                <div className="mb-4">
                  <JoinTeamButton
                    teamId={team.id}
                    teamName={team.name}
                    currentUserId={currentUser?.id}
                    isOwner={currentUser && team.ownerId === currentUser.id}
                    isAlreadyMember={currentUser && team.members?.some((m: any) => m.userId === currentUser.id)}
                    isTeamFull={(team.members?.length || 0) >= team.maxMembers}
                    onJoinRequest={handleJoinRequest}
                  />
                </div>

                {/* Team Owner Actions */}
                {currentUser && team.ownerId === currentUser.id && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Team Owner Actions</h4>
                    <TeamJoinRequests
                      teamId={team.id}
                      ownerId={team.ownerId}
                      onRequestProcessed={handleRequestProcessed}
                    />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Create Team Form Modal */}
      {showCreateForm && (
        <CreateTeamForm
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
