'use client';

import React, { JSX } from 'react';
import { BookOpen, Star, Crown, Heart, Zap, Moon } from 'lucide-react';
import { useState } from 'react';

interface ThematicCollectionsSectionProps {
  onSearch: (query: string) => void;
}

interface Collection {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  searchTerms: string[];
  count: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

const COLLECTIONS: Collection[] = [
  {
    id: 'romance-scolaire',
    name: 'Romance scolaire',
    description: 'Amour et lycée',
    icon: <Heart className="w-4 h-4" />,
    color: 'from-pink-500 to-rose-500',
    searchTerms: ['romance', 'school life'],
    count: 156,
    difficulty: 'beginner'
  },
  {
    id: 'action-intense',
    name: 'Action intense',
    description: 'Combats épiques',
    icon: <Zap className="w-4 h-4" />,
    color: 'from-red-500 to-orange-500',
    searchTerms: ['action', 'fighting'],
    count: 243,
    difficulty: 'intermediate'
  },
  {
    id: 'fantasy-medieval',
    name: 'Fantasy médiévale',
    description: 'Magie et dragons',
    icon: <Crown className="w-4 h-4" />,
    color: 'from-purple-500 to-indigo-500',
    searchTerms: ['fantasy', 'medieval'],
    count: 89,
    difficulty: 'intermediate'
  },
  {
    id: 'thriller-psychologique',
    name: 'Thriller psychologique',
    description: 'Suspense et mystère',
    icon: <Moon className="w-4 h-4" />,
    color: 'from-gray-600 to-slate-700',
    searchTerms: ['thriller', 'psychological'],
    count: 67,
    difficulty: 'advanced'
  },
  {
    id: 'slice-of-life',
    name: 'Tranches de vie',
    description: 'Quotidien réaliste',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'from-green-500 to-teal-500',
    searchTerms: ['slice of life', 'daily life'],
    count: 134,
    difficulty: 'beginner'
  },
  {
    id: 'top-rated',
    name: 'Les mieux notés',
    description: 'Qualité garantie',
    icon: <Star className="w-4 h-4" />,
    color: 'from-yellow-500 to-amber-500',
    searchTerms: ['top rated', 'best'],
    count: 50,
    difficulty: 'beginner'
  }
];

export default function ThematicCollectionsSection({ onSearch }: ThematicCollectionsSectionProps) {
  const [hoveredCollection, setHoveredCollection] = useState<string | null>(null);

  const getDifficultyColor = (difficulty?: 'beginner' | 'intermediate' | 'advanced') => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400';
      case 'intermediate': return 'text-yellow-400';
      case 'advanced': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getDifficultyText = (difficulty?: 'beginner' | 'intermediate' | 'advanced') => {
    switch (difficulty) {
      case 'beginner': return 'Débutant';
      case 'intermediate': return 'Intermédiaire';
      case 'advanced': return 'Avancé';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-semibold text-white">
            Collections thématiques
          </h3>
          <Star className="w-4 h-4 text-yellow-500" />
        </div>
        <p className="text-gray-400 text-sm">
          Des sélections soigneusement organisées par thème
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {COLLECTIONS.map((collection) => (
          <button
            key={collection.id}
            onClick={() => {
              // Recherche avec le premier terme de la collection
              onSearch(collection.searchTerms[0]);
            }}
            onMouseEnter={() => setHoveredCollection(collection.id)}
            onMouseLeave={() => setHoveredCollection(null)}
            className="group relative overflow-hidden p-4 rounded-xl bg-gray-800/60 border border-gray-700/30 hover:border-gray-600 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-left"
          >
            {/* Background Gradient */}
            <div 
              className={`absolute inset-0 bg-gradient-to-br ${collection.color} transition-opacity duration-300 ${
                hoveredCollection === collection.id ? 'opacity-10' : 'opacity-0'
              }`} 
            />
            
            {/* Content */}
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg bg-gradient-to-r ${collection.color} bg-opacity-20 group-hover:scale-110 transition-transform`}>
                  {collection.icon}
                </div>
                <div className="text-right">
                  <div className="text-xs font-bold text-white">
                    {collection.count}
                  </div>
                  <div className="text-xs text-gray-500">
                    titres
                  </div>
                </div>
              </div>
              
              {/* Title */}
              <h4 className="text-sm font-semibold text-white mb-1 group-hover:text-white transition-colors">
                {collection.name}
              </h4>
              
              {/* Description */}
              <p className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors mb-3">
                {collection.description}
              </p>
              
              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {collection.searchTerms.slice(0, 2).map((term) => (
                    <span 
                      key={term}
                      className="text-xs px-2 py-0.5 bg-gray-700/50 rounded-full text-gray-400"
                    >
                      {term}
                    </span>
                  ))}
                </div>
                
                {collection.difficulty && (
                  <div className={`text-xs font-medium ${getDifficultyColor(collection.difficulty)}`}>
                    {getDifficultyText(collection.difficulty)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Shine Effect */}
            <div 
              className={`absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-all duration-700 transform ${
                hoveredCollection === collection.id ? 'translate-x-full' : '-translate-x-full'
              }`}
              style={{ 
                transform: hoveredCollection === collection.id ? 'translateX(100%)' : 'translateX(-100%)',
                width: '200%'
              }}
            />
          </button>
        ))}
      </div>
      
      {/* Footer info */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Plus de 1000 mangas organisés en collections thématiques
        </p>
      </div>
    </div>
  );
}
