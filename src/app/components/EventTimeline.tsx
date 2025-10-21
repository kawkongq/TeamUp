"use client";

import { useState, useEffect } from 'react';
import { useToast } from './Toast';

interface TimelineItem {
  id: string;
  title: string;
  description?: string;
  date: string;
  isCompleted: boolean;
}

interface EventTimelineProps {
  eventId: string;
  canEdit?: boolean;
  onClose?: () => void;
}

export default function EventTimeline({ eventId, canEdit = false, onClose }: EventTimelineProps) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: ''
  });

  useEffect(() => {
    fetchTimeline();
  }, [eventId]);

  const fetchTimeline = async () => {
    try {
      const response = await fetch(`/api/events/${eventId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Failed to fetch timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.date) {
      showToast({
        type: 'error',
        title: 'Validation Error',
        message: 'Title and date are required'
      });
      return;
    }

    try {
      const url = editingItem 
        ? `/api/events/${eventId}/timeline/${editingItem.id}`
        : `/api/events/${eventId}/timeline`;
      
      const method = editingItem ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          date: new Date(formData.date + 'T09:00:00').toISOString()
        }),
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: editingItem ? 'Timeline Updated' : 'Timeline Item Added',
          message: editingItem ? 'Timeline item updated successfully' : 'New timeline item added successfully'
        });
        
        setFormData({ title: '', description: '', date: '' });
        setShowAddForm(false);
        setEditingItem(null);
        fetchTimeline();
      } else {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          console.error('Failed to parse JSON response:', e);
          data = { error: 'Invalid response from server' };
        }
        
        console.error('Timeline API error:', { status: response.status, data, url: response.url });
        showToast({
          type: 'error',
          title: 'Error',
          message: data?.error || `Server error (${response.status})`
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

  const handleEdit = (item: TimelineItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description || '',
      date: new Date(item.date).toISOString().slice(0, 10)
    });
    setShowAddForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this timeline item?')) return;

    try {
      const response = await fetch(`/api/events/${eventId}/timeline/${itemId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        showToast({
          type: 'success',
          title: 'Timeline Item Deleted',
          message: 'Timeline item deleted successfully'
        });
        fetchTimeline();
      } else {
        const data = await response.json();
        showToast({
          type: 'error',
          title: 'Delete Failed',
          message: data.error || 'Failed to delete timeline item'
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

  const toggleComplete = async (item: TimelineItem) => {
    try {
      const response = await fetch(`/api/events/${eventId}/timeline/${item.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isCompleted: !item.isCompleted
        }),
      });

      if (response.ok) {
        fetchTimeline();
      }
    } catch (error) {
      console.error('Failed to toggle completion:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
          <h2 className="text-2xl font-bold text-gray-900">Event Timeline</h2>
          <div className="flex items-center space-x-3">
            {canEdit && (
              <button
                onClick={() => {
                  setShowAddForm(true);
                  setEditingItem(null);
                  setFormData({ title: '', description: '', date: '' });
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Add Timeline Item
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
                {editingItem ? 'Edit Timeline Item' : 'Add Timeline Item'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Timeline item title"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description (Optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    placeholder="Additional details..."
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    {editingItem ? 'Update' : 'Add'} Timeline Item
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddForm(false);
                      setEditingItem(null);
                      setFormData({ title: '', description: '', date: '' });
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Timeline */}
          {timeline.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Timeline Items</h3>
              <p className="text-gray-600">
                {canEdit ? 'Add timeline items to track important dates and milestones.' : 'No timeline items have been added yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {timeline.map((item, index) => (
                <div key={item.id} className="flex">
                  {/* Timeline Line */}
                  <div className="flex flex-col items-center mr-4">
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      item.isCompleted 
                        ? 'bg-green-500 border-green-500' 
                        : 'bg-white border-gray-300'
                    }`}></div>
                    {index < timeline.length - 1 && (
                      <div className="w-0.5 h-16 bg-gray-200 mt-2"></div>
                    )}
                  </div>

                  {/* Timeline Content */}
                  <div className="flex-1 pb-8">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-lg font-semibold ${
                            item.isCompleted ? 'text-green-700 line-through' : 'text-gray-900'
                          }`}>
                            {item.title}
                          </h4>
                          <p className="text-sm text-gray-500 mb-2">
                            {formatDate(item.date)}
                          </p>
                          {item.description && (
                            <p className="text-gray-600">{item.description}</p>
                          )}
                        </div>

                        {canEdit && (
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => toggleComplete(item)}
                              className={`p-1 rounded ${
                                item.isCompleted 
                                  ? 'text-green-600 hover:text-green-700' 
                                  : 'text-gray-400 hover:text-green-600'
                              }`}
                              title={item.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleEdit(item)}
                              className="p-1 text-gray-400 hover:text-indigo-600"
                              title="Edit"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
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