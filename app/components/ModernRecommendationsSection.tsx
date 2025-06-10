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

// Utiliser une image par défaut qui existe dans le projet
const DEFAULT_COVER = '/images/manga-placeholder.svg';

export default function ModernRecommendationsSection({ onSearch }: ModernRecommendationsSectionProps) {
  const { recommendations, loading, error, refetch } = useRecommendations(5); // Limit to 5 items for a cleaner look
  const { favorites } = useFavorites();
  const [mounted, setMounted] = useState(false);

  // Debug console logs
  useEffect(() => {
    console.log('🎯 ModernRecommendationsSection mounted');
    console.log('📚 Recommendations:', recommendations);
    console.log('⏳ Loading:', loading);
    console.log('❌ Error:', error);
    console.log('💖 Favorites count:', favorites.length);
    setMounted(true);
  }, [recommendations, loading, error, favorites.length]);

  // Fonctionnalité pour forcer le rechargement (utile pour le debug)
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'R') {
        e.preventDefault();
        console.log('🔄 Rechargement forcé des recommandations...');
        refetch();
      }
    };
    
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [refetch]);

  if (!mounted) {
    console.log('⏸️ Component not mounted yet');
    return null;
  }
  
  console.log('🎨 Rendering recommendations section, items:', recommendations.length);
  
  // Show a loading state rather than nothing
  if (loading) {
    console.log('⏳ Affichage du state de chargement...');
    return (
      <section className="mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-violet-100 dark:bg-violet-950/30 p-1.5 rounded-md">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Recommendations pour vous
            </h2>
          </div>
          <span className="text-xs text-gray-500 animate-pulse">
            Chargement...
          </span>
        </div>
        
        <div className="grid grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-gray-800/50 rounded-md animate-pulse"></div>
              <div className="h-4 bg-gray-800/50 rounded-sm w-3/4 animate-pulse"></div>
              <div className="h-3 bg-gray-800/50 rounded-sm w-1/2 animate-pulse"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // If there's an error, show it and allow retry
  if (error) {
    console.log('❌ Affichage de l\'erreur:', error);
    return (
      <section className="mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-violet-100 dark:bg-violet-950/30 p-1.5 rounded-md">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Recommendations pour vous
            </h2>
          </div>
          <button 
            onClick={refetch}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Réessayer
          </button>
        </div>
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
          <p className="text-sm text-red-400">
            Erreur: {error}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Appuyez sur Ctrl+Shift+R pour recharger ou cliquez sur "Réessayer"
          </p>
        </div>
      </section>
    );
  }

  // If there are actually no recommendations after loading, show a message
  if (!recommendations.length) {
    console.log('📭 Aucune recommandation trouvée');
    return (
      <section className="mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="bg-violet-100 dark:bg-violet-950/30 p-1.5 rounded-md">
              <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            </div>
            <h2 className="text-sm font-medium text-gray-900 dark:text-white">
              Recommendations pour vous
            </h2>
          </div>
          <button 
            onClick={refetch}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            Actualiser
          </button>
        </div>
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
          <p className="text-sm text-blue-400">
            Aucune recommandation disponible pour le moment
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Ajoutez des mangas à vos favoris pour obtenir des recommandations personnalisées
          </p>
        </div>
      </section>
    );
  }

  console.log('✅ Affichage des recommandations:', recommendations.map(r => r.title));

  return (
    <section className="mt-8 mb-6">
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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
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
  const [imageError, setImageError] = useState(false);
  
  return (
    <div 
      className="group cursor-pointer space-y-2 transition-all" 
      onClick={onClick}
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        <Image
          src={imageError ? DEFAULT_COVER : (manga.cover || DEFAULT_COVER)}
          alt={manga.title}
          fill
          className="object-cover transition-all duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 33vw, 20vw"
          onError={() => {
            if (!imageError) {
              setImageError(true);
            }
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
