'use client';

import { useState, useEffect } from 'react';
import { FavoriteManga, ReadingStatus } from '../types/manga';
import { Heart, BookOpen, BookX, CheckCircle, Edit3, Trash2, Filter, BarChart2, Search, Calendar, Clock, ArrowUpDown, Star, Info } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface FavoritesListProps {
  favorites: FavoriteManga[];
  onUpdateStatus: (mangaId: string, status: ReadingStatus) => void;
  onRemove: (mangaId: string) => void;
  onAddNote: (mangaId: string, note: string) => void;
}

export default function FavoritesList({
  favorites,
  onUpdateStatus,
  onRemove,
  onAddNote,
}: FavoritesListProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ReadingStatus>('to-read');
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'chapters' | 'lastUpdated'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [showInfo, setShowInfo] = useState<string | null>(null);

  const stats = {
    total: favorites.length,
    toRead: favorites.filter(m => m.readingStatus === 'to-read').length,
    reading: favorites.filter(m => m.readingStatus === 'reading').length,
    completed: favorites.filter(m => m.readingStatus === 'completed').length,
    french: favorites.filter(m => m.isAvailableInFrench).length,
    ongoing: favorites.filter(m => m.status === 'ongoing').length,
    withNotes: favorites.filter(m => m.notes && m.notes.length > 0).length
  };

  const sortManga = (a: FavoriteManga, b: FavoriteManga) => {
    const order = sortOrder === 'asc' ? 1 : -1;
    
    switch (sortBy) {
      case 'date':
        return (new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()) * order;
      case 'title':
        return a.title.localeCompare(b.title) * order;
      case 'chapters':
        return ((b.chapterCount?.total || 0) - (a.chapterCount?.total || 0)) * order;
      case 'lastUpdated':
        return (new Date(b.lastRead || 0).getTime() - new Date(a.lastRead || 0).getTime()) * order;
      default:
        return 0;
    }
  };

  const filteredFavorites = favorites
    .filter((manga) => {
      const matchesStatus = manga.readingStatus === activeTab;
      const matchesSearch = searchQuery 
        ? manga.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          manga.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (manga.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      return matchesStatus && matchesSearch;
    })
    .sort(sortManga);

  const handleNoteSubmit = (mangaId: string) => {
    onAddNote(mangaId, noteText);
    setEditingNote(null);
    setNoteText('');
  };

  const handleMangaClick = (mangaId: string, event: React.MouseEvent) => {
    // Empêcher la navigation si on clique sur un bouton ou un select
    const target = event.target as HTMLElement;
    if (
      target.tagName === 'BUTTON' ||
      target.tagName === 'SELECT' ||
      target.closest('button') ||
      target.closest('select')
    ) {
      return;
    }
    router.push(`/manga/${mangaId}`);
  };

  const tabs: { status: ReadingStatus; label: string; icon: any }[] = [
    { status: 'to-read', label: 'À lire', icon: BookOpen },
    { status: 'reading', label: 'En cours', icon: BookX },
    { status: 'completed', label: 'Terminé', icon: CheckCircle },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Statistiques</h2>
          </div>
          <div className="text-sm text-gray-500">
            Dernière mise à jour: {new Date().toLocaleDateString()}
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total</div>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.toRead}</div>
            <div className="text-sm text-blue-600 dark:text-blue-400">À lire</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.reading}</div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">En cours</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completed}</div>
            <div className="text-sm text-green-600 dark:text-green-400">Terminés</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.french}</div>
            <div className="text-sm text-purple-600 dark:text-purple-400">En français</div>
          </div>
          <div className="bg-orange-50 dark:bg-orange-900/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.ongoing}</div>
            <div className="text-sm text-orange-600 dark:text-orange-400">En cours de publication</div>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/30 p-3 rounded-lg">
            <div className="text-2xl font-bold text-pink-600 dark:text-pink-400">{stats.withNotes}</div>
            <div className="text-sm text-pink-600 dark:text-pink-400">Avec notes</div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
            {tabs.map(({ status, label, icon: Icon }) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-all duration-300 ${
                  activeTab === status
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 scale-105'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                <span className="ml-1 text-sm text-gray-400">
                  ({favorites.filter((m) => m.readingStatus === status).length})
                </span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-grow max-w-xs">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher titre, auteur, notes..."
                className="w-full pl-9 pr-4 py-1.5 text-sm border rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="text-sm border rounded-full px-3 py-1.5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="date">Date d&apos;ajout</option>
                <option value="title">Titre</option>
                <option value="chapters">Chapitres</option>
                <option value="lastUpdated">Dernière lecture</option>
              </select>
              <button
                onClick={() => setSortOrder(order => order === 'asc' ? 'desc' : 'asc')}
                className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowUpDown className={`w-4 h-4 text-gray-400 transform transition-transform duration-300 ${
                  sortOrder === 'desc' ? 'rotate-180' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {filteredFavorites.map((manga) => (
          <div
            key={manga.id}
            onClick={(e) => handleMangaClick(manga.id, e)}
            className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
          >
            <div className="relative">
              <div className="relative h-56 w-full">
                <Image
                  src={manga.cover}
                  alt={manga.title}
                  fill
                  className="object-cover transform transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="absolute top-2 left-2 flex flex-col gap-2">
                  <span className="bg-gray-800/90 text-white px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    {manga.type.toUpperCase()}
                  </span>
                  {manga.isAvailableInFrench && (
                    <span className="bg-blue-500/90 text-white px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                      FR
                    </span>
                  )}
                </div>

                <button
                  onClick={() => setShowInfo(showInfo === manga.id ? null : manga.id)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-md hover:scale-110 transition-transform duration-200 backdrop-blur-sm"
                >
                  <Info className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>

                {showInfo === manga.id && (
                  <div className="absolute inset-0 bg-black/80 p-4 text-white backdrop-blur-sm transition-opacity duration-300">
                    <h4 className="font-semibold mb-2">{manga.title}</h4>
                    <div className="text-sm space-y-2">
                      <p><span className="text-gray-400">Auteur:</span> {manga.author}</p>
                      <p><span className="text-gray-400">Ajouté le:</span> {new Date(manga.addedAt).toLocaleDateString()}</p>
                      <p><span className="text-gray-400">Chapitres:</span> {manga.chapterCount?.total || '?'}</p>
                      <p><span className="text-gray-400">Status:</span> {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}</p>
                    </div>
                  </div>
                )}

                <div className="absolute bottom-2 right-2 flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                    manga.chapterCount?.french > 0 
                      ? 'bg-blue-500/90 text-white'
                      : 'bg-gray-500/90 text-white'
                  }`}>
                    <BookOpen className="w-3 h-3 inline mr-1" />
                    {manga.chapterCount?.total || '?'} ch.
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                    manga.status === 'ongoing' 
                      ? 'bg-green-500/90 text-white' 
                      : 'bg-gray-500/90 text-white'
                  }`}>
                    {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
                  </span>
                </div>
              </div>

              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1 line-clamp-1">
                  {manga.title}
                </h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <select
                    value={manga.readingStatus}
                    onChange={(e) => onUpdateStatus(manga.id, e.target.value as ReadingStatus)}
                    className="text-xs border rounded-full px-2 py-1 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 transition-colors duration-200"
                  >
                    <option value="to-read">À lire</option>
                    <option value="reading">En cours</option>
                    <option value="completed">Terminé</option>
                  </select>
                  <button
                    onClick={() => onRemove(manga.id)}
                    className="p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/30 group/delete"
                  >
                    <Trash2 className="w-4 h-4 text-red-400 group-hover/delete:text-red-500 transition-colors duration-200" />
                  </button>
                </div>

                {editingNote === manga.id ? (
                  <div className="mt-1 space-y-2">
                    <textarea
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder="Ajouter une note..."
                      className="w-full p-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingNote(null)}
                        className="px-3 py-1 text-xs text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 transition-colors duration-200"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={() => handleNoteSubmit(manga.id)}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200"
                      >
                        Sauvegarder
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-1">
                    {manga.notes ? (
                      <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                        {manga.notes}
                      </p>
                    ) : null}
                    <button
                      onClick={() => {
                        setEditingNote(manga.id);
                        setNoteText(manga.notes || '');
                      }}
                      className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 transition-colors duration-200"
                    >
                      <Edit3 className="w-3 h-3" />
                      {manga.notes ? 'Modifier' : 'Ajouter une note'}
                    </button>
                  </div>
                )}

                {manga.lastRead && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    Lu le {new Date(manga.lastRead).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFavorites.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-md">
          <div className="text-gray-500 dark:text-gray-400">
            {searchQuery 
              ? 'Aucun manga ne correspond à votre recherche'
              : 'Aucun manga dans cette catégorie'}
          </div>
        </div>
      )}
    </div>
  );
} 