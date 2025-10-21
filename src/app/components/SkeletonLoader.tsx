interface SkeletonLoaderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string;
  height?: string;
  lines?: number;
}

export default function SkeletonLoader({ 
  className = '',
  variant = 'rectangular',
  width,
  height,
  lines = 1
}: SkeletonLoaderProps) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]";
  
  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    card: 'rounded-xl'
  };

  const style = {
    width: width || (variant === 'circular' ? height : undefined),
    height: height || (variant === 'text' ? '1rem' : undefined)
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`${baseClasses} ${variantClasses[variant]} ${
              index === lines - 1 ? 'w-3/4' : 'w-full'
            }`}
            style={{ height: height || '1rem' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

// Pre-built skeleton components
export function ProfileSkeleton() {
  return (
    <div className="flex items-center space-x-4 p-4">
      <SkeletonLoader variant="circular" width="60px" height="60px" />
      <div className="flex-1">
        <SkeletonLoader variant="text" width="150px" className="mb-2" />
        <SkeletonLoader variant="text" width="100px" />
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <SkeletonLoader variant="rectangular" height="200px" />
      <SkeletonLoader variant="text" lines={2} />
      <div className="flex justify-between items-center">
        <SkeletonLoader variant="text" width="80px" />
        <SkeletonLoader variant="rectangular" width="100px" height="36px" />
      </div>
    </div>
  );
}

export function TeamCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonLoader variant="text" width="150px" height="24px" />
        <SkeletonLoader variant="rectangular" width="60px" height="20px" />
      </div>
      <SkeletonLoader variant="text" lines={3} />
      <div className="flex items-center space-x-4">
        <SkeletonLoader variant="circular" width="32px" height="32px" />
        <SkeletonLoader variant="text" width="100px" />
      </div>
      <div className="flex justify-between items-center pt-4">
        <SkeletonLoader variant="text" width="80px" />
        <SkeletonLoader variant="rectangular" width="120px" height="40px" />
      </div>
    </div>
  );
}