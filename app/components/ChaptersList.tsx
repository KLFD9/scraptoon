'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface Chapter {
  id: string;
  chapter: string;
  title: string | null;
  publishedAt: string | null;
  url: string;
  source: string;
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

export default function ChaptersList({ mangaId }: ChaptersListProps) {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [source, setSource] = useState<Source | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  const fetchChapters = async (page: number) => {
    try {
      setIsLoading(true);
      const url = `/api/manga/${mangaId}/chapters?page=${page}`;
      const response = await fetch(url);
      const data: ChaptersResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la récupération des chapitres');
      }

      setChapters(data.chapters);
      setPagination(data.pagination);
      setSource(data.source);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChapters(1);
  }, [mangaId]);

  const handlePageChange = (newPage: number) => {
    if (pagination && newPage >= 1 && newPage <= pagination.totalPages) {
      fetchChapters(newPage);
    }
  };

  const sortChapters = (chapters: Chapter[]) => {
    const sorted = [...chapters];
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateB - dateA;
        });
      case 'oldest':
        return sorted.sort((a, b) => {
          const dateA = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const dateB = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
          return dateA - dateB;
        });
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
    <div className="space-y-4">
      {/* En-tête avec titre et options de tri */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                Chapitres disponibles
              </h2>
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
          {!isLoading && pagination && (
            <span className="text-sm text-gray-500 dark:text-gray-400 sm:ml-auto">
              {chapters.length} chapitres {pagination.totalItems > 0 && `sur ${pagination.totalItems} au total`}
            </span>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto"></div>
        </div>
      ) : chapters.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun chapitre trouvé
        </div>
      ) : (
        <div>
          {/* Liste des chapitres */}
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {sortChapters(chapters).map((chapter) => (
              <Link
                key={chapter.id}
                href={`/manga/${mangaId}/chapter/${chapter.id}`}
                className="block p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {chapter.chapter}
                      {chapter.title && ` - ${chapter.title}`}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {chapter.publishedAt}
                    </p>
                  </div>
                  <div className="text-sm text-gray-400">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col items-center justify-center gap-4 p-4 border-t border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPreviousPage}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="flex items-center space-x-1">
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
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
                          className={`w-8 h-8 rounded-full ${
                            pagination.currentPage === pageNum
                              ? 'bg-blue-500 text-white'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      ) : (
                        <span key={index} className="px-2">
                          {pageNum}
                        </span>
                      )
                    );
                  })()}
                </div>

                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Sélecteur de page */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Aller à la page</span>
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
                  className="w-16 px-2 py-1 text-sm bg-transparent border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">sur {pagination.totalPages}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 