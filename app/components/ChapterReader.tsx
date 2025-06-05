'use client';

import { useState, useRef, useCallback } from 'react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

interface ChapterReaderProps {
  pages: string[];
  title: string;
  chapter: string;
  mangaTitle: string;
  onPageChange?: (page: number) => void;
}

const ChapterReader: React.FC<ChapterReaderProps> = ({ 
  pages, 
  title, 
  chapter, 
  mangaTitle,
  onPageChange 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const loadedImagesRef = useRef<Set<number>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);
  const [ref] = useInView({
    threshold: 0.5,
    triggerOnce: false
  });

  // Gérer le changement de page
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage !== currentPage) {
      setCurrentPage(newPage);
      onPageChange?.(newPage);
    }
  }, [currentPage, onPageChange]);

  // Gérer le chargement des images
  const handleImageLoad = useCallback((index: number) => {
    loadedImagesRef.current.add(index);
    if (loadedImagesRef.current.size === pages.length) {
      setIsLoading(false);
    }
  }, [pages.length]);

  return (
    <div className="relative min-h-screen bg-gray-900">
      {/* Header fixe */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-800 bg-opacity-90 backdrop-blur-sm text-white p-4">
        <div className="container mx-auto">
          <h1 className="text-xl font-bold">{mangaTitle}</h1>
          <div className="flex justify-between items-center mt-2">
            <p className="text-sm">
              Chapitre {chapter} {title ? `- ${title}` : ''}
            </p>
            <p className="text-sm">
              Page {currentPage}/{pages.length}
            </p>
          </div>
        </div>
      </div>

      {/* Conteneur des images avec padding pour le header */}
      <div className="container mx-auto pt-24 pb-8" ref={containerRef}>
        {/* Loader */}
        {isLoading && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Images */}
        <div className="space-y-4">
          {pages.map((url, index) => (
            <div
              key={url}
              ref={index === currentPage - 1 ? ref : undefined}
              className="relative flex justify-center"
              onMouseEnter={() => handlePageChange(index + 1)}
            >
              <Image
                src={url}
                alt={`Page ${index + 1}`}
                width={800}
                height={1200}
                className={`max-w-full h-auto ${loadedImagesRef.current.has(index) ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                loading="lazy"
                onLoad={() => handleImageLoad(index)}
                loader={({ src }) => src}
              />
              {!loadedImagesRef.current.has(index) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="animate-pulse text-gray-400">
                    Chargement...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Navigation flottante */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800 rounded-lg shadow-lg p-2">
          <button
            onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Retour en haut
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChapterReader; 