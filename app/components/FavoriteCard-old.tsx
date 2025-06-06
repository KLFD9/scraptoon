'use client';

import { useState } from 'react';
import { FavoriteManga, ReadingStatus } from '../types/manga';
import { BookOpen, MoreHorizontal, Trash2, Edit3, Play } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useReadingProgress } from '../hooks/useReadingProgress';
import { getLanguageFlag } from '../utils/language';

interface FavoriteCardProps {
  manga: FavoriteManga;
  onRemove: (mangaId: string) => void;
  onUpdateStatus: (mangaId: string, status: ReadingStatus) => void;
  onAddNote: (mangaId: string, note: string) => void;
}

export default function FavoriteCard({
  manga,
  onRemove,
  onUpdateStatus,
  onAddNote,
}: FavoriteCardProps) {
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

  return (
    <div className="group relative bg-gray-900/50 rounded-xl overflow-hidden border border-gray-800/50 hover:border-gray-700/50 transition-all duration-300 hover:transform hover:-translate-y-1 hover:shadow-xl hover:shadow-black/20">
      {/* Image de couverture */}
      <div className="relative aspect-[3/4] cursor-pointer" onClick={handleMangaClick}>
        <Image
          src={manga.cover}
          alt={manga.title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
        />
        
        {/* Overlay graduel au survol */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300" />
        
        {/* Badge de statut */}
        <div className="absolute top-3 left-3">
          {manga.readingStatus && getStatusBadge(manga.readingStatus)}
        </div>

        {/* Menu actions */}
        <div className="absolute top-3 right-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveMenu(!activeMenu);
            }}
            className="p-2 rounded-full bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-black/70"
          >
            <MoreHorizontal className="w-4 h-4 text-white" />
          </button>
          
          {/* Menu dropdown */}
          {activeMenu && (
            <div className="absolute top-full right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden">
              <div className="py-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
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
                    value={manga.readingStatus}
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
                  onClick={(e) => {
                    e.stopPropagation();
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

        {/* Bouton de lecture rapide */}
        {progress && (
          <div className="absolute bottom-3 right-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContinueReading();
              }}
              className="p-2 rounded-full bg-blue-600/90 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-blue-500 hover:scale-110"
              title="Continuer la lecture"
            >
              <Play className="w-4 h-4 text-white fill-white" />
            </button>
          </div>
        )}

        {/* Info chapitre lu */}
        {progress && (
          <div className="absolute bottom-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="flex items-center gap-1 px-2 py-1 bg-black/70 backdrop-blur-sm rounded-full text-xs text-white">
              <BookOpen className="w-3 h-3" />
              Ch. {progress.chapterNumber}
              {progress.language && (
                <span className="ml-1">{getLanguageFlag(progress.language)}</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Informations manga */}
      <div className="p-4">
        <h3 
          className="font-semibold text-white text-sm mb-2 line-clamp-2 cursor-pointer hover:text-blue-400 transition-colors leading-tight"
          onClick={handleMangaClick}
        >
          {manga.title}
        </h3>
        
        {manga.author && (
          <p className="text-xs text-gray-500 mb-2 line-clamp-1">{manga.author}</p>
        )}

        {/* Note si présente */}
        {manga.notes && !editingNote && (
          <div className="bg-gray-800/30 rounded-lg p-2 mb-2">
            <p className="text-xs text-gray-400 line-clamp-2 italic">
              "{manga.notes}"
            </p>
          </div>
        )}

        {/* Info nombre de chapitres */}
        {manga.chapterCount?.total && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <BookOpen className="w-3 h-3" />
            {manga.chapterCount.total} chapitre{manga.chapterCount.total > 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Modal d'édition de note */}
      {editingNote && (
        <div className="absolute inset-0 bg-gray-900/95 backdrop-blur-sm p-4 flex flex-col justify-center z-30 rounded-xl">
          <div className="space-y-3">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Votre note personnelle..."
              className="w-full p-3 text-sm bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows={4}
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
