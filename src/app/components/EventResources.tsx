"use client";

import { useState, useEffect } from 'react';
import { useToast } from './Toast';

interface Resource {
  id: string;
  title: string;
  description?: string;
  type: 'LINK' | 'FILE' | 'DOCUMENT' | 'VIDEO';
  url?: string;
  fileUrl?: string;
  createdAt: string;
}

interface EventResourcesProps {
  eventId: string;
  canEdit?: boolean;
  onClose?: () => void;
}

export default function EventResources({ eventId, canEdit = false, onClose }: EventResourcesProps) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'LINK' as 'LINK' | 'FILE' | 'DOCUMENT' | 'VIDEO',
    url: '',
    fileUrl: ''
  });

  useEffect(() => {
    fetchResources();
  }, [eventId]);

  const fetchResources = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/resources`);
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, fileUrl: data.url }));
        showToast({
          type: 'success',
          title: 'File Uploaded',
          message: 'File uploaded successfully'
        });
      } else {
        const errorData = await response.json();
        showToast({
          type: 'error',
          title: 'Upload Failed',
          message: errorData.error || 'Failed to upload file'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Upload Error',
        message: 'Failed to upload file'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.type) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Title and type are required'
      });
      return;
    }

    if (formData.type === 'LINK' && !formData.url) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'URL is required for link resources'
      });
      return;
    }

    if (formData.type === 'FILE' && !formData.fileUrl) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Please upload a file'
      });
      return;
    }

    try {
      const url = editingResource 
        ? `/api/events/${eventId}/resources/${editingResource.id}`
        : `/api/events/${eventId}/resources`;
      
      const method = editingResource ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: editingResource ? 'Resource Updated' : 'Resource Added',
          message: editingResource ? 'Resource updated successfully' : 'New resource added successfully'
        });
        
        setFormData({ title: '', description: '', type: 'LINK', url: '', fileUrl: '' });
        setShowAddForm(false);
        setEditingResource(null);
        fetchResources();
      } else {
        const data = await response.json();
        showToast({
          type: 'error',
          title: 'Error',
          message: data.error || 'Failed to save resource'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server'
      });
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      url: resource.url || '',
      fileUrl: resource.fileUrl || ''
    });
    setShowAddForm(true);
  };

  const handleDelete = async (resourceId: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}/resources/${resourceId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Resource Deleted',
          message: 'Resource deleted successfully'
        });
        fetchResources();
      } else {
        const data = await response.json();
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: data.error || 'Failed to delete resource'
        });
      }
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Network Error',
        message: 'Failed to connect to server'
      });
    }
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'LINK':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        );
      case 'FILE':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'DOCUMENT':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case 'VIDEO':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const getResourceUrl = (resource: Resource) => {
    return resource.type === 'LINK' ? resource.url : resource.fileUrl;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Event Resources</h2>
          <div className="flex items-center space-x-3">
            {canEdit && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingResource(null);
                  setFormData({ title: '', description: '', type: 'LINK', url: '', fileUrl: '' });
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Resource
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Add/Edit Form */}
          {showAddForm && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">
                {editingResource ? 'Edit Resource' : 'Add Resource'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Resource title"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        type: e.target.value as 'LINK' | 'FILE' | 'DOCUMENT' | 'VIDEO',
                        url: '',
                        fileUrl: ''
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                      <option value="LINK">Link</option>
                      <option value="FILE">File</option>
                      <option value="DOCUMENT">Document</option>
                      <option value="VIDEO">Video</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Resource description..."
                    rows={3}
                  />
                </div>

                {formData.type === 'LINK' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL
                    </label>
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="https://example.com"
                      required
                    />
                  </div>
                )}

                {formData.type === 'FILE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      File Upload
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                      {formData.fileUrl ? (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-green-600">File uploaded successfully</span>
                          <button
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, fileUrl: '' }))}
                            className="text-red-600 hover:text-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div className="text-center">
                          <input
                            type="file"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileUpload(file);
                            }}
                            className="hidden"
                            id="file-upload"
                            disabled={uploading}
                          />
                          <label
                            htmlFor="file-upload"
                            className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                          >
                            {uploading ? 'Uploading...' : 'Choose File'}
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    disabled={uploading}
                  >
                    {editingResource ? 'Update' : 'Add'} Resource
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingResource(null);
                      setFormData({ title: '', description: '', type: 'LINK', url: '', fileUrl: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Resources List */}
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Resources</h3>
              <p className="text-gray-600">
                {canEdit ? 'Add resources to help participants with useful links and files.' : 'No resources have been added yet.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {resources.map((resource) => (
                <div key={resource.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <div className="flex-shrink-0 p-2 bg-gray-100 rounded-lg">
                        {getResourceIcon(resource.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-lg font-semibold text-gray-900 truncate">
                          {resource.title}
                        </h4>
                        <p className="text-sm text-gray-500 mb-2">
                          {resource.type}
                        </p>
                        {resource.description && (
                          <p className="text-gray-600 text-sm mb-3">
                            {resource.description}
                          </p>
                        )}
                        <a
                          href={getResourceUrl(resource)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                          {resource.type === 'LINK' ? 'Visit Link' : 'Download File'}
                          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      </div>
                    </div>

                    {canEdit && (
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(resource)}
                          className="p-1 text-gray-400 hover:text-indigo-600"
                          title="Edit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(resource.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}