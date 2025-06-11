'use client';

import React, { JSX, useState } from 'react';
import { BookOpen, Star, Crown, Heart, Zap, Moon, TrendingUp, BarChart3, RefreshCw, Sparkles } from 'lucide-react';
import { useCollections } from '@/app/hooks/useCollections';
import Link from 'next/link';

interface ThematicCollectionsSectionProps {
  onSearch: (query: string) => void;
}

interface ThematicCollectionsSectionProps {
  onSearch: (query: string) => void;
}

// Mappage des icônes pour chaque collection
const COLLECTION_ICONS: Record<string, JSX.Element> = {
  'romance-scolaire': <Heart className="w-4 h-4" />,
  'action-intense': <Zap className="w-4 h-4" />,
  'fantasy-medieval': <Crown className="w-4 h-4" />,
  'thriller-psychologique': <Moon className="w-4 h-4" />,
  'slice-of-life': <BookOpen className="w-4 h-4" />,
  'top-rated': <Star className="w-4 h-4" />,
};

export default function ThematicCollectionsSection({ onSearch }: ThematicCollectionsSectionProps) {
  const { collections, loading, error, trendingCollections, refreshCollections } = useCollections();
  const [showStats, setShowStats] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshCollections();
    setRefreshing(false);
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-700 rounded animate-pulse"></div>
            <div className="h-5 bg-gray-700 rounded w-40 animate-pulse"></div>
          </div>
          <div className="w-8 h-8 bg-gray-700 rounded animate-pulse"></div>
        </div>

        {/* Grid skeleton */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-gray-800 bg-gray-950/50 animate-pulse">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="w-4 h-4 bg-gray-700 rounded"></div>
                  <div className="w-8 h-3 bg-gray-700 rounded"></div>
                </div>
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2 hidden sm:block"></div>
              </div>
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
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h3 className="text-lg font-medium text-white">Collections thématiques</h3>
        </div>
        <div className="text-center py-8 bg-gray-900/50 rounded-lg border border-gray-800">
          <p className="text-red-400 text-sm mb-2">Erreur de chargement</p>
          <p className="text-gray-500 text-xs mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header amélioré avec statistiques */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-gray-400" />
          <h3 className="text-lg font-medium text-white">Collections thématiques</h3>
          {trendingCollections.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
              <TrendingUp className="w-3 h-3 text-orange-400" />
              <span className="text-xs text-orange-400 font-medium">
                {trendingCollections.length} en tendance
              </span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white"
            title="Afficher les statistiques"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`p-1.5 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 hover:text-white ${
              refreshing ? 'animate-spin' : ''
            }`}
            title="Actualiser"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Statistiques globales (optionnel) */}
      {showStats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 p-3 bg-gray-900/30 rounded-lg border border-gray-800/50">
          <div className="text-center">
            <div className="text-sm font-medium text-white">
              {formatNumber(collections.reduce((sum, c) => sum + c.count, 0))}
            </div>
            <div className="text-xs text-gray-500">Total mangas</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-white">{collections.length}</div>
            <div className="text-xs text-gray-500">Collections</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-orange-400">{trendingCollections.length}</div>
            <div className="text-xs text-gray-500">En tendance</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-green-400">
              {collections.reduce((sum, c) => sum + c.newCount, 0)}
            </div>
            <div className="text-xs text-gray-500">Nouveautés</div>
          </div>
        </div>
      )}

      {/* Grid des collections avec données dynamiques */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {collections.map((collection) => {
          const isTrending = trendingCollections.includes(collection.id);
          const icon = COLLECTION_ICONS[collection.id] || <BookOpen className="w-4 h-4" />;
          
          return (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="group relative block p-4 rounded-lg border border-gray-800 hover:border-gray-700 transition-all duration-200 text-left bg-gray-950/50 hover:bg-gray-900/50"
            >
              {/* Indicateur trending */}
              {isTrending && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full flex items-center justify-center">
                  <Sparkles className="w-2 h-2 text-white" />
                </div>
              )}
              
              {/* Content */}
              <div className="space-y-2">
                {/* Header avec icône et compteur */}
                <div className="flex items-center justify-between">
                  <div className={`text-gray-400 group-hover:text-white transition-colors ${
                    isTrending ? 'text-orange-400' : ''
                  }`}>
                    {icon}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">
                      {formatNumber(collection.count)}
                    </span>
                    {collection.newCount > 0 && (
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                    )}
                  </div>
                </div>
                
                {/* Titre */}
                <h4 className="text-sm font-medium text-white group-hover:text-gray-100 transition-colors line-clamp-1">
                  {collection.name}
                </h4>
                
                {/* Stats supplémentaires */}
                <div className="flex items-center justify-between text-xs">
                  {collection.avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-gray-500">{collection.avgRating.toFixed(1)}</span>
                    </div>
                  )}
                  {collection.newCount > 0 && (
                    <span className="text-green-400">+{collection.newCount}</span>
                  )}
                </div>
                
                {/* Genres (masqué sur mobile) */}
                {collection.genres.length > 0 && (
                  <div className="hidden lg:block">
                    <span className="text-xs text-gray-600">
                      #{collection.genres[0].toLowerCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Hover effect subtil */}
              <div className="absolute inset-0 rounded-lg border border-transparent group-hover:border-white/10 transition-colors pointer-events-none" />
            </Link>
          );
        })}
      </div>
      
      {/* Footer avec info */}
      <div className="text-center">
        <p className="text-xs text-gray-600">
          {formatNumber(collections.reduce((sum, c) => sum + c.count, 0))}+ titres organisés par thème
          {trendingCollections.length > 0 && (
            <span className="text-orange-400 ml-1">
              • {trendingCollections.length} collection{trendingCollections.length > 1 ? 's' : ''} en tendance
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
