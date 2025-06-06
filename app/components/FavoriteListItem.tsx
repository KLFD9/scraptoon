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
    <div className="group relative bg-gray-900/30 hover:bg-gray-900/50 rounded-xl p-4 border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300">
      <div className="flex items-center gap-4">
        {/* Couverture */}
        <div className="relative w-16 h-20 flex-shrink-0 cursor-pointer" onClick={handleMangaClick}>
          <Image
            src={manga.cover}
            alt={manga.title}
            fill
            className="object-cover rounded-lg transition-transform duration-300 hover:scale-105"
            sizes="64px"
          />
        </div>

        {/* Informations principales */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 
                className="font-semibold text-white text-base mb-1 line-clamp-1 cursor-pointer hover:text-blue-400 transition-colors"
                onClick={handleMangaClick}
              >
                {manga.title}
              </h3>
              
              {manga.author && (
                <p className="text-sm text-gray-400 line-clamp-1 mb-1">{manga.author}</p>
              )}

              <div className="flex items-center gap-3 flex-wrap">
                {/* Badge de statut */}
                {manga.readingStatus && getStatusBadge(manga.readingStatus)}
                
                {/* Info chapitres */}
                {manga.chapterCount?.total && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <BookOpen className="w-3 h-3" />
                    {manga.chapterCount.total} chapitre{manga.chapterCount.total > 1 ? 's' : ''}
                  </div>
                )}

                {/* Date d'ajout */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  Ajouté le {formatDate(manga.addedAt)}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Bouton continuer la lecture */}
              {progress && (
                <button
                  onClick={handleContinueReading}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-xs font-medium transition-colors"
                  title="Continuer la lecture"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Ch. {progress.chapterNumber}
                  {progress.language && (
                    <span className="ml-1">{getLanguageFlag(progress.language)}</span>
                  )}
                </button>
              )}

              {/* Menu options */}
              <div className="relative">
                <button
                  onClick={() => setActiveMenu(!activeMenu)}
                  className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                
                {activeMenu && (
                  <div className="absolute top-full right-0 mt-1 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          setEditingNote(true);
                          setActiveMenu(false);
                        }}
                        className="w-full px-3 py-2 text-sm text-left text-gray-300 hover:bg-gray-800 flex items-center gap-2"
                      >
                        <Edit3 className="w-4 h-4" />
                        {manga.notes ? 'Modifier la note' : 'Ajouter une note'}
                      </button>
                      
                      <div className="px-3 py-2">
                        <select
                          value={manga.readingStatus || 'to-read'}
                          onChange={(e) => {
                            onUpdateStatus(manga.id, e.target.value as ReadingStatus);
                            setActiveMenu(false);
                          }}
                          className="w-full text-sm bg-gray-800 border border-gray-600 rounded text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full px-3 py-2 text-sm text-left text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Retirer des favoris
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Note si présente */}
          {manga.notes && !editingNote && (
            <div className="bg-gray-800/30 rounded-lg p-3 mt-2">
              <p className="text-sm text-gray-400 italic">
                "{manga.notes}"
              </p>
            </div>
          )}

          {/* Progression de lecture si disponible */}
          {progress && (
            <div className="mt-2 text-xs text-gray-500">
              Dernière lecture : chapitre {progress.chapterNumber}
              {progress.language && ` (${progress.language.toUpperCase()})`}
              {' • '}
              {formatDate(progress.lastReadAt)}
            </div>
          )}
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
