'use client';

import { useState, useRef, useEffect } from 'react';
import { Manga } from '../types/manga';
import Link from 'next/link';
import { BookOpen, Star } from 'lucide-react';
import OptimizedMangaImage from './OptimizedMangaImage';

interface MangaCardProps {
  manga: Manga;
  priority?: boolean;
  isVisible?: boolean;
}

function MangaCard({ manga, priority = false, isVisible = true }: MangaCardProps) {
  return (
    <Link
      href={`/manga/${manga.id}`}
      className="group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200 block"
    >
      {/* Image Container */}
      <div className="relative aspect-[3/4] overflow-hidden">
        {isVisible ? (
          <OptimizedMangaImage
            src={manga.cover}
            alt={manga.title}
            className="w-full h-full group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw"
            priority={priority}
          />
        ) : (
          <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-gray-600" />
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
        
        {/* Badges */}
        <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
          {manga.isAvailableInFrench && (
            <span className="bg-white text-gray-950 px-1.5 py-0.5 rounded text-xs font-medium">
              FR
            </span>
          )}
          <span className="bg-gray-900/80 text-white px-1.5 py-0.5 rounded text-xs">
            {manga.type.charAt(0).toUpperCase()}
          </span>
        </div>
        
        {/* Chapter count */}
        <div className="absolute bottom-1.5 right-1.5">
          <span className="bg-gray-900/80 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
            <BookOpen className="w-2.5 h-2.5" />
            <span className="hidden sm:inline">{manga.chapterCount?.total || '?'}</span>
            <span className="sm:hidden">{manga.chapterCount?.total || '?'}</span>
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3">
        <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-gray-300 transition-colors leading-tight">
          {manga.title}
        </h3>
        
        <div className="flex items-center justify-between text-xs mb-1">
          <span className={`px-1.5 py-0.5 rounded text-xs ${
            manga.status === 'ongoing' 
              ? 'bg-green-900/30 text-green-400' 
              : 'bg-gray-800 text-gray-400'
          }`}>
            {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
          </span>
          
          {/* Score display */}
          {(manga.score || manga.rating) && typeof (manga.score || manga.rating) === 'number' && (
            <div className="flex items-center gap-1 text-yellow-400">
              <Star className="w-3 h-3 fill-yellow-400" />
              <span className="text-xs font-medium">
                {((manga.score || manga.rating) as number).toFixed(1)}
              </span>
            </div>
          )}
        </div>
        
        {manga.author && (
          <div className="text-gray-400 truncate text-xs hidden sm:block">
            {manga.author.split(' ')[0]}
          </div>
        )}
      </div>
    </Link>
  );
}

interface EnhancedMangaResultsProps {
  mangas: Manga[];
  className?: string;
}

export default function EnhancedMangaResults({ mangas, className = '' }: EnhancedMangaResultsProps) {
  const [visibleCount, setVisibleCount] = useState(18); // Show first 18 items initially
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const observerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && visibleCount < mangas.length && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setVisibleCount(prev => Math.min(prev + 12, mangas.length));
            setIsLoadingMore(false);
          }, 300);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '100px',
      }
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observer.unobserve(observerRef.current);
      }
    };
  }, [visibleCount, mangas.length, isLoadingMore]);

  if (!mangas || mangas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-lg flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Aucun manga trouvé
        </h3>
        <p className="text-gray-400">
          Essayez avec d'autres mots-clés
        </p>
      </div>
    );
  }

  const visibleMangas = mangas.slice(0, visibleCount);
  const hasMore = visibleCount < mangas.length;

  return (
    <div className={className}>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
        {visibleMangas.map((manga, index) => (
          <MangaCard 
            key={manga.id} 
            manga={manga} 
            priority={index < 6} // Prioritize first 6 images
            isVisible={index < 18 || index < visibleCount} // Show placeholder for items not yet loaded
          />
        ))}
      </div>
      
      {/* Load more trigger */}
      {hasMore && (
        <div ref={observerRef} className="h-20 flex items-center justify-center mt-8">
          {isLoadingMore && (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
          )}
        </div>
      )}
      
      {/* Total count */}
      <div className="text-center mt-6 text-gray-400 text-sm">
        Affichage de {visibleCount} sur {mangas.length} mangas
        {hasMore && <span className="ml-2">• Faites défiler pour voir plus</span>}
      </div>
    </div>
  );
}
