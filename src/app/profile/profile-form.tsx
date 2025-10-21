"use client";

import { useState, useEffect } from "react";
import ImageUpload from "../components/ImageUpload";

interface Profile {
  id: string;
  displayName: string;
  bio: string;
  role: string;
  avatar: string;
  location: string;
  experience: string;
  hourlyRate: number;
  availability: string;
  timezone: string;
  links: {
    github?: string;
    linkedin?: string;
    portfolio?: string;
  };
}

export default function ProfileForm() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [formData, setFormData] = useState({
    displayName: "",
    bio: "",
    role: "",
    location: "",
    experience: "",
    hourlyRate: 0,
    availability: "",
    timezone: "",
    github: "",
    linkedin: "",
    portfolio: "",
    skills: [] as string[],
    interests: [] as string[]
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile', {
        method: 'GET',
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Profile data received:', data);
        
        // Extract profile data from the nested structure
        const profileData = data.profile || data;
        console.log('Extracted profile data:', profileData);
        
        setProfile(profileData);
        setFormData({
          displayName: profileData.displayName || "",
          bio: profileData.bio || "",
          role: profileData.role || "",
          location: profileData.location || "",
          experience: profileData.experience || "",
          hourlyRate: profileData.hourlyRate || 0,
          availability: profileData.availability || "",
          timezone: profileData.timezone || "",
          github: profileData.links?.github || "",
          linkedin: profileData.links?.linkedin || "",
          portfolio: profileData.links?.portfolio || "",
          skills: profileData.skills?.map((skill: any) => skill.name) || [],
          interests: profileData.interests?.map((interest: any) => interest.name) || []
        });
      } else {
        console.error('Failed to fetch profile:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          skills: formData.skills,
          interests: formData.interests,
          links: {
            github: formData.github,
            linkedin: formData.linkedin,
            portfolio: formData.portfolio
          }
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        fetchProfile();
      } else {
        setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'hourlyRate' ? parseFloat(value) || 0 : value
    }));
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="relative">
          <div className="w-20 h-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse-glow shadow-xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="absolute -inset-3 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl blur opacity-25 animate-pulse"></div>
        </div>
        <p className="text-xl text-gray-600 font-medium">Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-indigo-50/20 to-purple-50/30"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute top-40 right-20 w-24 h-24 bg-indigo-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      
      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Success/Error Messages */}
        {message && (
          <div className="max-w-4xl mx-auto mb-4 animate-fade-in-up">
            <div className={`flex items-center justify-center p-4 rounded-xl shadow-lg ${
              message.type === 'success' 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-4 ${
                message.type === 'success' ? 'bg-green-100' : 'bg-red-100'
              }`}>
                {message.type === 'success' ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <span className="text-base font-medium">{message.text}</span>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column - Profile Card */}
          <div className="col-span-4">
            <div className="card-hover p-6 sticky top-8">
              {/* Profile Header */}
              <div className="text-center mb-4">
                <div className="relative inline-block mb-3">
                  {profile?.avatar ? (
                    <img 
                      src={profile.avatar} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-3 border-white shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center border-3 border-white shadow-lg">
                      <span className="text-3xl font-black text-white">
                        {profile?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-white">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-1">
                  {profile?.displayName || 'Your Name'}
                </h2>
                <p className="text-base text-gray-600 mb-2">
                  {profile?.role || 'Professional Role'}
                </p>
                
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                  Available for work
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-base font-semibold text-gray-900 mb-3">Profile Photo</h3>
                <ImageUpload 
                  currentImage={profile?.avatar}
                  onImageUpload={async (imageUrl) => {
                    console.log('Image uploaded callback triggered with URL:', imageUrl);
                    console.log('Current profile state before update:', profile);
                    
                    // Update the profile state immediately
                    const newProfile = profile ? { ...profile, avatar: imageUrl } : null;
                    console.log('New profile state to set:', newProfile);
                    setProfile(newProfile);
                    
                    // Force a re-render by updating a dummy state
                    setFormData(prev => ({ ...prev }));
                    
                    // Test if the state was updated
                    setTimeout(() => {
                      console.log('Profile state after update (delayed):', profile);
                    }, 100);
                    
                    console.log('Profile state updated, now saving to database...');
                    
                    // Save the image URL to the database
                    try {
                      console.log('Saving image URL to database:', imageUrl);
                      const response = await fetch('/api/profile', {
                        method: 'PUT',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          ...formData,
                          avatar: imageUrl,
                          links: {
                            github: formData.github,
                            linkedin: formData.linkedin,
                            portfolio: formData.portfolio
                          }
                        }),
                      });

                      if (response.ok) {
                        console.log('Profile updated successfully in database');
                        setMessage({ type: 'success', text: 'Profile photo updated successfully!' });
                        
                        // Wait a bit before refreshing to ensure state is updated
                        setTimeout(() => {
                          console.log('Refreshing profile data...');
                          fetchProfile();
                        }, 500);
                      } else {
                        console.error('Failed to update profile in database:', response.status);
                        setMessage({ type: 'error', text: 'Failed to update profile photo. Please try again.' });
                      }
                    } catch (error) {
                      console.error('Error updating profile photo:', error);
                      setMessage({ type: 'error', text: 'An error occurred while updating profile photo.' });
                    }
                  }}
                />
              </div>

              {/* Skills & Interests Preview */}
              {(formData.skills.length > 0 || formData.interests.length > 0) && (
                <div className="border-t border-gray-200 pt-4">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">Skills & Interests</h3>
                  
                  {/* Skills Preview */}
                  {formData.skills.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-2">Top Skills:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="badge-primary"
                          >
                            {skill}
                          </span>
                        ))}
                        {formData.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                            +{formData.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Interests Preview */}
                  {formData.interests.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Interests:</p>
                      <div className="flex flex-wrap gap-2">
                        {formData.interests.slice(0, 3).map((interest) => (
                          <span
                            key={interest}
                            className="badge-secondary"
                          >
                            {interest}
                          </span>
                        ))}
                        {formData.interests.length > 3 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-sm font-medium rounded-full border border-gray-200">
                            +{formData.interests.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Form Fields */}
          <div className="col-span-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information Card */}
              <div className="card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Basic Information</h3>
                    <p className="text-sm text-gray-600">Your personal and professional details</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Display Name</label>
                    <input
                      type="text"
                      name="displayName"
                      value={formData.displayName}
                      onChange={handleInputChange}
                      placeholder="Enter your display name"
                      className="input-primary text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Professional Role</label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      placeholder="e.g., Frontend Developer"
                      className="input-primary text-base"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    rows={3}
                    placeholder="Tell us about yourself and your expertise..."
                    className="input-primary text-base resize-none"
                  />
                </div>
              </div>

              {/* Professional Details Card */}
              <div className="card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Professional Details</h3>
                    <p className="text-sm text-gray-600">Your work preferences and availability</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      placeholder="e.g., Bangkok, Thailand"
                      className="input-primary text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Experience Level</label>
                    <select
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      className="input-primary text-base"
                    >
                      <option value="">Select experience level</option>
                      <option value="Junior">🌱 Junior (0-2 years)</option>
                      <option value="Mid">🌿 Mid (2-5 years)</option>
                      <option value="Senior">🌳 Senior (5+ years)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Availability</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleInputChange}
                      className="input-primary text-base"
                    >
                      <option value="">Select availability</option>
                      <option value="Full-time">⏰ Full-time</option>
                      <option value="Part-time">⏱️ Part-time</option>
                      <option value="Freelance">🚀 Freelance</option>
                    </select>
                  </div>
                    
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Timezone</label>
                    <select
                      name="timezone"
                      value={formData.timezone}
                      onChange={handleInputChange}
                      className="input-primary text-base"
                    >
                      <option value="">Select timezone</option>
                      <option value="Asia/Bangkok">🌏 Asia/Bangkok</option>
                      <option value="Asia/Singapore">🌏 Asia/Singapore</option>
                      <option value="Asia/Tokyo">🗾 Asia/Tokyo</option>
                      <option value="Asia/Seoul">🇰🇷 Asia/Seoul</option>
                      <option value="Asia/Shanghai">🇨🇳 Asia/Shanghai</option>
                      <option value="Asia/Kolkata">🇮🇳 Asia/Kolkata</option>
                      <option value="Europe/London">🇬🇧 Europe/London</option>
                      <option value="Europe/Paris">🇫🇷 Europe/Paris</option>
                      <option value="America/New_York">🇺🇸 America/New_York</option>
                      <option value="America/Los_Angeles">🇺🇸 America/Los_Angeles</option>
                      <option value="UTC">🌍 UTC</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Hourly Rate (USD)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-lg font-bold text-gray-400">$</span>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="0"
                      min="0"
                      step="5"
                      className="input-primary pl-8 text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Skills and Interests Card */}
              <div className="card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Skills & Interests</h3>
                    <p className="text-sm text-gray-600">Showcase your expertise and passions</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Skills Section */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Top Skills</label>
                    <div className="space-y-3">
                      {/* Technical Skills */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          💻 Technical
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['React', 'Next.js', 'Node.js', 'TypeScript', 'Python', 'Machine Learning', 'Data Science', 'UI/UX Design'].map((skill) => (
                            <label key={skill} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.skills.includes(skill)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: [...prev.skills, skill]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: prev.skills.filter(s => s !== skill)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors duration-200">
                                {skill}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Business & Finance Skills */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          💰 Business & Finance
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Financial Modeling', 'Investment Analysis', 'Risk Management', 'Accounting', 'Market Research', 'Business Strategy'].map((skill) => (
                            <label key={skill} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.skills.includes(skill)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: [...prev.skills, skill]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: prev.skills.filter(s => s !== skill)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-green-600 transition-colors duration-200">
                                {skill}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Legal Skills */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          ⚖️ Legal
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Contract Law', 'Intellectual Property', 'Regulatory Compliance', 'Corporate Law'].map((skill) => (
                            <label key={skill} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.skills.includes(skill)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: [...prev.skills, skill]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: prev.skills.filter(s => s !== skill)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-blue-600 transition-colors duration-200">
                                {skill}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Data & Analytics */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          📊 Data & Analytics
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Statistical Analysis', 'Data Visualization', 'SQL', 'Tableau', 'Power BI'].map((skill) => (
                            <label key={skill} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.skills.includes(skill)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: [...prev.skills, skill]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      skills: prev.skills.filter(s => s !== skill)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors duration-200">
                                {skill}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selected Skills Display */}
                    {formData.skills.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Selected Skills:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.skills.map((skill) => (
                            <span
                              key={skill}
                              className="badge-primary"
                            >
                              {skill}
                              <button
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    skills: prev.skills.filter(s => s !== skill)
                                  }));
                                }}
                                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-200 transition-colors duration-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Interests Section */}
                  <div>
                    <label className="block text-base font-semibold text-gray-700 mb-4">Interests</label>
                    <div className="space-y-4">
                      {/* Technology & Innovation */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          🤖 Technology & Innovation
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['AI/ML', 'Web3', 'Fintech', 'Legal Tech', 'Biotech', 'Quantum Computing'].map((interest) => (
                            <label key={interest} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.interests.includes(interest)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: [...prev.interests, interest]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: prev.interests.filter(i => i !== interest)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors duration-200">
                                {interest}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Industries */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          🏢 Industries
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Healthcare', 'Education', 'Finance', 'Real Estate', 'E-commerce'].map((interest) => (
                            <label key={interest} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.interests.includes(interest)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: [...prev.interests, interest]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: prev.interests.filter(i => i !== interest)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-green-600 transition-colors duration-200">
                                {interest}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Social Impact */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          🌱 Social Impact
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Sustainability', 'Climate Tech', 'Social Impact', 'Education Tech', 'Healthcare Innovation'].map((interest) => (
                            <label key={interest} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.interests.includes(interest)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: [...prev.interests, interest]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: prev.interests.filter(i => i !== interest)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-emerald-600 transition-colors duration-200">
                                {interest}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Business & Entrepreneurship */}
                      <div>
                        <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                          🚀 Business & Entrepreneurship
                        </h4>
                        <div className="grid grid-cols-2 gap-2">
                          {['Startups', 'Product Management', 'Design', 'Marketing'].map((interest) => (
                            <label key={interest} className="flex items-center space-x-2 cursor-pointer group">
                              <input
                                type="checkbox"
                                checked={formData.interests.includes(interest)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: [...prev.interests, interest]
                                    }));
                                  } else {
                                    setFormData(prev => ({
                                      ...prev,
                                      interests: prev.interests.filter(i => i !== interest)
                                    }));
                                  }
                                }}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 focus:ring-2 transition-all duration-200"
                              />
                              <span className="text-sm text-gray-700 group-hover:text-purple-600 transition-colors duration-200">
                                {interest}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Selected Interests Display */}
                    {formData.interests.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">Selected Interests:</p>
                        <div className="flex flex-wrap gap-2">
                          {formData.interests.map((interest) => (
                            <span
                              key={interest}
                              className="badge-secondary"
                            >
                              {interest}
                              <button
                                onClick={() => {
                                  setFormData(prev => ({
                                    ...prev,
                                    interests: prev.interests.filter(i => i !== interest)
                                  }));
                                }}
                                className="ml-2 inline-flex items-center justify-center w-4 h-4 rounded-full text-purple-400 hover:text-purple-600 hover:bg-purple-200 transition-colors duration-200"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Social Links Card */}
              <div className="card-hover p-6">
                <div className="flex items-center mb-4">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Social Links</h3>
                    <p className="text-sm text-gray-600">Connect your professional profiles</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">GitHub</label>
                    <input
                      type="text"
                      name="github"
                      value={formData.github}
                      onChange={handleInputChange}
                      placeholder="username"
                      className="input-primary text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">LinkedIn</label>
                    <input
                      type="text"
                      name="linkedin"
                      value={formData.linkedin}
                      onChange={handleInputChange}
                      placeholder="profile-id"
                      className="input-primary text-base"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Portfolio</label>
                    <input
                      type="text"
                      name="portfolio"
                      value={formData.portfolio}
                      onChange={handleInputChange}
                      placeholder="yourdomain.com"
                      className="input-primary text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="text-center">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary px-12 py-4 text-lg font-bold"
                >
                  {saving ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Saving...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Save Profile
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}