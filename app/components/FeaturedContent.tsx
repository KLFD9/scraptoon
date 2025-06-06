'use client';

import { useState } from 'react';
import { Crown, Star, TrendingUp, Clock } from 'lucide-react';

interface FeaturedContentProps {
  onSearch: (query: string) => void;
}

const FEATURED_CATEGORIES = [
  {
    id: 'editors-choice',
    title: 'Choix de la rédaction',
    subtitle: 'Nos coups de cœur du moment',
    icon: Crown,
    color: 'from-yellow-500 to-orange-500',
    items: ['Solo Leveling', 'Tower of God', 'The God of High School', 'Noblesse']
  },
  {
    id: 'trending',
    title: 'Tendances',
    subtitle: 'Les plus populaires cette semaine',
    icon: TrendingUp,
    color: 'from-red-500 to-pink-500',
    items: ['One Piece', 'Attack on Titan', 'Demon Slayer', 'My Hero Academia']
  },
  {
    id: 'new-releases',
    title: 'Nouveautés',
    subtitle: 'Dernières sorties',
    icon: Clock,
    color: 'from-green-500 to-emerald-500',
    items: ['New manga', 'Latest manhwa', 'Recent webtoon', 'Fresh content']
  }
];

export default function FeaturedContent({ onSearch }: FeaturedContentProps) {
  const [activeCategory, setActiveCategory] = useState(FEATURED_CATEGORIES[0]);

  return (
    <div className="mb-12">
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Star className="w-6 h-6 text-yellow-400" />
          <h3 className="text-2xl font-bold text-white">
            Sélection du jour
          </h3>
        </div>
        <p className="text-gray-400">
          Découvrez nos recommandations personnalisées
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap justify-center gap-2 mb-8">
        {FEATURED_CATEGORIES.map((category) => {
          const IconComponent = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
                activeCategory.id === category.id
                  ? 'bg-white text-gray-900 shadow-lg'
                  : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <IconComponent className="w-4 h-4" />
              <span className="text-sm font-medium">{category.title}</span>
            </button>
          );
        })}
      </div>

      {/* Active Category Content */}
      <div className="relative">
        <div className={`p-8 rounded-2xl bg-gradient-to-br ${activeCategory.color}/10 border border-gray-700 backdrop-blur-sm`}>
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <activeCategory.icon className={`w-6 h-6 bg-gradient-to-r ${activeCategory.color} bg-clip-text text-transparent`} />
              <h4 className="text-xl font-semibold text-white">
                {activeCategory.title}
              </h4>
            </div>
            <p className="text-gray-400">
              {activeCategory.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activeCategory.items.map((item, index) => (
              <button
                key={item}
                onClick={() => onSearch(item)}
                className={`group p-4 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 ${
                  index === 0 ? 'md:col-span-2' : ''
                }`}
              >
                <div className={`w-full h-24 ${index === 0 ? 'md:h-32' : ''} bg-gradient-to-br ${activeCategory.color} rounded-lg mb-3 flex items-center justify-center group-hover:scale-105 transition-transform duration-300`}>
                  <span className="text-white font-bold text-lg">
                    {item.charAt(0)}
                  </span>
                </div>
                <h5 className="text-white font-medium text-sm group-hover:text-gray-200 transition-colors">
                  {item}
                </h5>
                {index === 0 && (
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <Crown className="w-3 h-3 text-yellow-400" />
                    <span className="text-xs text-yellow-400 font-medium">Recommandé</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
