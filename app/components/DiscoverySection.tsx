'use client';

import { useState } from 'react';
import { Sparkles, Heart, Swords, GraduationCap, Zap, Crown, Users, Gamepad2 } from 'lucide-react';

interface DiscoverySectionProps {
  onGenreSearch: (genre: string) => void;
  onTypeSearch: (type: string) => void;
}

const MANGA_TYPES = [
  { 
    id: 'manga', 
    name: 'Manga', 
    description: 'Japonais', 
    color: 'from-red-500 to-pink-500',
    examples: ['One Piece', 'Naruto', 'Attack on Titan']
  },
  { 
    id: 'manhwa', 
    name: 'Manhwa', 
    description: 'Coréen', 
    color: 'from-blue-500 to-cyan-500',
    examples: ['Solo Leveling', 'Tower of God', 'The God of High School']
  },
  { 
    id: 'webtoon', 
    name: 'Webtoon', 
    description: 'Format long', 
    color: 'from-green-500 to-emerald-500',
    examples: ['Lore Olympus', 'UnOrdinary', 'True Beauty']
  }
];

const GENRES = [
  { id: 'action', name: 'Action', icon: Swords, color: 'bg-red-500', searches: ['action', 'combat', 'battle'] },
  { id: 'romance', name: 'Romance', icon: Heart, color: 'bg-pink-500', searches: ['romance', 'love', 'romantic'] },
  { id: 'school', name: 'School Life', icon: GraduationCap, color: 'bg-blue-500', searches: ['school', 'student', 'academy'] },
  { id: 'fantasy', name: 'Fantasy', icon: Sparkles, color: 'bg-purple-500', searches: ['fantasy', 'magic', 'adventure'] },
  { id: 'supernatural', name: 'Supernatural', icon: Zap, color: 'bg-indigo-500', searches: ['supernatural', 'power', 'ability'] },
  { id: 'drama', name: 'Drama', icon: Users, color: 'bg-gray-500', searches: ['drama', 'slice of life', 'life'] },
  { id: 'historical', name: 'Historical', icon: Crown, color: 'bg-yellow-500', searches: ['historical', 'history', 'period'] },
  { id: 'gaming', name: 'Gaming', icon: Gamepad2, color: 'bg-green-500', searches: ['game', 'gaming', 'virtual'] }
];

const TRENDING_SUGGESTIONS = [
  'Solo Leveling',
  'One Piece', 
  'Attack on Titan',
  'Demon Slayer',
  'Jujutsu Kaisen',
  'Tower of God',
  'The God of High School',
  'Noblesse'
];

export default function DiscoverySection({ onGenreSearch, onTypeSearch }: DiscoverySectionProps) {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const handleGenreClick = (genre: any) => {
    const searchTerm = genre.searches[Math.floor(Math.random() * genre.searches.length)];
    onGenreSearch(searchTerm);
  };

  const handleTypeClick = (type: any) => {
    setSelectedType(type.id);
    onTypeSearch(type.name.toLowerCase());
  };

  return (
    <div className="space-y-12">
      {/* Section: Vous ne savez pas quoi lire ? */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Sparkles className="w-6 h-6 text-yellow-400" />
          <h2 className="text-2xl font-bold text-white">
            Vous ne savez pas quoi lire ?
          </h2>
        </div>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          Découvrez de nouveaux univers en explorant par type ou genre, ou laissez-vous guider par nos tendances
        </p>
      </div>

      {/* Types de contenus */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Crown className="w-5 h-5 text-yellow-400" />
          Choisissez votre style
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MANGA_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleTypeClick(type)}
              className={`p-6 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                selectedType === type.id 
                  ? 'border-white bg-gray-800/50' 
                  : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              <div className={`w-full h-32 bg-gradient-to-br ${type.color} rounded-lg mb-4 flex items-center justify-center`}>
                <span className="text-white text-2xl font-bold">{type.name[0]}</span>
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{type.name}</h4>
              <p className="text-gray-400 text-sm mb-3">{type.description}</p>
              <div className="text-xs text-gray-500">
                Exemples: {type.examples.slice(0, 2).join(', ')}...
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Genres populaires */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-400" />
          Explorer par genre
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {GENRES.map((genre) => {
            const IconComponent = genre.icon;
            return (
              <button
                key={genre.id}
                onClick={() => handleGenreClick(genre)}
                className="group p-4 rounded-lg bg-gray-800/50 border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:scale-105 hover:bg-gray-800"
              >
                <div className={`w-12 h-12 ${genre.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform duration-300`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <span className="text-white font-medium text-sm">{genre.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Tendances actuelles */}
      <section>
        <h3 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <Users className="w-5 h-5 text-green-400" />
          Tendances actuelles
        </h3>
        <div className="bg-gray-800/30 rounded-xl p-6 border border-gray-700">
          <p className="text-gray-400 mb-4 text-center">
            Les titres les plus recherchés cette semaine
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {TRENDING_SUGGESTIONS.map((title, index) => (
              <button
                key={title}
                onClick={() => onGenreSearch(title)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 hover:scale-105 ${
                  index < 3 
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white'
                }`}
              >
                {index < 3 && <span className="mr-1">🔥</span>}
                {title}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Call to action */}
      <div className="text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-8 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-3">
          Toujours pas trouvé ?
        </h3>
        <p className="text-gray-400 mb-4">
          Utilisez la barre de recherche pour trouver un titre spécifique
        </p>
        <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>Plus de 10,000 titres disponibles</span>
        </div>
      </div>
    </div>
  );
}
