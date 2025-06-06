'use client';

import { useState } from 'react';
import { useFavorites } from '@/app/hooks/useFavorites';
import { useReadingProgress } from '@/app/hooks/useReadingProgress';
import { Heart, Search, Grid3X3, List, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import FavoriteCard from '@/app/components/FavoriteCard';
import FavoriteListItem from '@/app/components/FavoriteListItem';

export default function FavoritesPage() {
  const { favorites, removeFromFavorites, updateReadingStatus, addNote } = useFavorites();
  const { readingProgress } = useReadingProgress();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'title' | 'status' | 'progress'>('recent');

  // Filtrage et tri
  const filteredAndSortedFavorites = favorites
    .filter((manga) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        manga.title.toLowerCase().includes(query) ||
        manga.author?.toLowerCase().includes(query)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'status':
          const statusOrder = { 'reading': 0, 'to-read': 1, 'completed': 2 } as const;
          const statusA = a.readingStatus || 'to-read';
          const statusB = b.readingStatus || 'to-read';
          return statusOrder[statusA] - statusOrder[statusB];
        case 'progress':
          const progressA = readingProgress.find(p => p.mangaId === a.id);
          const progressB = readingProgress.find(p => p.mangaId === b.id);
          const lastReadA = progressA?.lastReadAt ? new Date(progressA.lastReadAt).getTime() : 0;
          const lastReadB = progressB?.lastReadAt ? new Date(progressB.lastReadAt).getTime() : 0;
          return lastReadB - lastReadA;
        default:
          return 0;
      }
    });

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-20 h-20 rounded-full bg-gray-800/50 flex items-center justify-center mb-6">
        <Heart className="w-10 h-10 text-gray-600" />
      </div>
      <h2 className="text-2xl font-semibold text-white mb-3">Aucun favori</h2>
      <p className="text-gray-400 text-center max-w-md mb-8 leading-relaxed">
        Ajoutez des mangas à vos favoris pour les retrouver facilement et suivre votre progression de lecture.
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        Découvrir des mangas
      </Link>
    </div>
  );

  const NoResults = () => (
    <div className="text-center py-16">
      <p className="text-gray-400 text-lg">Aucun résultat pour &quot;{searchQuery}&quot;</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Navigation */}
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour</span>
              </Link>
              <div className="w-px h-6 bg-gray-800 hidden sm:block" />
              <h1 className="text-xl font-semibold text-white flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500" />
                Mes Favoris
                {favorites.length > 0 && (
                  <span className="text-sm font-normal text-gray-400">
                    ({favorites.length})
                  </span>
                )}
              </h1>
            </div>

            {/* Actions */}
            {favorites.length > 0 && (
              <div className="flex items-center gap-3">
                {/* Mode d'affichage */}
                <div className="flex items-center bg-gray-800/50 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {favorites.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            {/* Barre de recherche et tri */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Recherche */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Rechercher dans vos favoris..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>

              {/* Tri */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[180px]"
              >
                <option value="recent">Récemment ajoutés</option>
                <option value="progress">Dernière lecture</option>
                <option value="title">Nom (A-Z)</option>
                <option value="status">Statut de lecture</option>
              </select>
            </div>

            {/* Liste/Grille des favoris */}
            {filteredAndSortedFavorites.length === 0 ? (
              <NoResults />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-3">
                {filteredAndSortedFavorites.map((manga) => (
                  <FavoriteCard
                    key={manga.id}
                    manga={manga}
                    onRemove={removeFromFavorites}
                    onUpdateStatus={updateReadingStatus}
                    onAddNote={addNote}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-1">
                {filteredAndSortedFavorites.map((manga) => (
                  <FavoriteListItem
                    key={manga.id}
                    manga={manga}
                    onRemove={removeFromFavorites}
                    onUpdateStatus={updateReadingStatus}
                    onAddNote={addNote}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
