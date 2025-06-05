'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Settings } from 'lucide-react';
import ChapterReader from '@/app/components/ChapterReader';
import { useChapterNavigation, Chapter as NavChapter } from '@/app/hooks/useChapterNavigation';

interface ChapterData {
  title: string;
  chapter: string;
  language: string;
  mangaTitle: string;
  pageCount: number;
  pages: string[];
  source: string;
  scrapingTime: string;
}


function ChapterReaderContent() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params.id as string;
  const chapterId = params.chapterId as string;
  
  const [chapterData, setChapterData] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [allChapters, setAllChapters] = useState<NavChapter[]>([]);
  const { prevChapterId, nextChapterId } = useChapterNavigation(
    allChapters,
    chapterId
  );

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setError(null);
        setLoading(true);

        if (!mangaId || !chapterId) {
          throw new Error('ID du manga ou du chapitre manquant');
        }

        // Récupérer la liste des chapitres pour la navigation
        const chaptersResponse = await fetch(`/api/manga/${mangaId}/chapters?page=1`);
        if (chaptersResponse.ok) {
          const chaptersData = await chaptersResponse.json();
          if (chaptersData.chapters) {
            setAllChapters(chaptersData.chapters);
          }
        }

        // Récupérer les données du chapitre
        const response = await fetch(`/api/manga/${mangaId}/chapter/${chapterId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du chargement du chapitre');
        }

        if (!data || !data.pages) {
          throw new Error('Données du chapitre invalides');
        }

        setChapterData(data);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        setChapterData(null);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId && chapterId) {
      fetchChapterData();
    }
  }, [mangaId, chapterId]);

  // Gérer l'affichage/masquage de l'en-tête au scroll
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      setShowHeader(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isFullscreen) {
          setShowHeader(false);
        }
      }, 3000);
    };

    const handleMouseMove = () => {
      setShowHeader(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (!isFullscreen) {
          setShowHeader(false);
        }
      }, 3000);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    // Masquer l'en-tête après 3 secondes
    timeoutId = setTimeout(() => {
      if (!isFullscreen) {
        setShowHeader(false);
      }
    }, 3000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(timeoutId);
    };
  }, [isFullscreen]);

  const navigateToChapter = (targetChapterId: string) => {
    router.push(`/manga/${mangaId}/chapter/${targetChapterId}`);
  };

  const goBackToManga = () => {
    router.push(`/manga/${mangaId}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement du chapitre...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Erreur
          </h1>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={goBackToManga}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour au manga
          </button>
        </div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Chapitre non trouvé
          </h1>
          <p className="text-gray-300 mb-4">
            Le chapitre que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <button
            onClick={goBackToManga}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour au manga
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* En-tête de navigation */}
      <div className={`fixed top-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goBackToManga}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Retour au manga"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold">
                  {chapterData.mangaTitle}
                </h1>
                <p className="text-sm text-gray-300">
                  Chapitre {chapterData.chapter}
                  {chapterData.title && ` - ${chapterData.title}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Navigation entre chapitres */}
              <button
                onClick={() => {
                  if (prevChapterId) {
                    navigateToChapter(prevChapterId);
                  }
                }}
                disabled={!prevChapterId}
                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Chapitre précédent"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                onClick={() => {
                  if (nextChapterId) {
                    navigateToChapter(nextChapterId);
                  }
                }}
                disabled={!nextChapterId}
                className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Chapitre suivant"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              {/* Boutons utilitaires */}
              <button
                onClick={() => {/* TODO: Implémenter la liste des chapitres */}}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Liste des chapitres"
              >
                <List className="w-5 h-5" />
              </button>
              
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Mode plein écran"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal avec le reader */}
      <div className={`${showHeader ? 'pt-16' : 'pt-0'} transition-all duration-300`}>
        <ChapterReader 
          pages={chapterData.pages}
          title={chapterData.title || ''}
          chapter={chapterData.chapter}
          mangaTitle={chapterData.mangaTitle}
          onPageChange={(page) => {
            // Optionnel : sauvegarder la progression de lecture
            console.log(`Page ${page} en cours de lecture`);
          }}
        />
      </div>

      {/* Barre de navigation inférieure */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-sm transition-transform duration-300 ${
        showHeader ? 'translate-y-0' : 'translate-y-full'
      }`}>          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-300">
                  {chapterData.pageCount} pages
                </span>
              </div>
              
              <div className="flex items-center gap-4">
                {prevChapterId && (
                  <button
                    onClick={() => navigateToChapter(prevChapterId)}
                    className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
                  >
                    Chapitre précédent
                  </button>
                )}

                {nextChapterId && (
                  <button
                    onClick={() => navigateToChapter(nextChapterId)}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors text-sm"
                  >
                    Chapitre suivant
                  </button>
                )}
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}

export default function ChapterReaderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Chargement du chapitre...</p>
        </div>
      </div>
    }>
      <ChapterReaderContent />
    </Suspense>
  );
}
