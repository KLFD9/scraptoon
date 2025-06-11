'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Sparkles, Target, ThumbsUp, Eye, Info, Tag, CheckCircle, Clock } from 'lucide-react'; // Added Tag, CheckCircle, Clock
import { useFavorites } from '../hooks/useFavorites';
import { useRecommendations } from '../hooks/useRecommendations';
import { Manga } from '../types/manga';
import { logger } from '../utils/logger';

interface ModernRecommendationsSectionProps {
  onSearch: (query: string) => void;
}

const DEFAULT_COVER = '/images/manga-placeholder.svg';

export default function ModernRecommendationsSection({ onSearch }: ModernRecommendationsSectionProps) {
  const { recommendations, loading, error, refetch } = useRecommendations(5);
  const { favorites } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    logger.log('info', 'ModernRecommendationsSection mounted');
    setMounted(true);
  }, []);

  useEffect(() => {
    logger.log('info', 'recommendations state updated', {
      count: recommendations.length,
      loading,
      error: error ?? undefined, // Handle null error for logger
      favoritesCount: favorites.length
    });
  }, [recommendations, loading, error, favorites]);

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        logger.log('info', 'forcing recommendations reload');
        refetch();
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [refetch]);

  if (!mounted) {
    return null; // Or a minimal skeleton loader
  }
  
  if (loading) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-violet-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Recommendations pour vous
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2 animate-pulse">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
              <div className="h-4 bg-gray-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-800 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-red-500/10 rounded-lg">
            <Info className="w-5 h-5 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Recommendations pour vous
          </h2>
        </div>
        <div className="bg-gray-800/50 border border-red-500/30 rounded-lg p-6 text-center">
          <p className="text-sm text-red-400 mb-2">
            Oops! Impossible de charger les recommandations.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            {error}
          </p>
          <button 
            onClick={refetch}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </section>
    );
  }

  if (!recommendations.length) {
    return (
      <section className="py-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-1.5 bg-sky-500/10 rounded-lg">
            <Target className="w-5 h-5 text-sky-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Recommendations pour vous
          </h2>
        </div>
        <div className="bg-gray-800/50 border border-sky-500/30 rounded-lg p-6 text-center">
          <p className="text-sm text-sky-400 mb-2">
            Pas encore de recommandations personnalisées.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Ajoutez des mangas à vos favoris pour que nous puissions vous suggérer des titres que vous pourriez aimer.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 rounded-lg">
            <Sparkles className="w-5 h-5 text-violet-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">
            Recommendations pour vous
          </h2>
        </div>
        {favorites.length > 0 && (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-full">
            Basé sur vos <strong className="text-violet-400">{favorites.length}</strong> favoris
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-x-4 gap-y-6">
        {recommendations.map((manga) => (
          <RecommendationCard 
            key={manga.id || manga.title} // Ensure a unique key
            manga={manga} 
            onClick={() => onSearch(manga.title)} 
          />
        ))}
      </div>
    </section>
  );
}

interface RecommendationCardProps {
  manga: Manga;
  onClick: () => void;
}

function RecommendationCard({ manga, onClick }: RecommendationCardProps) {
  const [imageError, setImageError] = useState(false);
  const coverSrc = imageError ? DEFAULT_COVER : (manga.cover || DEFAULT_COVER);
  const displayRating = manga.rating;

  const typeDisplay = {
    manga: 'Manga',
    manhwa: 'Manhwa',
    manhua: 'Manhua'
  };

  const statusDisplay = {
    ongoing: {
      text: 'En cours',
      icon: <Clock className="w-2.5 h-2.5" />,
      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30'
    },
    completed: {
      text: 'Terminé',
      icon: <CheckCircle className="w-2.5 h-2.5" />,
      color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
    }
  };

  return (
    <div 
      className="group relative cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/10 rounded-lg overflow-hidden" 
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] bg-gray-800">
        <Image
          src={coverSrc}
          alt={`Couverture de ${manga.title}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          onError={() => setImageError(true)}
        />
        
        {/* Overlay with info appearing on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          {manga.chapterCount?.total && manga.chapterCount.total > 0 && (
            <div className="flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs w-fit mb-1">
              <BookOpen className="w-3 h-3" />
              <span>{manga.chapterCount.total} chapitres</span>
            </div>
          )}
          {displayRating && (
             <div className="flex items-center gap-1 bg-yellow-500/90 backdrop-blur-sm text-black px-2 py-0.5 rounded-full text-xs w-fit font-semibold mb-1">
              <ThumbsUp className="w-3 h-3" />
              <span>{displayRating}</span>
            </div>
          )}
           {/* Manga Type Badge - always visible on hover */}
          <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm text-gray-300 px-2 py-0.5 rounded-full text-xs w-fit">
            <Tag className="w-3 h-3" />
            <span>{typeDisplay[manga.type] || 'N/A'}</span>
          </div>
        </div>

        {/* Status Badge - top right, always visible */}
        {manga.status && statusDisplay[manga.status] && (
          <div className={`absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-medium border ${statusDisplay[manga.status].color} backdrop-blur-sm`}>
            {statusDisplay[manga.status].icon}
            <span>{statusDisplay[manga.status].text}</span>
          </div>
        )}
      </div>
      
      {/* Info below card - always visible */}
      <div className="p-2 bg-gray-800/50 group-hover:bg-gray-700/70 transition-colors">
        <h3 className="text-sm font-medium text-gray-200 group-hover:text-violet-400 transition-colors line-clamp-1 truncate">
          {manga.title}
        </h3>
        {manga.author && (
          <p className="text-xs text-gray-500 line-clamp-1 truncate group-hover:text-gray-400 transition-colors">{manga.author}</p>
        )}
      </div>
    </div>
  );
}
