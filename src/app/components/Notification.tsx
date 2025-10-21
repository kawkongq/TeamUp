"use client";

import { useState, useEffect } from 'react';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

export default function Notification({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  show
}: NotificationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsLeaving(false);
      
      const timer = setTimeout(() => {
        handleClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  if (!show && !isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'success':
        return {
          container: 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200',
          icon: 'bg-green-100 text-green-600',
          title: 'text-green-800',
          message: 'text-green-600',
          iconPath: 'M5 13l4 4L19 7'
        };
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-50 to-pink-50 border-red-200',
          icon: 'bg-red-100 text-red-600',
          title: 'text-red-800',
          message: 'text-red-600',
          iconPath: 'M6 18L18 6M6 6l12 12'
        };
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200',
          icon: 'bg-yellow-100 text-yellow-600',
          title: 'text-yellow-800',
          message: 'text-yellow-600',
          iconPath: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z'
        };
      case 'info':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200',
          icon: 'bg-blue-100 text-blue-600',
          title: 'text-blue-800',
          message: 'text-blue-600',
          iconPath: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      className={`max-w-md w-full transform transition-all duration-500 ease-out ${
        isVisible && !isLeaving
          ? 'translate-x-0 opacity-100 scale-100'
          : 'translate-x-full opacity-0 scale-95'
      }`}
    >
      <div className={`${styles.container} border rounded-2xl shadow-2xl backdrop-blur-lg p-6 relative overflow-hidden hover:shadow-3xl transition-shadow duration-300`}>
        {/* Animated background shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent opacity-60 animate-shimmer"></div>
        
        {/* Progress bar animation */}
        <div 
          className="absolute bottom-0 left-0 h-1 bg-current opacity-40 transition-all duration-300"
          style={{
            width: isLeaving ? '0%' : '100%',
            animation: `shrink ${duration}ms linear`
          }}
        ></div>
        
        <div className="relative flex items-start space-x-4">
          {/* Animated Icon */}
          <div className={`${styles.icon} w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform transition-transform duration-300 hover:scale-110`}>
            <svg className="w-7 h-7 animate-bounce-subtle" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={styles.iconPath} />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className={`${styles.title} text-xl font-bold mb-2 tracking-tight`}>
              {title}
            </h4>
            {message && (
              <p className={`${styles.message} text-base leading-relaxed opacity-90`}>
                {message}
              </p>
            )}
          </div>

          {/* Enhanced Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/20 hover:bg-white/40 flex items-center justify-center transition-all duration-200 hover:scale-110 hover:rotate-90"
          >
            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
        
        @keyframes bounce-subtle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s infinite;
        }
        
        .hover\\:shadow-3xl:hover {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
      `}</style>
    </div>
  );
}