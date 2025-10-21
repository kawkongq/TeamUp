"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotification } from '../contexts/NotificationContext';

export default function AdminSetupPage() {
  const router = useRouter();
  const { showSuccess } = useNotification();
  const [loading, setLoading] = useState(false);

  const handleMakeAdmin = () => {
    setLoading(true);
    
    // Set admin role in localStorage
    localStorage.setItem('userRole', 'admin');
    localStorage.setItem('userId', '1'); // Make sure user ID is '1' for admin check
    
    setTimeout(() => {
      showSuccess('Admin Access Granted', 'You now have admin privileges!');
      router.push('/admin');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Admin Setup</h1>
          <p className="text-gray-600 mb-8">
            This is a demo setup to grant admin privileges. In a real application, admin access would be managed through proper authentication and authorization.
          </p>
          
          <button
            onClick={handleMakeAdmin}
            disabled={loading}
            className="w-full px-6 py-4 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl font-semibold text-lg hover:from-orange-600 hover:to-red-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Setting up admin access...</span>
              </div>
            ) : (
              '🛡️ Grant Admin Access'
            )}
          </button>
          
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
            <p className="text-yellow-800 text-sm">
              <strong>Demo Note:</strong> This will give you full admin privileges to manage users, teams, and events.
            </p>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="mt-4 text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}