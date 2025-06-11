'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface OptimizedMangaImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackSrc?: string;
  showPlaceholder?: boolean;
}

const DEFAULT_FALLBACK = '/images/manga-placeholder.svg';

export default function OptimizedMangaImage({
  src,
  alt,
  className = '',
  sizes = '(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw',
  priority = false,
  fallbackSrc = DEFAULT_FALLBACK,
  showPlaceholder = true,
}: OptimizedMangaImageProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  // Determine the best source to use
  useEffect(() => {
    let sourceToUse: string | null = null;

    // Priority: actual API cover > fallback > placeholder
    if (src && src !== DEFAULT_FALLBACK && src.startsWith('http')) {
      sourceToUse = src;
    } else if (src && !src.startsWith('http') && src !== DEFAULT_FALLBACK) {
      // Local image path, use as is
      sourceToUse = src;
    } else {
      // Use fallback
      sourceToUse = fallbackSrc;
      setHasError(true); // Consider this as an error state for styling
    }

    setImageSrc(sourceToUse);
  }, [src, fallbackSrc]);

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  const handleImageError = () => {
    if (imageSrc !== fallbackSrc) {
      // Try fallback if current image failed
      setImageSrc(fallbackSrc);
      setHasError(true);
    } else {
      // Fallback also failed, just hide loading
      setIsLoading(false);
      setHasError(true);
    }
  };

  if (!imageSrc) {
    return (
      <div className={`bg-gray-800 flex items-center justify-center ${className}`}>
        {showPlaceholder && (
          <BookOpen className="w-8 h-8 text-gray-600" />
        )}
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading placeholder with fade effect */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center z-10">
          {showPlaceholder && (
            <BookOpen className="w-8 h-8 text-gray-600" />
          )}
        </div>
      )}
      
      {/* Actual image */}
      <Image
        ref={imageRef}
        src={imageSrc}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${
          isLoading ? 'opacity-0' : 'opacity-100'
        } ${hasError ? 'grayscale' : ''}`}
        sizes={sizes}
        priority={priority}
        onLoad={handleImageLoad}
        onError={handleImageError}
        quality={hasError ? 75 : 90} // Lower quality for fallbacks
        // Mobile optimizations
        style={{
          imageRendering: '-webkit-optimize-contrast',
          backfaceVisibility: 'hidden',
          transform: 'translateZ(0)', // Force hardware acceleration
        }}
      />
      
      {/* Error overlay for fallback images */}
      {hasError && !isLoading && (
        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
          <div className="bg-black/50 px-2 py-1 rounded">
            <BookOpen className="w-4 h-4 text-white/70" />
          </div>
        </div>
      )}
    </div>
  );
}
