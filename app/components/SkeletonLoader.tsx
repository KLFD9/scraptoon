'use client';

interface SkeletonLoaderProps {
  type?: 'manga-grid' | 'continue-reading' | 'trending' | 'card' | 'line';
  count?: number;
  className?: string;
}

export default function SkeletonLoader({ 
  type = 'card', 
  count = 1, 
  className = '' 
}: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'manga-grid':
        return (
          <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-3 bg-gray-800 rounded w-2/3 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'continue-reading':
        return (
          <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-gray-700 rounded animate-pulse"></div>
              <div className="h-6 bg-gray-700 rounded w-40 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
                  <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
                  <div className="h-2 bg-gray-800 rounded w-2/3 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'trending':
        return (
          <div className={`space-y-4 ${className}`}>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-orange-500/30 rounded animate-pulse"></div>
              <div className="h-5 bg-gray-700 rounded w-32 animate-pulse"></div>
              <div className="w-12 h-4 bg-gray-800 rounded animate-pulse"></div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {[...Array(count)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
                  <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'card':
        return (
          <div className={`space-y-3 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="p-4 bg-gray-800/50 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );

      case 'line':
        return (
          <div className={`space-y-2 ${className}`}>
            {[...Array(count)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse"></div>
            ))}
          </div>
        );

      default:
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-gray-800 rounded"></div>
          </div>
        );
    }
  };

  return renderSkeleton();
}
