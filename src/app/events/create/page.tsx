"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { canCreateEvents, getRoleDescription } from '@/lib/auth-utils';
import EventImageUpload from '@/app/components/EventImageUpload';

export default function CreateEventPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'hackathon',
    category: '',
    tags: '',
    startDate: '',
    endDate: '',
    location: '',
    imageUrl: '',
    maxParticipants: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    checkUserAccess();
  }, []);

  const checkUserAccess = async () => {
    try {
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          
          // Check if user has permission to create events
          if (!canCreateEvents(data.user)) {
            router.push('/events');
            return;
          }
          
          setLoading(false);
        } else {
          router.push('/signin');
        }
      } else {
        router.push('/signin');
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push('/signin');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) newErrors.name = 'Event name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (!formData.maxParticipants) newErrors.maxParticipants = 'Max participants is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSubmitting(true);
    setErrors({});
    
    try {
      const requestData = {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        category: formData.category,
        tags: formData.tags,
        startDate: formData.startDate,
        endDate: formData.endDate,
        location: formData.location,
        imageUrl: formData.imageUrl,
        maxTeams: parseInt(formData.maxParticipants)
      };
      
      console.log('Creating event with data:', requestData);
      
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log('API response:', { status: response.status, data });

      if (response.ok) {
        // Show success message briefly before redirecting
        setSuccessMessage('Event created successfully! Redirecting...');
        setTimeout(() => {
          router.push('/events');
        }, 2000);
      } else {
        if (response.status === 403) {
          setErrors({ general: 'Access denied. Only organizers and admins can create events.' });
        } else if (response.status === 401) {
          setErrors({ general: 'Authentication required. Please sign in again.' });
        } else {
          setErrors({ general: data.error || 'Failed to create event. Please try again.' });
        }
      }
    } catch (error) {
      console.error('Error creating event:', error);
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-gradient-to-br from-pink-200/20 to-red-200/20 rounded-full blur-2xl animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-gradient-to-br from-cyan-200/20 to-blue-200/20 rounded-full blur-2xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="pt-20 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Create New Event</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {currentUser?.role === 'admin' 
              ? '🔓 Admin: Create and manage events with full access'
              : '🎯 Organizer: Create amazing events for your community'
            }
          </p>
        </div>

        {/* Create Event Form */}
        <div className="max-w-2xl mx-auto">
          <div className="glass-card rounded-2xl p-8 shadow-xl border border-white/20 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Event Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                  Event Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:border-indigo-500'
                  }`}
                  placeholder="Enter event name"
                />
                {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Event Type and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="type" className="block text-sm font-semibold text-gray-700 mb-3">
                    Event Type
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-indigo-300"
                  >
                    <option value="hackathon">Hackathon</option>
                    <option value="conference">Conference</option>
                    <option value="meetup">Meetup</option>
                    <option value="workshop">Workshop</option>
                    <option value="startup">Startup Event</option>
                    <option value="competition">Competition</option>
                    <option value="networking">Networking</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-3">
                    Category
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-indigo-300"
                  >
                    <option value="">Select Category</option>
                    <option value="technology">Technology</option>
                    <option value="business">Business</option>
                    <option value="design">Design</option>
                    <option value="marketing">Marketing</option>
                    <option value="education">Education</option>
                    <option value="healthcare">Healthcare</option>
                    <option value="finance">Finance</option>
                    <option value="gaming">Gaming</option>
                    <option value="social-impact">Social Impact</option>
                    <option value="sustainability">Sustainability</option>
                  </select>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-3">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-indigo-300 focus:border-indigo-500"
                  placeholder="React, Node.js, AI/ML, Mobile Development"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Add relevant tags to help participants find your event. Separate multiple tags with commas.
                </p>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-3">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                    errors.description ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:border-indigo-500'
                  }`}
                  placeholder="Describe your event..."
                />
                {errors.description && <p className="mt-2 text-sm text-red-600">{errors.description}</p>}
              </div>

              {/* Event Image */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Event Image (Optional)
                </label>
                <EventImageUpload
                  currentImage={formData.imageUrl}
                  onImageUpload={(imageUrl) => setFormData(prev => ({ ...prev, imageUrl }))}
                />
                <p className="mt-2 text-sm text-gray-500">
                  Upload an image to make your event more attractive. Recommended size: 800x400px
                </p>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-3">
                    Start Date
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.startDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:border-indigo-500'
                    }`}
                  />
                  {errors.startDate && <p className="mt-2 text-sm text-red-600">{errors.startDate}</p>}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-3">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.endDate ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:border-indigo-500'
                    }`}
                  />
                  {errors.endDate && <p className="mt-2 text-sm text-red-600">{errors.endDate}</p>}
                </div>
              </div>

              {/* Location and Max Participants */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="location" className="block text-sm font-semibold text-gray-700 mb-3">
                    Location
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.location ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:border-indigo-500'
                    }`}
                    placeholder="Event location"
                  />
                  {errors.location && <p className="mt-2 text-sm text-red-600">{errors.location}</p>}
                </div>

                <div>
                  <label htmlFor="maxParticipants" className="block text-sm font-semibold text-gray-700 mb-3">
                    Max Participants
                  </label>
                  <input
                    type="number"
                    id="maxParticipants"
                    name="maxParticipants"
                    value={formData.maxParticipants}
                    onChange={handleInputChange}
                    min="1"
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 ${
                      errors.maxParticipants ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:border-indigo-500'
                    }`}
                    placeholder="100"
                  />
                  {errors.maxParticipants && <p className="mt-2 text-sm text-red-600">{errors.maxParticipants}</p>}
                </div>
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="tags" className="block text-sm font-semibold text-gray-700 mb-3">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 hover:border-indigo-300 focus:border-indigo-500"
                  placeholder="Web Development, AI/ML, Mobile Apps"
                />
              </div>

              {/* Success Message */}
              {successMessage && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <p className="text-sm font-medium text-green-600">{successMessage}</p>
                  </div>
                </div>
              )}

              {/* General Error Display */}
              {errors.general && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                  <div className="flex items-center space-x-3">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12z" />
                    </svg>
                    <p className="text-sm font-medium text-red-600">{errors.general}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                >
                  {submitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Event...</span>
                    </div>
                  ) : (
                    'Create Event'
                  )}
                </button>
                
                <Link
                  href="/events"
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-200 transition-all duration-300 text-center"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
