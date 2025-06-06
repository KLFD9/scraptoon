'use client';

import { Crown, Award, Star } from 'lucide-react';
import Image from 'next/image';
import { useBestSellers } from '../hooks/useBestSellers';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

interface BestSellersSectionProps {
  onSearch: (query: string) => void;
}

const DEFAULT_COVER = '/images/default-cover.svg';

export default function BestSellersSection({ onSearch }: BestSellersSectionProps) {
  const { bestSellers, loading, error, refetch } = useBestSellers(8);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Crown className="w-4 h-4 text-yellow-500" />
          <h3 className="text-base font-medium text-white">Best-sellers</h3>
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
          <Crown className="w-4 h-4 text-yellow-500" />
          <h3 className="text-base font-medium text-white">Best-sellers</h3>
        </div>
        <ErrorMessage 
          message="Impossible de charger les best-sellers" 
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (bestSellers.length === 0) {
    return null;
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Crown className="w-5 h-5 text-yellow-500" />
        <h3 className="text-base font-semibold text-white">
          Best-sellers
        </h3>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
            ⭐ Incontournables
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {bestSellers.map((manga, index) => {
          const isTopThree = index < 3;
          const badgeColors = {
            0: 'from-yellow-500 to-amber-500', // Or
            1: 'from-gray-300 to-gray-400',    // Argent
            2: 'from-amber-600 to-orange-600'  // Bronze
          };
          
          return (
            <div 
              key={manga.id} 
              className="group cursor-pointer" 
              onClick={() => onSearch(manga.title)}
            >
              {/* Mini Cover */}
              <div className="relative aspect-[3/4] rounded-md overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-yellow-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-yellow-500/10">
                <Image
                  src={manga.cover}
                  alt={manga.title}
                  fill
                  className="object-cover transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 25vw, 12.5vw"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COVER;
                  }}
                />
                
                {/* Ranking Badge pour tous les items */}
                <div className="absolute top-1 left-1">
                  {isTopThree ? (
                    <div className={`w-6 h-6 bg-gradient-to-r ${badgeColors[index as keyof typeof badgeColors]} rounded-full flex items-center justify-center shadow-lg border border-white/20`}>
                      <span className="text-white text-xs font-bold">
                        {index + 1}
                      </span>
                    </div>
                  ) : (
                    <div className="w-5 h-5 bg-gray-800/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md border border-gray-600/50">
                      <span className="text-gray-300 text-xs font-medium">
                        {index + 1}
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Crown indicator pour le top 3 */}
                {isTopThree && (
                  <div className="absolute top-1 right-1">
                    <div className="w-4 h-4 bg-yellow-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                      <Crown className="w-2.5 h-2.5 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Hover Overlay avec dégradé sophistiqué */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                
                {/* Best Seller Badge on hover */}
                <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="px-1.5 py-0.5 bg-yellow-500/90 backdrop-blur-sm rounded text-xs font-bold text-white shadow-lg">
                    TOP
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
          <Crown className="w-3 h-3 text-yellow-500" />
          <span>Sélection premium</span>
        </div>
        <div className="w-1 h-1 bg-gray-600 rounded-full"></div>
        <div className="flex items-center gap-1">
          <Star className="w-3 h-3 text-yellow-500" />
          <span>Les mieux notés</span>
        </div>
      </div>
    </div>
  );
}
