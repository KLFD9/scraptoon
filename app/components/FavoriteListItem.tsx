'use client';

import { useState } from 'react';
import { FavoriteManga, ReadingStatus } from '../types/manga';
import { BookOpen, MoreHorizontal, Trash2, Edit3, Play, Calendar } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { getLanguageFlag } from '../utils/language';

interface FavoriteListItemProps {
  manga: FavoriteManga;
  onRemove: (mangaId: string) => void;
  onUpdateStatus: (mangaId: string, status: ReadingStatus) => void;
  onAddNote: (mangaId: string, note: string) => void;
}

export default function FavoriteListItem({
  manga,
  onRemove,
  onUpdateStatus,
  onAddNote,
}: FavoriteListItemProps) {
  const router = useRouter();
  const { readingProgress } = useReadingProgress();
  const [activeMenu, setActiveMenu] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(manga.notes || '');

  // Vérifier s'il y a une progression de lecture pour ce manga
  const progress = readingProgress.find(p => p.mangaId === manga.id);

  const handleMangaClick = () => {
    router.push(`/manga/${manga.id}`);
  };

  const handleContinueReading = () => {
    if (progress) {
      router.push(`/manga/${manga.id}/chapter/${progress.chapterId}`);
    } else {
      router.push(`/manga/${manga.id}`);
    }
  };

  const handleNoteSubmit = () => {
    onAddNote(manga.id, noteText);
    setEditingNote(false);
  };

  const getStatusBadge = (status: ReadingStatus) => {
    const styles = {
      'reading': 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      'to-read': 'bg-gray-500/10 text-gray-400 border-gray-500/30',
      'completed': 'bg-green-500/10 text-green-400 border-green-500/30'
    };
    
    const labels = {
      'reading': 'En cours',
      'to-read': 'À lire',
      'completed': 'Terminé'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="group relative bg-gray-900/20 hover:bg-gray-900/40 rounded-lg py-2 px-3 border border-gray-800/30 hover:border-gray-700/50 transition-all duration-200">
      <div className="flex items-center gap-3">
        {/* Couverture - Très petite */}
        <div className="relative w-8 h-10 flex-shrink-0 cursor-pointer" onClick={handleMangaClick}>
          <Image
            src={manga.cover}
            alt={manga.title}
            fill
            className="object-cover rounded transition-transform duration-200 hover:scale-105"
            sizes="32px"
          />
        </div>

        {/* Informations principales - Ultra compactes */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0 pr-2">
              <h3 
                className="font-medium text-white text-sm line-clamp-1 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={handleMangaClick}
                title={manga.title}
              >
                {manga.title}
              </h3>
              
              <div className="flex items-center gap-2 mt-0.5">
                {manga.author && (
                  <span className="text-xs text-gray-500 line-clamp-1" title={manga.author}>
                    {manga.author}
                  </span>
                )}
                
                {manga.chapterCount?.total && (
                  <span className="text-xs text-gray-600">
                    • {manga.chapterCount.total} ch.
                  </span>
                )}
              </div>
            </div>

            {/* Actions compactes */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {manga.readingStatus && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  manga.readingStatus === 'reading' ? 'bg-blue-500/20 text-blue-400' :
                  manga.readingStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {manga.readingStatus === 'reading' ? '📖' : 
                   manga.readingStatus === 'completed' ? '✓' : '📚'}
                </span>
              )}
              
              {progress && (
                <button
                  onClick={handleContinueReading}
                  className="p-1 rounded bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors"
                  title="Continuer la lecture"
                >
                  <Play className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={() => setActiveMenu(!activeMenu)}
                className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800/50 transition-colors"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
              
              {/* Menu dropdown */}
              {activeMenu && (
                <div className="absolute top-full right-0 mt-1 w-40 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setEditingNote(true);
                        setActiveMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      {manga.notes ? 'Modifier note' : 'Ajouter note'}
                    </button>
                    
                    <div className="px-3 py-1.5">
                      <select
                        value={manga.readingStatus || 'to-read'}
                        onChange={(e) => {
                          onUpdateStatus(manga.id, e.target.value as ReadingStatus);
                          setActiveMenu(false);
                        }}
                        className="w-full text-xs bg-gray-800 border border-gray-600 rounded text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="to-read">À lire</option>
                        <option value="reading">En cours</option>
                        <option value="completed">Terminé</option>
                      </select>
                    </div>
                    
                    <button
                      onClick={() => {
                        onRemove(manga.id);
                        setActiveMenu(false);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                    >
                      <Trash2 className="w-3 h-3" />
                      Retirer
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal d'édition de note */}
      {editingNote && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm p-4 flex flex-col justify-center z-30 rounded-xl">
          <div className="space-y-3">
            <h4 className="text-white font-medium">Note personnelle</h4>
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Votre note personnelle..."
              className="w-full p-3 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditingNote(false);
                  setNoteText(manga.notes || '');
                }}
                className="px-3 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleNoteSubmit}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sauvegarder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clic en dehors pour fermer le menu */}
      {activeMenu && (
        <div 
          className="fixed inset-0 z-10" 
          onClick={() => setActiveMenu(false)}
        />
      )}
    </div>
  );
}
