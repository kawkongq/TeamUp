"use client";

import { useState, useEffect } from "react";

interface Event {
  id: string;
  name: string;
  description?: string;
  type: string;
  startDate: string;
  endDate: string;
  location?: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  profile?: {
    displayName: string;
    avatar: string;
    role: string;
  };
}

interface CreateTeamFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateTeamForm({ onClose, onSuccess }: CreateTeamFormProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    eventId: "",
    maxMembers: 4,
    lookingFor: [] as string[],
    tags: [] as string[]
  });

  const [selectedLookingFor, setSelectedLookingFor] = useState("");
  const [selectedTag, setSelectedTag] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  useEffect(() => {
    fetchCurrentUser();
    fetchEvents();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      setIsLoadingUser(true);
      const response = await fetch('/api/auth/check');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setError("You must be logged in to create a team");
        }
      } else {
        setError("Failed to verify authentication");
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
      setError("Failed to verify authentication");
    } finally {
      setIsLoadingUser(false);
    }
  };

  const fetchEvents = async () => {
    try {
      setIsLoadingEvents(true);
      const response = await fetch('/api/events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.events || []);
      } else {
        console.error('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if user is authenticated
    if (!currentUser) {
      setError("You must be logged in to create a team");
      return;
    }

    // Validate required fields
    if (!formData.name.trim()) {
      setError("Please enter a team name");
      return;
    }

    if (!formData.description.trim()) {
      setError("Please enter a team description");
      return;
    }

    if (!formData.eventId) {
      setError("Please select an event for your team");
      return;
    }

    if (formData.lookingFor.length === 0) {
      setError("Please add at least one role you're looking for");
      return;
    }
    
    setIsSubmitting(true);
    setError("");

    try {
      // Prepare the team data with ownerId
      const teamData = {
        ...formData,
        ownerId: currentUser.id,
        tags: formData.tags.join(', '),
        lookingFor: formData.lookingFor.join(', ')
      };

      console.log('Submitting team data:', teamData);
      console.log('Current user:', currentUser);

      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(teamData),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Team creation failed:', errorData);
        throw new Error(errorData.error || "Failed to create team");
      }

      const result = await response.json();
      console.log('Team created successfully:', result);
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error creating team:', err);
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLookingFor = () => {
    if (selectedLookingFor && !formData.lookingFor.includes(selectedLookingFor)) {
      setFormData(prev => ({
        ...prev,
        lookingFor: [...prev.lookingFor, selectedLookingFor]
      }));
      setSelectedLookingFor("");
    }
  };

  const removeLookingFor = (role: string) => {
    setFormData(prev => ({
      ...prev,
      lookingFor: prev.lookingFor.filter(r => r !== role)
    }));
  };

  const addTag = () => {
    if (selectedTag && !formData.tags.includes(selectedTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, selectedTag]
      }));
      setSelectedTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  // Show loading state while checking authentication
  if (isLoadingUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Show error if user is not authenticated
  if (!currentUser) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600 mb-4">You must be logged in to create a team.</p>
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Create New Team</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Creating team as: <span className="font-medium">{currentUser.name || currentUser.email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Team Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your team name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              required
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Describe your project and what you're building"
            />
          </div>

          {/* Event Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto border border-gray-200 rounded-xl p-3 bg-gray-50">
              {isLoadingEvents ? (
                <div className="col-span-full text-center py-8">
                  <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="mt-4 text-gray-600">Loading events...</p>
                </div>
              ) : events.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-gray-600">No events found. Please check back later.</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => setFormData(prev => ({ ...prev, eventId: event.id }))}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${
                      formData.eventId === event.id
                        ? 'border-indigo-500 bg-indigo-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm mb-1">{event.name}</h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full ${
                            event.type === 'hackathon' ? 'bg-yellow-100 text-yellow-800' :
                            event.type === 'case-competition' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {event.type === 'hackathon' && '🏆'}
                            {event.type === 'case-competition' && '📋'}
                            {event.type === 'innovation-challenge' && '💡'}
                            {event.type}
                          </span>
                          {event.location && (
                            <span className="flex items-center gap-1">
                              📍 {event.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {formData.eventId === event.id && (
                        <div className="ml-2">
                          <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            {formData.eventId && (
              <div className="mt-2 text-sm text-indigo-600">
                ✓ Selected: {events.find(e => e.id === formData.eventId)?.name}
              </div>
            )}
          </div>

          {/* Max Team Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Team Size *
            </label>
            <select
              required
              value={formData.maxMembers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxMembers: parseInt(e.target.value) }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value={2}>2 members</option>
              <option value={3}>3 members</option>
              <option value={4}>4 members</option>
              <option value={5}>5 members</option>
              <option value={6}>6 members</option>
            </select>
          </div>

          {/* Looking For */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Looking For *
            </label>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedLookingFor}
                onChange={(e) => setSelectedLookingFor(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a role</option>
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full-stack Developer">Full-stack Developer</option>
                <option value="UI/UX Designer">UI/UX Designer</option>
                <option value="Product Manager">Product Manager</option>
                <option value="Data Scientist">Data Scientist</option>
                <option value="DevOps Engineer">DevOps Engineer</option>
                <option value="Mobile Developer">Mobile Developer</option>
                <option value="QA Engineer">QA Engineer</option>
                <option value="Business Analyst">Business Analyst</option>
              </select>
              <button
                type="button"
                onClick={addLookingFor}
                className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.lookingFor.map((role) => (
                <span
                  key={role}
                  className="inline-flex items-center px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm"
                >
                  {role}
                  <button
                    type="button"
                    onClick={() => removeLookingFor(role)}
                    className="ml-2 text-indigo-600 hover:text-indigo-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Project Tags
            </label>
            <div className="flex gap-2 mb-3">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">Select a skill/tag</option>
                <option value="React">React</option>
                <option value="Next.js">Next.js</option>
                <option value="Node.js">Node.js</option>
                <option value="TypeScript">TypeScript</option>
                <option value="Python">Python</option>
                <option value="Machine Learning">Machine Learning</option>
                <option value="AI">AI</option>
                <option value="Web Development">Web Development</option>
                <option value="Mobile Development">Mobile Development</option>
                <option value="UI/UX">UI/UX</option>
                <option value="Database">Database</option>
                <option value="Cloud Computing">Cloud Computing</option>
                <option value="Cybersecurity">Cybersecurity</option>
                <option value="Blockchain">Blockchain</option>
                <option value="IoT">IoT</option>
                <option value="Fintech">Fintech</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Sustainability">Sustainability</option>
              </select>
              <button
                type="button"
                onClick={addTag}
                className="px-6 py-3 bg-gray-600 text-white rounded-xl hover:bg-gray-700 transition-colors"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-gray-600 hover:text-gray-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:border-gray-400 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Team"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
