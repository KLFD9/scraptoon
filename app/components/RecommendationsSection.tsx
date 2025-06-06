'use client';

import { Heart, Zap, Target, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useFavorites } from '../hooks/useFavorites';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';
import DemoMangaCover from './DemoMangaCover';

interface RecommendationsSectionProps {
  onSearch: (query: string) => void;
}

interface RecommendedManga {
  id: string;
  title: string;
  cover: string;
  reason: string;
  matchScore: number;
}

const DEFAULT_COVER = '/images/default-cover.svg';

// Mock des recommandations (à remplacer par une vraie logique de recommandation)
const MOCK_RECOMMENDATIONS: RecommendedManga[] = [
  { id: '1', title: 'Attack on Titan', cover: DEFAULT_COVER, reason: 'Action, Drama', matchScore: 95 },
  { id: '2', title: 'Demon Slayer', cover: DEFAULT_COVER, reason: 'Supernatural', matchScore: 92 },
  { id: '3', title: 'My Hero Academia', cover: DEFAULT_COVER, reason: 'School Life, Action', matchScore: 88 },
  { id: '4', title: 'One Piece', cover: DEFAULT_COVER, reason: 'Adventure', matchScore: 85 },
  { id: '5', title: 'Jujutsu Kaisen', cover: DEFAULT_COVER, reason: 'Supernatural, Action', matchScore: 90 },
  { id: '6', title: 'Chainsaw Man', cover: DEFAULT_COVER, reason: 'Horror, Action', matchScore: 87 }
];

export default function RecommendationsSection({ onSearch }: RecommendationsSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendedManga[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { favorites } = useFavorites();

  useEffect(() => {
    const loadRecommendations = async () => {
      try {
        setLoading(true);
        // Simule une analyse des favoris pour générer des recommandations
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Si l'utilisateur a des favoris, on adapte les recommandations
        if (favorites.length > 0) {
          setRecommendations(MOCK_RECOMMENDATIONS.slice(0, 6));
        } else {
          // Recommandations génériques pour nouveaux utilisateurs
          setRecommendations(MOCK_RECOMMENDATIONS.slice(0, 4));
        }
      } catch (err) {
        setError('Impossible de charger les recommandations');
      } finally {
        setLoading(false);
      }
    };

    loadRecommendations();
  }, [favorites]);

  const refetch = () => {
    setError(null);
    setLoading(true);
    setTimeout(() => {
      setRecommendations(MOCK_RECOMMENDATIONS);
      setLoading(false);
    }, 500);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Pour vous</h3>
          <LoadingSpinner size="sm" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg animate-pulse"></div>
              <div className="h-3 bg-gray-800 rounded animate-pulse"></div>
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
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Pour vous</h3>
        </div>
        <ErrorMessage 
          message="Impossible de charger les recommandations" 
          onRetry={refetch}
          variant="card"
        />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-400" />
          <h3 className="text-base font-semibold text-white">Pour vous</h3>
        </div>
        <div className="text-center py-8 border-2 border-dashed border-gray-700 rounded-xl">
          <User className="w-8 h-8 text-gray-500 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">
            Ajoutez des mangas à vos favoris pour recevoir des recommandations personnalisées
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-purple-400" />
        <h3 className="text-base font-semibold text-white">
          Pour vous
        </h3>
        <div className="flex items-center gap-1 ml-auto">
          <span className="text-xs text-gray-500 bg-gradient-to-r from-purple-500/10 to-pink-500/10 px-2 py-0.5 rounded-full border border-purple-500/20">
            🎯 Personnalisé
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {recommendations.map((manga, index) => {
          const matchLevel = manga.matchScore >= 90 ? 'excellent' : manga.matchScore >= 85 ? 'good' : 'decent';
          const matchColor = {
            excellent: 'from-green-500 to-emerald-500',
            good: 'from-blue-500 to-cyan-500', 
            decent: 'from-gray-500 to-gray-600'
          };
          
          return (
            <div 
              key={manga.id} 
              className="group cursor-pointer" 
              onClick={() => onSearch(manga.title)}
            >
              {/* Cover */}              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-purple-500/50 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10">
                <DemoMangaCover
                  title={manga.title}
                  className="transition-transform group-hover:scale-105"
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16.66vw"
                />
                
                {/* Match Score Badge */}
                <div className="absolute top-2 left-2">
                  <div className={`px-2 py-1 bg-gradient-to-r ${matchColor[matchLevel]} rounded-full text-xs font-bold text-white shadow-lg`}>
                    {manga.matchScore}%
                  </div>
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-purple-500/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                
                {/* Heart Icon on hover */}
                <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="w-6 h-6 bg-purple-500/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg">
                    <Heart className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              
              {/* Info */}
              <div className="mt-2 space-y-1">
                <h4 className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors line-clamp-2 leading-tight">
                  {manga.title}
                </h4>
                <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                  {manga.reason}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Footer message */}
      <div className="text-center pt-2">
        <p className="text-xs text-gray-500">
          {favorites.length > 0 
            ? `Basé sur vos ${favorites.length} favoris et votre historique de lecture`
            : 'Recommandations populaires pour débuter'
          }
        </p>
      </div>
    </div>
  );
}
