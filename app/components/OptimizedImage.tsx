'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: (error: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function OptimizedImage({
  src,
  alt,
  fill = false,
  width,
  height,
  sizes,
  className = '',
  fallbackSrc = '/images/default-cover.svg',
  priority = false,
  onLoad,
  onError
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [imageSrc, setImageSrc] = useState(src);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setHasError(true);
    setIsLoading(false);
    setImageSrc(fallbackSrc);
    onError?.(e);
  };

  if (hasError && imageSrc === fallbackSrc) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500">
          <BookOpen className="w-6 h-6 mx-auto mb-1" />
          <p className="text-xs">Image manquante</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {isLoading && (
        <div className={`absolute inset-0 bg-gray-800 animate-pulse z-10 ${fill ? '' : 'w-full h-full'}`} />
      )}
      
      {/* Actual image */}
      <Image
        src={imageSrc}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${className}`}
        onLoad={handleLoad}
        onError={handleError}
        unoptimized={imageSrc === fallbackSrc}
      />
    </div>
  );
}
