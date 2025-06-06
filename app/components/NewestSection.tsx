'use client';

import { Clock, Sparkles, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import { useNewest } from '../hooks/useNewest';

interface NewestSectionProps {
  onSearch: (query: string) => void;
}

const DEFAULT_COVER = '/images/default-cover.svg';

export default function NewestSection({ onSearch }: NewestSectionProps) {
  const { newest, loading, error, refetch } = useNewest(8);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">Nouveautés</h3>
          <LoadingSpinner size="sm" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-gray-800 rounded-md animate-pulse"></div>
              <div className="h-2 bg-gray-800 rounded animate-pulse"></div>
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
          <Clock className="w-5 h-5 text-blue-400" />
          <h3 className="text-base font-semibold text-white">Nouveautés</h3>
        </div>
        <ErrorMessage 
          message="Impossible de charger les nouveautés" 
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (newest.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-400" />
        <h3 className="text-base font-semibold text-white">
          Nouveautés
        </h3>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
            🆕 Fraîchement ajoutés
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {newest.map((manga, index) => {
          const isVeryNew = index < 2; // Les 2 premiers sont très récents
          
          return (
            <div 
              key={manga.id} 
              className="group cursor-pointer" 
              onClick={() => onSearch(manga.title)}
            >
              {/* Mini Cover */}
              <div className="relative aspect-[3/4] rounded-md overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/10">
                <Image
                  src={manga.cover || DEFAULT_COVER}
                  alt={manga.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 25vw, 12.5vw"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COVER;
                  }}
                />
                
                {/* New Badge */}
                <div className="absolute top-1 left-1">
                  <div className={`px-1.5 py-0.5 rounded text-xs font-bold shadow-lg border ${
                    isVeryNew 
                      ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-white/20' 
                      : 'bg-gray-800/90 text-gray-300 border-gray-600/50'
                  } backdrop-blur-sm`}>
                    {isVeryNew ? 'NEW' : 'RÉCENT'}
                  </div>
                </div>
                
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-blue-500/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                
                {/* Sparkle Icon on hover */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-4 h-4 bg-blue-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <Sparkles className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Title */}
              <h4 className="mt-1.5 text-xs font-medium text-gray-400 group-hover:text-white transition-colors line-clamp-1 leading-tight">
                {manga.title}
              </h4>
            </div>
          );
        })}
      </div>
      
      {/* Footer stats */}
      <div className="flex items-center justify-center gap-4 pt-2 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <Clock className="w-3 h-3 text-blue-400" />
          <span>Mis à jour quotidiennement</span>
        </div>
        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
        <div className="flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-blue-400" />
          <span>Dernières sorties</span>
        </div>
      </div>
    </div>
  );
}
