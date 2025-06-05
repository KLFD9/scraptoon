'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import Image from 'next/image';

interface ChapterReaderProps {
  pages: string[];
  title: string;
  chapter: string;
  mangaTitle: string;
  onPageChange?: (page: number) => void;
}

interface ImageDimensions {
  width: number;
  height: number;
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
  const [imageDimensions, setImageDimensions] = useState<Map<number, ImageDimensions>>(new Map());
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set());
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
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

  // Précharger les dimensions des images
  useEffect(() => {
    const loadImageDimensions = async () => {
      const promises = pages.map((url, index) => {
        return new Promise<void>((resolve) => {
          const img = new window.Image();
          img.onload = () => {
            setImageDimensions(prev => new Map(prev.set(index, {
              width: img.naturalWidth,
              height: img.naturalHeight
            })));
            resolve();
          };
          img.onerror = () => {
            // Dimensions par défaut en cas d'erreur
            setImageDimensions(prev => new Map(prev.set(index, {
              width: 800,
              height: 1200
            })));
            setImageErrors(prev => new Set(prev.add(index)));
            resolve();
          };
          img.src = url;
        });
      });

      await Promise.all(promises);
      setIsLoading(false);
    };

    loadImageDimensions();
  }, [pages]);

  // Gérer le chargement des images Next.js
  const handleImageLoad = useCallback((index: number) => {
    setLoadedImages(prev => new Set(prev.add(index)));
  }, []);

  // Gérer les erreurs d'images Next.js
  const handleImageError = useCallback((index: number) => {
    console.error(`Erreur de chargement de l'image ${index + 1}`);
    setImageErrors(prev => new Set(prev.add(index)));
    setLoadedImages(prev => new Set(prev.add(index))); // Marquer comme "chargée" pour éviter le blocage
  }, []);

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
          {pages.map((url, index) => {
            const dimensions = imageDimensions.get(index);
            const isLoaded = loadedImages.has(index);
            const hasError = imageErrors.has(index);
            
            return (
              <div
                key={url}
                ref={index === currentPage - 1 ? ref : undefined}
                className="relative flex justify-center"
                onMouseEnter={() => handlePageChange(index + 1)}
              >
                {dimensions && (
                  <div className="relative w-full flex justify-center">
                    {hasError ? (
                      <div className="bg-gray-800 text-white p-8 text-center rounded-lg">
                        <p>Erreur de chargement de l'image {index + 1}</p>
                        <p className="text-sm text-gray-400 mt-2">URL: {url}</p>
                      </div>
                    ) : (
                      <div className="relative flex justify-center w-full">
                        <Image
                          src={url}
                          alt={`Page ${index + 1}`}
                          width={dimensions.width}
                          height={dimensions.height}
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 60vw"
                          style={{ 
                            width: 'auto', 
                            height: 'auto',
                            maxWidth: '100%',
                            maxHeight: 'none'
                          }}
                          className={`${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
                          loading="lazy"
                          onLoad={() => handleImageLoad(index)}
                          onError={() => handleImageError(index)}
                          unoptimized
                          priority={index < 3} // Priorité pour les 3 premières images
                        />
                      </div>
                    )}
                    
                    {!isLoaded && !hasError && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-800 rounded-lg">
                        <div className="animate-pulse text-gray-400 text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                          <p>Chargement page {index + 1}...</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {!dimensions && !isLoading && (
                  <div className="bg-gray-800 text-white p-8 text-center rounded-lg">
                    <p>Chargement des dimensions...</p>
                  </div>
                )}
              </div>
            );
          })}
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