"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ImageUpload from '../components/ImageUpload';
import { useNotification } from '../contexts/NotificationContext';
import Dropdown from '../components/Dropdown';
import { debugLog } from '@/lib/logger';

interface Skill {
  id: number;
  name: string;
  category: string;
}

interface Interest {
  id: number;
  name: string;
  category: string;
}

interface Profile {
  id: string;
  displayName: string;
  bio: string;
  role: string;
  avatar: string | null;
  location: string | null;
  experience: string | null;
  hourlyRate: number | null;
  availability: string | null;
  timezone: string;
  links: any;
  rating: number;
  projectsCompleted: number;
  isAvailable: boolean;
  skills: Array<{ skillId: number; level: number; yearsOfExperience: number }>;
  interests: Array<{ interestId: number; level: number }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [availableSkills, setAvailableSkills] = useState<Skill[]>([]);
  const [availableInterests, setAvailableInterests] = useState<Interest[]>([]);
  const [formData, setFormData] = useState({
    displayName: '',
    bio: '',
    role: '',
    location: '',
    experience: '',
    availability: '',
    timezone: 'UTC',
    github: '',
    linkedin: '',
    portfolio: '',
    isAvailable: true
  });
  const [selectedSkills, setSelectedSkills] = useState<Array<{ skillId: number }>>([]);
  const [selectedInterests, setSelectedInterests] = useState<Array<{ interestId: number }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [skillSearch, setSkillSearch] = useState('');
  const [interestSearch, setInterestSearch] = useState('');
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchSkillsAndInterests();
  }, []);

  const fetchProfile = async () => {
    try {
      // Check authentication via API
      const authResponse = await fetch('/api/auth/check', {
        credentials: 'include'
      });

      if (!authResponse.ok) {
        router.push('/signin');
        return;
      }

      const authData = await authResponse.json();
      
      if (!authData.authenticated || !authData.user) {
        router.push('/signin');
        return;
      }

      const userId = authData.user.id;
      const response = await fetch(`/api/profile?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data.profile);

        // Populate form data
        setFormData({
          displayName: data.profile.displayName || '',
          bio: data.profile.bio || '',
          role: data.profile.role || '',
          location: data.profile.location || '',
          experience: data.profile.experience || '',
          availability: data.profile.availability || '',
          timezone: data.profile.timezone || 'UTC',
          github: data.profile.links?.github || '',
          linkedin: data.profile.links?.linkedin || '',
          portfolio: data.profile.links?.portfolio || '',
          isAvailable: data.profile.isAvailable
        });

        // Set selected skills and interests
        if (data.profile.skills) {
          setSelectedSkills(data.profile.skills);
        }
        if (data.profile.interests) {
          setSelectedInterests(data.profile.interests);
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSkillsAndInterests = async () => {
    try {
      // Fetch available skills
      const skillsResponse = await fetch('/api/skills');
      if (skillsResponse.ok) {
        const skillsData = await skillsResponse.json();
        setAvailableSkills(skillsData.skills);
      }

      // Fetch available interests
      const interestsResponse = await fetch('/api/interests');
      if (interestsResponse.ok) {
        const interestsData = await interestsResponse.json();
        setAvailableInterests(interestsData.interests);
      }
    } catch (error) {
      console.error('Error fetching skills and interests:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSkillChange = (skillId: number) => {
    setSelectedSkills(prev => {
      const existing = prev.find(s => s.skillId === skillId);
      if (existing) {
        return prev.filter(s => s.skillId !== skillId);
      } else {
        return [...prev, { skillId }];
      }
    });
  };

  const handleInterestChange = (interestId: number) => {
    setSelectedInterests(prev => {
      const existing = prev.find(i => i.interestId === interestId);
      if (existing) {
        return prev.filter(i => i.interestId !== interestId);
      } else {
        return [...prev, { interestId }];
      }
    });
  };

  const removeSkill = (skillId: number) => {
    setSelectedSkills(prev => prev.filter(s => s.skillId !== skillId));
  };

  const removeInterest = (interestId: number) => {
    setSelectedInterests(prev => prev.filter(i => i.interestId !== interestId));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) newErrors.displayName = 'Display name is required';
    if (formData.bio && formData.bio.length > 500) newErrors.bio = 'Bio must be less than 500 characters';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSaving(true);
    setErrors({});

    try {
      // Check authentication via API
      const authResponse = await fetch('/api/auth/check', {
        credentials: 'include'
      });

      if (!authResponse.ok) {
        router.push('/signin');
        return;
      }

      const authData = await authResponse.json();
      
      if (!authData.authenticated || !authData.user) {
        router.push('/signin');
        return;
      }

      const userId = authData.user.id;

      const profileData = {
        userId,
        ...formData,
        avatar: profile?.avatar, // Include the current avatar URL
        links: {
          github: formData.github,
          linkedin: formData.linkedin,
          portfolio: formData.portfolio
        },
        skills: selectedSkills,
        interests: selectedInterests
      };

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        showSuccess('Profile Updated!', 'Your profile has been updated successfully.');
      } else {
        const errorData = await response.json();
        showError('Update Failed', errorData.error || 'Failed to update profile');
        setErrors({ general: errorData.error || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showError('Network Error', 'Please check your connection and try again.');
      setErrors({ general: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      const response = await fetch('/api/auth/signout', {
        method: 'POST',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to sign out');
      }

      localStorage.removeItem('userEmail');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      router.refresh();
      window.location.href = '/';
    } catch (error) {
      console.error('Sign out error:', error);
      showError('Sign out failed', 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const handlePhotoUpload = async (imageUrl: string) => {
    try {
      // Update local profile state with new avatar URL
      setProfile(prev => prev ? { ...prev, avatar: imageUrl } : null);

      // Also update the profile in the database immediately
      // Check authentication via API
      const authResponse = await fetch('/api/auth/check', {
        credentials: 'include'
      });

      if (authResponse.ok) {
        const authData = await authResponse.json();
        
        if (authData.authenticated && authData.user) {
          const userId = authData.user.id;
        const profileUpdateData = {
          userId,
          avatar: imageUrl,
          displayName: formData.displayName,
          bio: formData.bio,
          role: formData.role,
          location: formData.location,
          experience: formData.experience,
          availability: formData.availability,
          timezone: formData.timezone,
          links: {
            github: formData.github,
            linkedin: formData.linkedin,
            portfolio: formData.portfolio
          },
          isAvailable: formData.isAvailable,
          skills: selectedSkills,
          interests: selectedInterests
        };

        debugLog('Updating profile with avatar:', profileUpdateData);

        const updateResponse = await fetch('/api/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(profileUpdateData),
        });

        if (updateResponse.ok) {
          showSuccess('Photo Updated!', 'Your profile photo has been uploaded successfully.');
        } else {
          showError('Upload Error', 'Photo uploaded but failed to update profile');
          setErrors({ general: 'Photo uploaded but failed to update profile' });
        }
        }
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      showError('Upload Error', 'Failed to upload photo. Please check your connection.');
      setErrors({ general: 'Failed to upload photo' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Enhanced Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full mb-8 shadow-2xl">
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
            Edit Profile
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Customize your profile to showcase your skills, experience, and personality to potential collaborators
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-10">
          <Link
            href="/subscription"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-white text-lg font-semibold shadow-lg transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
          >
            <span className="text-base">Upgrade to Premium</span>
            <span className="rounded-full bg-white/20 px-3 py-1 text-sm font-bold">49฿</span>
          </Link>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-2xl border-2 border-red-200 px-6 py-3 text-red-600 font-semibold bg-white shadow-sm transition-all duration-200 hover:border-red-300 hover:shadow-md disabled:opacity-60"
          >
            {signingOut ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin"></span>
                Signing out...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </>
            )}
          </button>
        </div>



        {/* General Error Display */}
        {errors.general && (
          <div className="mb-10 p-8 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-3xl shadow-lg">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div>
                <p className="text-xl font-bold text-red-800">Update Failed</p>
                <p className="text-red-600 text-lg">{errors.general}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Enhanced Basic Information */}
          <div className="glass-card rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Basic Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Display Name */}
              <div className="space-y-3">
                <label htmlFor="displayName" className="block text-lg font-bold text-gray-700 mb-4">
                  Display Name *
                </label>
                <input
                  type="text"
                  id="displayName"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  className={`w-full px-8 py-5 border-2 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-xl ${errors.displayName ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:bg-white'
                    }`}
                  placeholder="Enter your display name"
                />
                {errors.displayName && <p className="text-sm text-red-600 font-semibold">{errors.displayName}</p>}
              </div>

              {/* Role */}
              <div className="space-y-3">
                <Dropdown
                  label="Professional Role"
                  options={[
                    { value: "", label: "Select your role" },
                    { value: "developer", label: "Developer" },
                    { value: "designer", label: "Designer" },
                    { value: "product-manager", label: "Product Manager" },
                    { value: "data-scientist", label: "Data Scientist" },
                    { value: "other", label: "Other" }
                  ]}
                  value={formData.role}
                  onChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
                  placeholder="Select your role"
                />
              </div>

              {/* Location */}
              <div className="space-y-3">
                <label htmlFor="location" className="block text-lg font-bold text-gray-700 mb-4">
                  Location
                </label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full px-8 py-5 border-2 border-gray-200 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-xl hover:border-indigo-300 focus:bg-white"
                  placeholder="City, Country"
                />
              </div>

              {/* Experience */}
              <div className="space-y-3">
                <Dropdown
                  label="Experience Level"
                  options={[
                    { value: "", label: "Select experience level" },
                    { value: "beginner", label: "Beginner (0-2 years)" },
                    { value: "intermediate", label: "Intermediate (2-5 years)" },
                    { value: "advanced", label: "Advanced (5-10 years)" },
                    { value: "expert", label: "Expert (10+ years)" }
                  ]}
                  value={formData.experience}
                  onChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}
                  placeholder="Select experience level"
                />
              </div>

              {/* Availability */}
              <div className="space-y-3">
                <Dropdown
                  label="Availability"
                  options={[
                    { value: "", label: "Select availability" },
                    { value: "full-time", label: "Full Time" },
                    { value: "part-time", label: "Part Time" },
                    { value: "freelance", label: "Freelance" },
                    { value: "contract", label: "Contract" },
                    { value: "not-available", label: "Not Available" }
                  ]}
                  value={formData.availability}
                  onChange={(value) => setFormData(prev => ({ ...prev, availability: value }))}
                  placeholder="Select availability"
                />
              </div>
            </div>

            {/* Enhanced Bio */}
            <div className="mt-10 space-y-4">
              <label htmlFor="bio" className="block text-lg font-bold text-gray-700">
                Bio
              </label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={6}
                className={`w-full px-8 py-6 border-2 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-xl resize-none ${errors.bio ? 'border-red-300 bg-red-50' : 'border-gray-200 hover:border-indigo-300 focus:bg-white'
                  }`}
                placeholder="Tell us about yourself, your experience, and what you're looking for..."
              />
              <div className="flex justify-between items-center">
                {errors.bio && <p className="text-sm text-red-600 font-semibold">{errors.bio}</p>}
                <div className="ml-auto flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded-full ${formData.bio.length > 400 ? 'bg-red-400' : formData.bio.length > 300 ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                  <p className="text-lg text-gray-500 font-semibold">{formData.bio.length}/500</p>
                </div>
              </div>
            </div>

            {/* Enhanced Available for Work */}
            <div className="mt-10 p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl border border-indigo-100">
              <div className="flex items-center space-x-6">
                <input
                  id="isAvailable"
                  name="isAvailable"
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={handleInputChange}
                  className="w-6 h-6 text-indigo-600 focus:ring-indigo-500 border-2 border-gray-300 rounded-lg transition-colors"
                />
                <div>
                  <label htmlFor="isAvailable" className="text-2xl font-bold text-gray-900 cursor-pointer">
                    Available for work opportunities
                  </label>
                  <p className="text-gray-600 mt-2 text-lg">Let others know you're open to new projects and collaborations</p>
                </div>
              </div>
            </div>
          </div>

          {/* Photo Upload */}
          <div className="glass-card rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Profile Photo</h2>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center space-y-8 md:space-y-0 md:space-x-10">
              {/* Current Photo */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt="Profile"
                    className="w-40 h-40 rounded-full object-cover border-4 border-white shadow-xl"
                  />
                ) : (
                  <div className="w-40 h-40 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-4xl shadow-xl">
                    {formData.displayName?.charAt(0) || 'U'}
                  </div>
                )}
              </div>

              {/* Upload Component and Info */}
              <div className="flex-1 w-full">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Upload New Photo</h3>
                    <p className="text-lg text-gray-600 mb-6">
                      Choose a professional photo that represents you well. This will be visible to other users.
                    </p>
                  </div>

                  <ImageUpload onImageUpload={handlePhotoUpload} />

                  <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6">
                    <div className="flex items-start space-x-3">
                      <svg className="w-6 h-6 text-blue-600 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-blue-800 font-semibold text-lg">Photo Guidelines</p>
                        <ul className="text-blue-700 mt-2 space-y-1 text-base">
                          <li>• Supported formats: JPG, PNG</li>
                          <li>• Maximum file size: 5MB</li>
                          <li>• Recommended: Square aspect ratio</li>
                          <li>• Use a clear, professional headshot</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skills */}
          <div className="glass-card rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Skills</h2>
            </div>

            {/* Selected Skills Display */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Selected Skills</h3>
              {selectedSkills.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selectedSkills.map((selectedSkill) => {
                    const skill = availableSkills.find(s => s.id === selectedSkill.skillId);
                    if (!skill) return null;

                    return (
                      <div key={selectedSkill.skillId} className="inline-flex items-center bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 rounded-full px-6 py-3 shadow-sm">
                        <span className="text-indigo-800 font-semibold text-lg mr-3">{skill.name}</span>
                        <button
                          type="button"
                          onClick={() => removeSkill(selectedSkill.skillId)}
                          className="text-indigo-600 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No skills selected yet</p>
                  <p className="text-gray-400 text-sm mt-1">Search and add skills below</p>
                </div>
              )}
            </div>

            {/* Add Skills Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Add Skills</h3>

              {/* Skill Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search skills to add..."
                  value={skillSearch}
                  onChange={(e) => setSkillSearch(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 text-lg hover:border-indigo-300 focus:bg-white"
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {availableSkills
                  .filter(skill =>
                    !selectedSkills.some(s => s.skillId === skill.id) &&
                    (skill.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
                      skill.category.toLowerCase().includes(skillSearch.toLowerCase()))
                  )
                  .map((skill) => (
                    <div key={skill.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{skill.name}</p>
                          <p className="text-sm text-gray-500">{skill.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSkillChange(skill.id)}
                          className="w-full px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors font-semibold text-sm"
                        >
                          Add Skill
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="glass-card rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Interests</h2>
            </div>

            {/* Selected Interests Display */}
            <div className="mb-10">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Your Selected Interests</h3>
              {selectedInterests.length > 0 ? (
                <div className="flex flex-wrap gap-3">
                  {selectedInterests.map((selectedInterest) => {
                    const interest = availableInterests.find(i => i.id === selectedInterest.interestId);
                    if (!interest) return null;

                    return (
                      <div key={selectedInterest.interestId} className="inline-flex items-center bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-full px-6 py-3 shadow-sm">
                        <span className="text-green-800 font-semibold text-lg mr-3">{interest.name}</span>
                        <button
                          type="button"
                          onClick={() => removeInterest(selectedInterest.interestId)}
                          className="text-green-600 hover:text-red-600 transition-colors"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 text-lg">No interests selected yet</p>
                  <p className="text-gray-400 text-sm mt-1">Search and add interests below</p>
                </div>
              )}
            </div>

            {/* Add Interests Section */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-900">Add Interests</h3>

              {/* Interest Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search interests to add..."
                  value={interestSearch}
                  onChange={(e) => setInterestSearch(e.target.value)}
                  className="w-full px-6 py-4 border-2 border-gray-200 rounded-2xl transition-all duration-300 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 text-lg hover:border-green-300 focus:bg-white"
                />
                <svg className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
                {availableInterests
                  .filter(interest =>
                    !selectedInterests.some(i => i.interestId === interest.id) &&
                    (interest.name.toLowerCase().includes(interestSearch.toLowerCase()) ||
                      interest.category.toLowerCase().includes(interestSearch.toLowerCase()))
                  )
                  .map((interest) => (
                    <div key={interest.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex flex-col space-y-3">
                        <div>
                          <p className="font-semibold text-gray-900 text-lg">{interest.name}</p>
                          <p className="text-sm text-gray-500">{interest.category}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleInterestChange(interest.id)}
                          className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-semibold text-sm"
                        >
                          Add Interest
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Social Links & Additional Info */}
          <div className="glass-card rounded-3xl p-10 shadow-2xl border border-white/30">
            <div className="flex items-center space-x-4 mb-10">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <h2 className="text-4xl font-bold text-gray-900">Social Links & Settings</h2>
            </div>

            <div className="space-y-10">
              {/* Social Links */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Social Profiles</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {/* GitHub */}
                  <div className="space-y-3">
                    <label htmlFor="github" className="flex items-center space-x-2 text-lg font-bold text-gray-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
                      </svg>
                      <span>GitHub Profile</span>
                    </label>
                    <input
                      type="url"
                      id="github"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg hover:border-blue-300 focus:bg-white"
                      placeholder="https://github.com/username"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-3">
                    <label htmlFor="linkedin" className="flex items-center space-x-2 text-lg font-bold text-gray-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 11-.003-3.096 1.548 1.548 0 01.003 3.096zm-1.337 9.763H6.34v-8.59H3.667v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" clipRule="evenodd" />
                      </svg>
                      <span>LinkedIn Profile</span>
                    </label>
                    <input
                      type="url"
                      id="linkedin"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg hover:border-blue-300 focus:bg-white"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  {/* Portfolio */}
                  <div className="space-y-3">
                    <label htmlFor="portfolio" className="flex items-center space-x-2 text-lg font-bold text-gray-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9a9 9 0 00-9 9m0 0a9 9 0 019-9" />
                      </svg>
                      <span>Portfolio Website</span>
                    </label>
                    <input
                      type="url"
                      id="portfolio"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleInputChange}
                      className="w-full px-6 py-4 border-2 border-gray-200 rounded-xl transition-all duration-300 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 text-lg hover:border-blue-300 focus:bg-white"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>

              {/* Timezone Setting */}
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Timezone</h3>
                <div className="max-w-md">
                  <Dropdown
                    label="Your Timezone"
                    options={[
                      { value: "UTC", label: "UTC (Coordinated Universal Time)" },
                      { value: "America/New_York", label: "Eastern Time (ET)" },
                      { value: "America/Chicago", label: "Central Time (CT)" },
                      { value: "America/Denver", label: "Mountain Time (MT)" },
                      { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
                      { value: "Europe/London", label: "London (GMT)" },
                      { value: "Europe/Paris", label: "Paris (CET)" },
                      { value: "Europe/Berlin", label: "Berlin (CET)" },
                      { value: "Asia/Tokyo", label: "Tokyo (JST)" },
                      { value: "Asia/Shanghai", label: "Shanghai (CST)" },
                      { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
                      { value: "Asia/Kolkata", label: "India (IST)" },
                      { value: "Australia/Sydney", label: "Sydney (AEDT)" }
                    ]}
                    value={formData.timezone}
                    onChange={(value) => setFormData(prev => ({ ...prev, timezone: value }))}
                    placeholder="Select your timezone"
                  />
                  <p className="text-sm text-gray-500 mt-2">
                    This helps others know when you're typically available for collaboration
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="text-center">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary px-12 py-6 text-2xl font-bold disabled:opacity-50 disabled:cursor-not-allowed rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            >
              {saving ? (
                <div className="flex items-center justify-center space-x-4">
                  <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Saving Profile...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Save Profile</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
