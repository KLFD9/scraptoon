'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen, Sparkles, Target } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { useRecommendations } from '../hooks/useRecommendations';
import { Manga } from '../types/manga';

interface ModernRecommendationsSectionProps {
  onSearch: (query: string) => void;
}

const DEFAULT_COVER = '/images/default-cover.svg';

export default function ModernRecommendationsSection({ onSearch }: ModernRecommendationsSectionProps) {
  const { recommendations, loading } = useRecommendations(5); // Limit to 5 items for a cleaner look
  const { favorites } = useFavorites();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // If there are no recommendations or loading, return null to avoid empty space
  if (recommendations.length === 0 || loading) {
    return null;
  }

  return (
    <section className="py-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-violet-100 dark:bg-violet-950/30 p-1.5 rounded-md">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          </div>
          <h2 className="text-sm font-medium text-gray-900 dark:text-white">
            Recommendations pour vous
          </h2>
        </div>
        {favorites.length > 0 && (
          <span className="text-xs text-gray-500">
            Basé sur vos {favorites.length} favoris
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-4">
        {recommendations.map((manga) => (
          <RecommendationCard 
            key={manga.id} 
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
  return (
    <div 
      className="group cursor-pointer space-y-2 transition-all" 
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        <Image
          src={manga.cover || DEFAULT_COVER}
          alt={manga.title}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, 20vw"
          onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
            (e.target as HTMLImageElement).src = DEFAULT_COVER;
          }}
        />
        
        {/* Modern hover overlay with minimal gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          {/* Read badge - appears only if chapters exist */}
        {manga.chapterCount?.total && manga.chapterCount.total > 0 && (
          <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white px-2 py-0.5 rounded-full text-xs">
              <BookOpen className="w-3 h-3" />
              <span>{manga.chapterCount.total} ch</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="space-y-1">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1 group-hover:text-violet-500 transition-colors">
          {manga.title}
        </h3>
        {manga.author && (
          <p className="text-xs text-gray-500 line-clamp-1">{manga.author}</p>
        )}
      </div>
    </div>
  );
}
