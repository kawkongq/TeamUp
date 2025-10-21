"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Notification from '../components/Notification';

interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

interface NotificationContextType {
  showNotification: (notification: Omit<NotificationData, 'id'>) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const showNotification = (notification: Omit<NotificationData, 'id'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const newNotification = { ...notification, id };
    
    // Check if similar notification already exists
    const existingSimilar = notifications.find(n => 
      n.type === notification.type && 
      n.title === notification.title &&
      n.message === notification.message
    );
    
    if (existingSimilar) {
      return; // Don't show duplicate notification
    }
    
    setNotifications(prev => [...prev, newNotification]);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    showNotification({ type: 'success', title, message });
  };

  const showError = (title: string, message?: string) => {
    showNotification({ type: 'error', title, message });
  };

  const showWarning = (title: string, message?: string) => {
    showNotification({ type: 'warning', title, message });
  };

  const showInfo = (title: string, message?: string) => {
    showNotification({ type: 'info', title, message });
  };

  return (
    <NotificationContext.Provider value={{
      showNotification,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      
      {/* Render notifications */}
      {mounted && (
        <div className="fixed top-6 right-6 z-50 space-y-4 max-w-md pointer-events-none">
          {notifications.map((notification, index) => (
            <div
              key={notification.id}
              className="pointer-events-auto"
              style={{ 
                transform: `translateY(${index * 8}px) scale(${1 - index * 0.02})`,
                zIndex: 50 - index,
                opacity: 1 - index * 0.1
              }}
            >
              <Notification
                type={notification.type}
                title={notification.title}
                message={notification.message}
                duration={notification.duration || 5000}
                show={true}
                onClose={() => removeNotification(notification.id)}
              />
            </div>
          ))}
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}