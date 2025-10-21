"use client";

import { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';
import { ProfileSkeleton, CardSkeleton, TeamCardSkeleton } from '../components/SkeletonLoader';
import Button from '../components/Button';
import { useToast } from '../components/Toast';

export default function TestLoadingPage() {
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleTestToast = (type: 'success' | 'error' | 'warning' | 'info') => {
    const messages = {
      success: { title: 'Success!', message: 'Operation completed successfully' },
      error: { title: 'Error Occurred', message: 'Unable to complete operation' },
      warning: { title: 'Warning', message: 'Please check your information' },
      info: { title: 'Information', message: 'This is important information' }
    };
    
    showToast({
      type,
      ...messages[type]
    });
  };

  const handleTestLoading = async () => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 3000));
    setLoading(false);
    showToast({
      type: 'success',
      title: 'Completed!',
      message: 'Loading test finished'
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Loading States & Visual Feedback Demo
          </h1>
          <p className="text-xl text-gray-600">
            Test loading spinners, skeleton screens and toast notifications
          </p>
        </div>

        {/* Loading Spinners */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Loading Spinners</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              <div className="text-center">
                <LoadingSpinner size="sm" />
                <p className="mt-2 text-sm text-gray-600">Small</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="md" />
                <p className="mt-2 text-sm text-gray-600">Medium</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="lg" />
                <p className="mt-2 text-sm text-gray-600">Large</p>
              </div>
              <div className="text-center">
                <LoadingSpinner size="xl" />
                <p className="mt-2 text-sm text-gray-600">Extra Large</p>
              </div>
            </div>
            
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-600 rounded-lg p-4 text-center">
                <LoadingSpinner color="white" />
                <p className="mt-2 text-sm text-white">White on Dark</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4 text-center">
                <LoadingSpinner color="primary" />
                <p className="mt-2 text-sm text-gray-600">Primary Color</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <LoadingSpinner color="gray" />
                <p className="mt-2 text-sm text-gray-600">Gray</p>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Screens */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Skeleton Screens</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Profile Skeleton</h3>
              </div>
              <ProfileSkeleton />
            </div>
            
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Card Skeleton</h3>
              </div>
              <div className="p-4">
                <CardSkeleton />
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg">
              <div className="p-4 border-b">
                <h3 className="font-semibold text-gray-900">Team Card Skeleton</h3>
              </div>
              <div className="p-4">
                <TeamCardSkeleton />
              </div>
            </div>
          </div>
        </section>

        {/* Button States */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Button States</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button variant="primary">Normal Button</Button>
              <Button variant="primary" loading>Loading Button</Button>
              <Button variant="primary" disabled>Disabled Button</Button>
              
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              
              <Button variant="danger">Danger</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="lg">Large</Button>
            </div>
            
            <div className="mt-6">
              <Button
                variant="primary"
                loading={loading}
                loadingText="Testing..."
                onClick={handleTestLoading}
                fullWidth
              >
                Test Loading (3 seconds)
              </Button>
            </div>
          </div>
        </section>

        {/* Toast Notifications */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Toast Notifications</h2>
          <div className="bg-white rounded-xl p-8 shadow-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="primary"
                onClick={() => handleTestToast('success')}
              >
                Success Toast
              </Button>
              <Button
                variant="danger"
                onClick={() => handleTestToast('error')}
              >
                Error Toast
              </Button>
              <Button
                variant="secondary"
                onClick={() => handleTestToast('warning')}
              >
                Warning Toast
              </Button>
              <Button
                variant="outline"
                onClick={() => handleTestToast('info')}
              >
                Info Toast
              </Button>
            </div>
          </div>
        </section>

        {/* Back to Home */}
        <div className="text-center">
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Back to Previous Page
          </Button>
        </div>
      </div>
    </div>
  );
}