'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { BookOpen, Sparkles, Target, ThumbsUp, Eye, Info, Tag, CheckCircle, Clock, CalendarDays } from 'lucide-react'; // Added Tag, CheckCircle, Clock, CalendarDays
import { useFavorites } from '../hooks/useFavorites';
import { useRecommendations } from '../hooks/useRecommendations';
import { Manga } from '../types/manga';
import { logger } from '../utils/logger';
import ErrorMessage from './ErrorMessage';

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
  
  if (loading && recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-xl font-semibold text-white">
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          {/* <h2 className="text-xl font-semibold text-white">
            Recommendations pour vous
          </h2> */}
        </div>
        <ErrorMessage 
          message="Oops! Impossible de charger les recommandations."
          onRetry={refetch}
        />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          {/* <h2 className="text-xl font-semibold text-white">
            Recommendations pour vous
          </h2> */}
        </div>
        <div className="bg-gray-800/50 p-8 rounded-xl text-center shadow-lg">
          <p className="text-sm text-sky-400 mb-2">
            Pas encore de recommandations personnalisées.
          </p>
          <p className="text-xs text-gray-500 mb-4">
            Ajoutez des mangas à vos favoris pour que nous puissions vous suggérer des titres que vous pourriez aimer.
          </p>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-purple-400" />
          {/* <h2 className="text-xl font-semibold text-white">
            Recommendations pour vous
          </h2> */}
        </div>
        <button 
          onClick={refetch}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Réessayer
        </button>
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
  // Use manga.cover if available and no error, otherwise fallback to DEFAULT_COVER
  const coverSrc = imageError || !manga.cover ? DEFAULT_COVER : manga.cover;
  const displayRating = (() => {
    const rawValue = manga.rating;
    if (typeof rawValue === 'number') {
      return rawValue;
    }
    if (typeof rawValue === 'string') {
      const parsed = parseFloat(rawValue);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return undefined;
  })();
  const mangaYear = manga.year;

  const typeDisplayInfo = {
    manga: { text: 'Manga', color: 'bg-sky-600/30 text-sky-300 border-sky-500/40', icon: <Tag className="w-3 h-3" /> },
    manhwa: { text: 'Manhwa', color: 'bg-emerald-600/30 text-emerald-300 border-emerald-500/40', icon: <Tag className="w-3 h-3" /> },
    manhua: { text: 'Manhua', color: 'bg-rose-600/30 text-rose-300 border-rose-500/40', icon: <Tag className="w-3 h-3" /> },
    unknown: { text: 'N/A', color: 'bg-gray-600/30 text-gray-300 border-gray-500/40', icon: <Info className="w-3 h-3" /> }
  };

  const statusDisplayInfo = {
    ongoing: {
      text: 'En cours',
      icon: <Clock className="w-3 h-3" />,
      color: 'bg-amber-600/30 text-amber-300 border-amber-500/40'
    },
    completed: {
      text: 'Terminé',
      icon: <CheckCircle className="w-3 h-3" />,
      color: 'bg-green-600/30 text-green-300 border-green-500/40'
    },
    unknown: {
        text: 'N/A',
        icon: <Info className="w-3 h-3" />,
        color: 'bg-gray-600/30 text-gray-300 border-gray-500/40'
    }
  };

  const currentTypeKey = manga.type?.toLowerCase();
  const currentStatusKey = manga.status?.toLowerCase();

  const typeBadge = typeDisplayInfo[currentTypeKey as keyof typeof typeDisplayInfo] || typeDisplayInfo.unknown;
  const statusBadge = statusDisplayInfo[currentStatusKey as keyof typeof statusDisplayInfo] || statusDisplayInfo.unknown;

  return (
    <div
      className="group relative cursor-pointer transition-all duration-300 ease-in-out transform hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-violet-600/30 rounded-lg overflow-hidden bg-gray-800/70 border border-gray-700/50"
      onClick={onClick}
      title={`${manga.title}${mangaYear ? ` (${mangaYear})` : ''}`}
    >
      <div className="relative aspect-[3/4] w-full">
        <Image
          src={coverSrc}
          alt={`Couverture de ${manga.title}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
          onError={() => {
            if (!imageError) {
              logger.log('warning', `Error loading image for ${manga.title}. Original URL: ${manga.cover || 'N/A'}. Falling back to default.`);
              setImageError(true);
            }
          }}
        />

        {/* Badges Container - Top Right */}
        <div className="absolute top-2 right-2 flex flex-col items-end space-y-1.5 z-10">
          {manga.type && (
            <div className={`flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-xs font-semibold border ${typeBadge.color} backdrop-blur-md shadow-md`}>
              {typeBadge.icon}
              <span>{typeBadge.text}</span>
            </div>
          )}
          {manga.status && (
            <div className={`flex items-center gap-1.5 pl-1.5 pr-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadge.color} backdrop-blur-md shadow-md`}>
              {statusBadge.icon}
              <span>{statusBadge.text}</span>
            </div>
          )}
        </div>

        {/* Overlay Content - Bottom */}
        <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 transition-opacity duration-300 opacity-0 group-hover:opacity-100 flex flex-col justify-end space-y-1">
          <h3 className="text-base font-bold text-white leading-tight line-clamp-2 [text-shadow:_0_1px_3px_rgba(0,0,0,0.8)]">
            {manga.title}
          </h3>
          <div className="flex items-center justify-between text-xs">
            {typeof displayRating === 'number' && displayRating > 0 ? (
              <div className="flex items-center gap-1 text-yellow-400 font-semibold">
                <ThumbsUp className="w-3.5 h-3.5 fill-yellow-400/80 stroke-yellow-600" />
                <span>{displayRating.toFixed(1)}</span>
              </div>
            ) : (
              <div className="text-gray-400 italic text-xs">Pas de note</div>
            )}
            {mangaYear && (
              <div className="flex items-center gap-1 text-gray-300 font-medium">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{mangaYear}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
