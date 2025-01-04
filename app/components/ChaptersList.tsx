'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink, Flag, Globe, ArrowUpDown, Calendar, Hash } from 'lucide-react';

interface Chapter {
  id: string;
  chapter: string;
  title: string | null;
  language: string;
  pages: number;
  publishedAt: string;
  readableAt: string;
  group: string;
  externalUrl: string;
}

interface ChaptersListProps {
  mangaId: string;
}

type SortOption = 'newest' | 'oldest' | 'chapter-asc' | 'chapter-desc';

export default function ChaptersList({ mangaId }: ChaptersListProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'fr' | 'en'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchChapters = async (page: number, lang?: string) => {
    try {
      setIsLoading(true);
      let url = `/api/manga/${mangaId}/chapters?page=${page}&limit=10`;
      if (lang && lang !== 'all') {
        url += `&language=${lang}`;
      }
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des chapitres');
      }

      setChapters(data.chapters);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters(1, selectedLanguage);
  }, [mangaId, selectedLanguage]);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchChapters(newPage, selectedLanguage);
    }
  };

  const handleLanguageChange = (lang: 'all' | 'fr' | 'en') => {
    setSelectedLanguage(lang);
    setCurrentPage(1);
  };

  const sortChapters = (chapters: Chapter[]) => {
    const sorted = [...chapters];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
      case 'oldest':
        return sorted.sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime());
      case 'chapter-asc':
        return sorted.sort((a, b) => parseFloat(a.chapter) - parseFloat(b.chapter));
      case 'chapter-desc':
        return sorted.sort((a, b) => parseFloat(b.chapter) - parseFloat(a.chapter));
      default:
        return sorted;
    }
  };

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div>
      {/* En-tête avec titre, compteur et options de tri */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Chapitres disponibles
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleLanguageChange('all')}
                  className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    selectedLanguage === 'all'
                      ? 'bg-gray-100 dark:bg-gray-700'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  title="Toutes les langues"
                >
                  <Globe className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleLanguageChange('fr')}
                  className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    selectedLanguage === 'fr'
                      ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  title="Français uniquement"
                >
                  <span className="font-semibold">FR</span>
                </button>
                <button
                  onClick={() => handleLanguageChange('en')}
                  className={`p-1.5 rounded-lg transition-colors duration-200 ${
                    selectedLanguage === 'en'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                  title="Anglais uniquement"
                >
                  <span className="font-semibold">EN</span>
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="text-sm bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="newest">Plus récents</option>
                <option value="oldest">Plus anciens</option>
                <option value="chapter-asc">Numéro ↑</option>
                <option value="chapter-desc">Numéro ↓</option>
              </select>
            </div>
          </div>
          <span className="text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
            {chapters.length} sur {totalPages * 10}
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
        </div>
      ) : (
        <div>
          {/* Liste des chapitres */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortChapters(chapters).map((chapter) => (
              <div
                key={chapter.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <span className="font-semibold min-w-[60px]">
                      Ch. {chapter.chapter}
                    </span>
                    {chapter.title && (
                      <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">
                        {chapter.title}
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      chapter.language === 'fr' 
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>
                      {chapter.language.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                    <span>{new Date(chapter.publishedAt).toLocaleDateString()}</span>
                    <a
                      href={chapter.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1 hover:text-blue-500 transition-colors duration-200"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center p-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNumber}
                      onClick={() => handlePageChange(pageNumber)}
                      className={`w-8 h-8 rounded-full ${
                        currentPage === pageNumber
                          ? 'bg-blue-500 text-white'
                          : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                      } transition-colors duration-200`}
                    >
                      {pageNumber}
                    </button>
                  );
                })}
                
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-1">...</span>
                    <button
                      onClick={() => handlePageChange(totalPages)}
                      className="w-8 h-8 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 