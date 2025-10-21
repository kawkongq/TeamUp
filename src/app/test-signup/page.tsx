"use client";

import { useState } from 'react';

export default function TestSignupPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testSignup = async () => {
    setLoading(true);
    setResult(null);

    const testData = {
      name: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      role: 'user'
    };

    try {
      console.log('📤 Sending signup request:', testData);
      
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
      });

      const data = await response.json();
      
      console.log('📥 Response:', data);

      setResult({
        status: response.status,
        success: response.ok,
        data: data,
        testData: testData
      });

    } catch (error) {
      console.error('❌ Error:', error);
      setResult({
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">🧪 Test Signup API</h1>

        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Signup</h2>
          <p className="text-gray-600 mb-6">
            This will create a new user with random email and check if it's saved to database.
          </p>

          <button
            onClick={testSignup}
            disabled={loading}
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Testing...</span>
              </div>
            ) : (
              '🚀 Test Signup API'
            )}
          </button>
        </div>

        {result && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4">
              {result.success ? '✅ Success' : '❌ Failed'}
            </h3>

            <div className="space-y-4">
              {result.testData && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-blue-900 mb-2">Test Data Sent:</h4>
                  <pre className="text-sm text-blue-800 overflow-x-auto">
                    {JSON.stringify(result.testData, null, 2)}
                  </pre>
                </div>
              )}

              <div className={`border rounded-xl p-4 ${
                result.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-900' : 'text-red-900'
                }`}>
                  Response (Status: {result.status}):
                </h4>
                <pre className={`text-sm overflow-x-auto ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>

              {result.success && result.data.user && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                  <h4 className="font-semibold text-purple-900 mb-2">✅ User Created:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li><strong>ID:</strong> {result.data.user.id}</li>
                    <li><strong>Email:</strong> {result.data.user.email}</li>
                    <li><strong>Name:</strong> {result.data.user.name}</li>
                    <li><strong>Role:</strong> {result.data.user.role}</li>
                  </ul>
                  <p className="mt-4 text-sm text-purple-700">
                    ✅ Check MongoDB Atlas to verify this user exists in the database!
                  </p>
                </div>
              )}

              {result.error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-900 mb-2">Error:</h4>
                  <p className="text-sm text-red-800">{result.error}</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="font-semibold text-yellow-900 mb-2">📝 Instructions:</h3>
          <ol className="text-sm text-yellow-800 space-y-2 list-decimal list-inside">
            <li>Click the "Test Signup API" button above</li>
            <li>Check the response to see if user was created</li>
            <li>Go to MongoDB Atlas and verify the user exists in <code className="bg-yellow-100 px-1 rounded">teamup.users</code> collection</li>
            <li>Check the server logs for detailed information</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
