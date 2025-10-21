"use client";

import { useState, useEffect } from 'react';

export default function AdminTestPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('Testing APIs...');

      // Test users API
      const usersResponse = await fetch('/api/admin/users');
      console.log('Users response:', usersResponse.status, usersResponse.ok);
      
      if (usersResponse.ok) {
        const usersData = await usersResponse.json();
        console.log('Users data:', usersData);
        setUsers(usersData.users || []);
      } else {
        const errorText = await usersResponse.text();
        console.error('Users error:', errorText);
        setError(`Users API failed: ${usersResponse.status}`);
      }

      // Test stats API
      const statsResponse = await fetch('/api/admin/stats');
      console.log('Stats response:', statsResponse.status, statsResponse.ok);
      
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        console.log('Stats data:', statsData);
        setStats(statsData.stats);
      } else {
        const errorText = await statsResponse.text();
        console.error('Stats error:', errorText);
      }

    } catch (error) {
      console.error('Load error:', error);
      setError(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading admin data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin API Test</h1>
        
        <button
          onClick={loadData}
          className="mb-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Reload Data
        </button>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Stats */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Stats</h2>
            {stats ? (
              <div className="space-y-2">
                <p>Total Users: {stats.totalUsers}</p>
                <p>Active Users: {stats.activeUsers}</p>
                <p>Total Teams: {stats.totalTeams}</p>
                <p>Total Events: {stats.totalEvents}</p>
              </div>
            ) : (
              <p className="text-gray-500">No stats loaded</p>
            )}
          </div>

          {/* Users */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Users ({users.length})</h2>
            {users.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {users.map((user: any) => (
                  <div key={user.id} className="p-2 bg-gray-50 rounded">
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No users loaded</p>
            )}
          </div>
        </div>

        {/* Raw Data */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Raw Data (Console)</h2>
          <p className="text-sm text-gray-600">Check browser console for detailed API responses</p>
        </div>
      </div>
    </div>
  );
}