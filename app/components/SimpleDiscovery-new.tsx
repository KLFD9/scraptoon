'use client';

import { Sparkles, TrendingUp, Zap, Star, Globe, Heart, Crown, Target, BookOpen, Users } from 'lucide-react';
import TrendingSection from './TrendingSection';
import BestSellersSection from './BestSellersSection';
import GenreCard from './GenreCard';

interface SimpleDiscoveryProps {
  onSearch: (query: string) => void;
}

type TrendType = 'hot' | 'rising' | 'stable';

// Genres populaires avec niveaux de popularité et meilleurs visuels
const POPULAR_GENRES = [
  { name: 'Action', icon: '⚔️', color: 'from-red-500 to-orange-500', description: 'Combats épiques', popularity: 'high' as const },
  { name: 'Romance', icon: '💕', color: 'from-pink-500 to-rose-500', description: 'Histoires d\'amour', popularity: 'high' as const },
  { name: 'Fantasy', icon: '🏰', color: 'from-purple-500 to-indigo-500', description: 'Mondes magiques', popularity: 'high' as const },
  { name: 'Isekai', icon: '🚪', color: 'from-cyan-500 to-blue-500', description: 'Autre monde', popularity: 'high' as const },
  { name: 'School Life', icon: '🎓', color: 'from-blue-500 to-cyan-500', description: 'Vie scolaire', popularity: 'medium' as const },
  { name: 'Supernatural', icon: '👻', color: 'from-indigo-500 to-purple-500', description: 'Phénomènes étranges', popularity: 'medium' as const },
  { name: 'Comedy', icon: '😄', color: 'from-yellow-500 to-orange-500', description: 'Humour et rires', popularity: 'medium' as const },
  { name: 'Drama', icon: '🎭', color: 'from-gray-500 to-slate-500', description: 'Émotions fortes', popularity: 'medium' as const },
  { name: 'Horror', icon: '💀', color: 'from-red-600 to-black', description: 'Frissons garantis', popularity: 'low' as const },
  { name: 'Slice of Life', icon: '🌸', color: 'from-green-500 to-teal-500', description: 'Quotidien paisible', popularity: 'medium' as const },
  { name: 'Mystery', icon: '🔍', color: 'from-slate-600 to-gray-500', description: 'Enquêtes fascinantes', popularity: 'low' as const },
  { name: 'Sci-Fi', icon: '🚀', color: 'from-blue-600 to-purple-600', description: 'Futur et technologie', popularity: 'medium' as const }
];

// Styles et origines avec plus de détails et popularité
const ORIGIN_STYLES = [
  { name: 'Manhwa', flag: '🇰🇷', description: 'Corée du Sud', trend: 'rising' as TrendType },
  { name: 'Manga', flag: '🇯🇵', description: 'Japon', trend: 'stable' as TrendType },
  { name: 'Manhua', flag: '🇨🇳', description: 'Chine', trend: 'rising' as TrendType },
  { name: 'Webtoon', flag: '🌐', description: 'Format vertical', trend: 'hot' as TrendType },
  { name: 'Shonen', flag: '⚡', description: 'Pour adolescents', trend: 'stable' as TrendType },
  { name: 'Seinen', flag: '🎯', description: 'Pour adultes', trend: 'stable' as TrendType },
  { name: 'Yaoi', flag: '💙', description: 'Romance BL', trend: 'rising' as TrendType },
  { name: 'Yuri', flag: '💗', description: 'Romance GL', trend: 'rising' as TrendType },
  { name: 'Josei', flag: '🌹', description: 'Pour femmes', trend: 'stable' as TrendType },
  { name: 'Shoujo', flag: '🌺', description: 'Pour filles', trend: 'stable' as TrendType }
];

export default function SimpleDiscovery({ onSearch }: SimpleDiscoveryProps) {
  return (
    <div className="space-y-10">
      {/* Section Titre principal avec animation */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">
            Découvrez votre prochaine lecture
          </h2>
          <Sparkles className="w-5 h-5 text-purple-400" />
        </div>
        <p className="text-gray-400 text-sm max-w-md mx-auto">
          Explorez nos collections soigneusement sélectionnées
        </p>
      </div>

      {/* Trending Section avec vraies covers */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
          <TrendingSection onSearch={onSearch} />
        </div>
      </div>
      
      {/* Best Sellers Section avec style premium */}
      <div className="relative">
        <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-2xl blur-xl"></div>
        <div className="relative bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/30">
          <BestSellersSection onSearch={onSearch} />
        </div>
      </div>

      {/* Section découverte par catégories */}
      <div className="bg-gray-900/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700/20">
        {/* Vous ne savez pas quoi lire ? */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-medium text-white">
              Vous ne savez pas quoi lire ?
            </h3>
            <Target className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-gray-500 text-sm">
            Découvrez par genre, style ou origine
          </p>
        </div>

        {/* Genres populaires améliorés avec GenreCard */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Crown className="w-5 h-5 text-yellow-500" />
            <h4 className="text-base font-semibold text-white">
              Genres populaires
            </h4>
            <div className="flex items-center gap-1 ml-auto">
              <Users className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Les plus lus</span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {POPULAR_GENRES.map((genre) => (
              <GenreCard
                key={genre.name}
                name={genre.name}
                icon={genre.icon}
                color={genre.color}
                description={genre.description}
                onClick={() => onSearch(genre.name)}
              />
            ))}
          </div>
        </div>

        {/* Styles & Origines améliorés */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Globe className="w-5 h-5 text-emerald-500" />
            <h4 className="text-base font-semibold text-white">
              Styles & Origines
            </h4>
            <div className="flex items-center gap-1 ml-auto">
              <TrendingUp className="w-3 h-3 text-gray-500" />
              <span className="text-xs text-gray-500">Tendances</span>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 gap-3">
            {ORIGIN_STYLES.map((style) => {
              const trendColors: Record<TrendType, string> = {
                hot: 'border-red-500/50 bg-red-500/5',
                rising: 'border-green-500/50 bg-green-500/5',
                stable: 'border-gray-600/50 bg-gray-800/50'
              };
              
              const trendIcons: Record<TrendType, string> = {
                hot: '🔥',
                rising: '📈',
                stable: '📊'
              };

              return (
                <button
                  key={style.name}
                  onClick={() => onSearch(style.name)}
                  className={`group relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 ${trendColors[style.trend]} hover:border-emerald-500/50`}
                >
                  {/* Trend indicator */}
                  <div className="absolute top-2 right-2 text-xs opacity-60">
                    {trendIcons[style.trend]}
                  </div>
                  
                  <span className="text-2xl group-hover:scale-110 transition-transform duration-200">
                    {style.flag}
                  </span>
                  <div className="text-center">
                    <h5 className="text-sm font-medium text-gray-300 group-hover:text-white transition-colors">
                      {style.name}
                    </h5>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors">
                      {style.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
