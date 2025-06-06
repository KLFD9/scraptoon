'use client';

import { Zap, Star, Clock, BookOpen, TrendingUp, Shuffle } from 'lucide-react';

interface QuickActionsProps {
  onRandomSearch: () => void;
  onPopularSearch: () => void;
  onRecentSearch: () => void;
}

const QUICK_ACTIONS = [
  {
    id: 'random',
    name: 'Surprise-moi',
    description: 'Découverte aléatoire',
    icon: Shuffle,
    color: 'from-purple-500 to-pink-500',
    action: 'random'
  },
  {
    id: 'popular',
    name: 'Plus populaires',
    description: 'Titres tendances',
    icon: Star,
    color: 'from-yellow-500 to-orange-500',
    action: 'popular'
  },
  {
    id: 'recent',
    name: 'Nouveautés',
    description: 'Dernières sorties',
    icon: Clock,
    color: 'from-green-500 to-emerald-500',
    action: 'recent'
  }
];

const RANDOM_SEARCHES = [
  'One Piece', 'Naruto', 'Attack on Titan', 'Demon Slayer', 'My Hero Academia',
  'Tokyo Ghoul', 'Dragon Ball', 'Bleach', 'Death Note', 'Fullmetal Alchemist',
  'Solo Leveling', 'Tower of God', 'The God of High School', 'Noblesse',
  'Manhwa', 'Webtoon', 'Romance', 'Action', 'Fantasy', 'School Life'
];

const POPULAR_SEARCHES = [
  'Solo Leveling', 'One Piece', 'Attack on Titan', 'Demon Slayer',
  'Jujutsu Kaisen', 'Tower of God', 'Manhwa', 'Romance'
];

const RECENT_SEARCHES = [
  'New manga', 'Latest chapter', 'Recent release', 'New webtoon',
  'Latest manhwa', 'New series', 'Recent update'
];

export default function QuickActions({ onRandomSearch, onPopularSearch, onRecentSearch }: QuickActionsProps) {
  
  const handleAction = (action: string) => {
    switch (action) {
      case 'random':
        onRandomSearch();
        break;
      case 'popular':
        onPopularSearch();
        break;
      case 'recent':
        onRecentSearch();
        break;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">
          Actions rapides
        </h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_ACTIONS.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              onClick={() => handleAction(action.action)}
              className="group relative p-6 rounded-xl bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              {/* Gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              {/* Content */}
              <div className="relative z-10 text-center">
                <div className={`w-16 h-16 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-white mb-2">{action.name}</h4>
                <p className="text-gray-400 text-sm">{action.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Export des fonctions utilitaires pour les recherches
export const getRandomSearch = () => {
  return RANDOM_SEARCHES[Math.floor(Math.random() * RANDOM_SEARCHES.length)];
};

export const getPopularSearch = () => {
  return POPULAR_SEARCHES[Math.floor(Math.random() * POPULAR_SEARCHES.length)];
};

export const getRecentSearch = () => {
  return RECENT_SEARCHES[Math.floor(Math.random() * RECENT_SEARCHES.length)];
};
