'use client';

import { TrendingUp, Flame } from 'lucide-react';
import Image from 'next/image';
import { useTrending } from '../hooks/useTrending';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface TrendingSectionProps {
  onSearch: (query: string) => void;
}

const DEFAULT_COVER = '/images/default-cover.svg';

export default function TrendingSection({ onSearch }: TrendingSectionProps) {
  const { trending, loading, error, refetch } = useTrending(6);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-base font-medium text-white">Tendances du moment</h3>
          <LoadingSpinner size="sm" />
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          <h3 className="text-base font-medium text-white">Tendances du moment</h3>
        </div>
        <ErrorMessage 
          message="Impossible de charger les tendances" 
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (trending.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Flame className="w-4 h-4 text-orange-500" />
        <h3 className="text-base font-medium text-white">
          Tendances du moment
        </h3>
        <span className="text-xs text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-full border border-gray-700/30">
          Populaire
        </span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {trending.map((manga, index) => (
          <div 
            key={manga.id} 
            className="group cursor-pointer" 
            onClick={() => onSearch(manga.title)}
          >
            {/* Mini Cover */}
            <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 hover:shadow-lg hover:shadow-orange-500/10">
              <Image
                src={manga.cover}
                alt={manga.title}
                fill
                className="object-cover transition-transform group-hover:scale-105"
                sizes="(max-width: 640px) 33vw, 16vw"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  (e.target as HTMLImageElement).src = DEFAULT_COVER;
                }}
              />
              
              {/* Ranking Badge */}
              <div className="absolute top-1.5 left-1.5">
                <div className="w-5 h-5 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md">
                  {index + 1}
                </div>
              </div>
              
              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
              
              {/* Trending Icon */}
              <div className="absolute bottom-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-5 h-5 bg-orange-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-3 h-3 text-white" />
                </div>
              </div>
            </div>
            
            {/* Title */}
            <h4 className="mt-2 text-xs font-medium text-gray-300 group-hover:text-white transition-colors line-clamp-2 leading-tight">
              {manga.title}
            </h4>
          </div>
        ))}
      </div>
    </div>
  );
}
