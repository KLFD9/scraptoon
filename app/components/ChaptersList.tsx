'use client';

import Link from 'next/link';

import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';


interface Chapter {
  id: string;
  chapter: string;
  title: string | null;
  publishedAt: string | null;
  url: string;
  source: string;
  language?: string; // Code langue ISO (fr, en, ja, etc.)
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  itemsPerPage: number;
  totalItems: number;
}

interface Source {
  name: string;
  url: string;
  titleNo: string;
}

interface ChaptersResponse {
  chapters: Chapter[];
  pagination: Pagination;
  source: Source;
  error?: string;
}

interface ChaptersListProps {
  mangaId: string;
}

type SortOption = 'newest' | 'oldest' | 'chapter-asc' | 'chapter-desc';

// Fonction pour obtenir le drapeau à partir du code langue
function getLanguageFlag(languageCode?: string): string {
  if (!languageCode) return '🌐'; // Drapeau générique si pas de langue
  
  const flags: Record<string, string> = {
    'fr': '🇫🇷',
    'en': '🇺🇸',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'es': '🇪🇸',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ru': '🇷🇺',
    'ar': '🇸🇦',
    'tr': '🇹🇷',
    'th': '🇹🇭',
    'vi': '🇻🇳',
    'id': '🇮🇩',
    'ms': '🇲🇾',
    'tl': '🇵🇭',
    'hi': '🇮🇳',
  };
  
  return flags[languageCode.toLowerCase()] || '🌐';
}

// Fonction pour obtenir le nom de la langue
function getLanguageName(languageCode?: string): string {
  if (!languageCode) return 'Inconnu';
  
  const names: Record<string, string> = {
    'fr': 'Français',
    'en': 'English',
    'ja': '日本語',
    'ko': '한국어',
    'zh': '中文',
    'es': 'Español',
    'de': 'Deutsch',
    'it': 'Italiano',
    'pt': 'Português',
    'ru': 'Русский',
    'ar': 'العربية',
    'tr': 'Türkçe',
    'th': 'ไทย',
    'vi': 'Tiếng Việt',
    'id': 'Bahasa Indonesia',
    'ms': 'Bahasa Malaysia',
    'tl': 'Filipino',
    'hi': 'हिन्दी',
  };
  
  return names[languageCode.toLowerCase()] || languageCode.toUpperCase();
}

export default function ChaptersList({ mangaId }: ChaptersListProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('chapter-asc');

  const fetchChapters = useCallback(async (page: number, sort?: SortOption) => {
    try {
      setIsLoading(true);
      const sortParam = sort || sortBy;
      const url = `/api/manga/${mangaId}/chapters?page=${page}&sort=${sortParam}`;
      const response = await fetch(url);
      const data: ChaptersResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des chapitres');
      }

      setChapters(data.chapters);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  }, [mangaId, sortBy]);

  useEffect(() => {
    fetchChapters(1);
  }, [mangaId, fetchChapters, sortBy]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchChapters(newPage);
    }
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    // Retourner à la page 1 lors du changement de tri
    fetchChapters(1, newSort);
  };

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* En-tête avec titre et options de tri */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-semibold text-white">
                Chapitres disponibles
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value as SortOption)}
                className="text-sm bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-colors"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="chapter-asc">Numéro ↑</option>
                <option value="chapter-desc">Numéro ↓</option>
              </select>
            </div>
          </div>
          {!isLoading && pagination && (
            <span className="text-sm text-gray-400 sm:ml-auto">
              {chapters.length} chapitres {pagination.totalItems > 0 && `sur ${pagination.totalItems} au total`}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-400">Aucun chapitre trouvé</p>
        </div>
      ) : (
        <div>
          {/* Liste des chapitres */}
          <div className="divide-y divide-gray-800">
            {chapters.map((chapter) => (
              <Link
                key={chapter.id}
                href={`/manga/${mangaId}/chapter/${chapter.id}`}
                className="block p-4 hover:bg-gray-800 transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-base font-medium text-white">
                        Chapitre {chapter.chapter}
                        {chapter.title && ` - ${chapter.title}`}
                      </h3>
                      {chapter.language && (
                        <span 
                          className="flex items-center gap-1 text-xs bg-gray-800 px-2 py-1 rounded"
                          title={getLanguageName(chapter.language)}
                        >
                          <span className="text-sm">{getLanguageFlag(chapter.language)}</span>
                          <span className="text-gray-400 uppercase">{chapter.language}</span>
                        </span>
                      )}
                    </div>
                    {chapter.publishedAt && (
                      <p className="text-sm text-gray-400 mt-1">
                        {new Date(chapter.publishedAt).toLocaleDateString('fr-FR')}
                      </p>
                    )}
                  </div>
                  <div className="text-gray-500 ml-4">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 p-4 border-t border-gray-800">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const totalPages = pagination.totalPages;
                    const current = pagination.currentPage;
                    
                    // Toujours afficher la première page
                    if (current > 3) {
                      pages.push(1);
                      if (current > 4) pages.push('...');
                    }
                    
                    // Pages autour de la page courante
                    for (let i = Math.max(1, current - 1); i <= Math.min(totalPages, current + 1); i++) {
                      pages.push(i);
                    }
                    
                    // Toujours afficher la dernière page
                    if (current < totalPages - 2) {
                      if (current < totalPages - 3) pages.push('...');
                      pages.push(totalPages);
                    }
                    
                    return pages.map((pageNum, index) => 
                      typeof pageNum === 'number' ? (
                        <button
                          key={index}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            pagination.currentPage === pageNum
                              ? 'bg-white text-gray-950'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ) : (
                        <span key={index} className="px-2 text-gray-500">
                          {pageNum}
                        </span>
                      )
                    );
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-400 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Sélecteur de page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">Aller à la page</span>
                <input
                  type="number"
                  min={1}
                  max={pagination.totalPages}
                  value={pagination.currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value);
                    if (page >= 1 && page <= pagination.totalPages) {
                      handlePageChange(page);
                    }
                  }}
                  className="w-16 px-2 py-1 text-sm bg-gray-800 border border-gray-700 rounded-lg text-gray-300 focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-gray-600 transition-colors"
                />
                <span className="text-sm text-gray-400">sur {pagination.totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}