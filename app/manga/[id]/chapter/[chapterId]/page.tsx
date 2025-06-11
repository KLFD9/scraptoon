'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { retry } from '@/app/utils/retry';
import { ArrowLeft, ChevronLeft, ChevronRight, List, Settings } from 'lucide-react';
import ChapterReader from '@/app/components/ChapterReader';
import ChapterPageSkeleton from '@/app/components/ChapterPageSkeleton'; // Import the skeleton component
import { useChapterNavigation, Chapter as NavChapter } from '@/app/hooks/useChapterNavigation';
import { useReadingProgress } from '@/app/hooks/useReadingProgress';
import { logger } from '@/app/utils/logger';

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
  const lastScrollY = useRef(0);
  const [allChapters, setAllChapters] = useState<NavChapter[]>([]);
  const { prevChapterId, nextChapterId, currentLanguage } = useChapterNavigation(
    allChapters,
    chapterId,
    chapterData?.language // Utiliser la langue du chapitre actuel comme préférence
  );
  const { updateReadingProgress } = useReadingProgress();

  const updateHistoryCookie = (id: string) => {
    if (typeof document === 'undefined') return;
    try {
      const cookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('reading_history='));
      let history: string[] = [];
      if (cookie) {
        const value = decodeURIComponent(cookie.split('=')[1]);
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          history = parsed;
        }
      }
      const filtered = history.filter((h) => h !== id);
      const updated = [id, ...filtered].slice(0, 20);
      document.cookie = `reading_history=${encodeURIComponent(
        JSON.stringify(updated)
      )};path=/;max-age=${60 * 60 * 24 * 30}`;
    } catch {
      // ignore cookie errors
    }
  };

  useEffect(() => {
    const fetchChapterData = async () => {
      try {
        setError(null);
        setLoading(true); // Ensure loading is true at the start

        if (!mangaId || !chapterId) {
          throw new Error('ID du manga ou du chapitre manquant');
        }

        // Helper function to fetch and parse JSON with content type check
        const fetchAndParseJson = async (url: string, resourceName: string) => {
          const response = await retry(() => fetch(url), 3, 500);
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            if (!response.ok) {
              // Attempt to parse error from JSON if possible, otherwise use a generic message
              const errorDetail = data?.error || data?.message || `Erreur lors du chargement de ${resourceName}`;
              throw new Error(errorDetail);
            }
            return data;
          } else {
            const textResponse = await response.text(); // Get text for logging
            const logMessage = `Invalid content type received for ${resourceName}. URL: ${url}, Content-Type: ${contentType}, Status: ${response.status}. Response Snippet: ${textResponse.substring(0, 200)}`;
            logger.log('error', logMessage); // Removed third argument
            throw new Error(`Réponse inattendue du serveur (${response.status}) pour ${resourceName}. Attendu JSON, reçu ${contentType}.`);
          }
        };

        // Récupérer la liste des chapitres pour la navigation
        const chaptersData = await fetchAndParseJson(`/api/manga/${mangaId}/chapters?all=true`, 'liste des chapitres');
        if (chaptersData && chaptersData.chapters) {
          const chaptersWithLanguage = chaptersData.chapters.map((ch: any) => ({
            id: ch.id,
            title: ch.title,
            language: ch.language,
            chapter: ch.chapter
          }));
          setAllChapters(chaptersWithLanguage);
        }

        // Récupérer les données du chapitre
        const chapterDetailsData = await fetchAndParseJson(`/api/manga/${mangaId}/chapter/${chapterId}`, 'détails du chapitre');

        const pagesArray = Array.isArray(chapterDetailsData.pages)
          ? chapterDetailsData.pages
          : Array.isArray(chapterDetailsData.images)
          ? chapterDetailsData.images
          : null;

        if (!chapterDetailsData || !pagesArray) {
          throw new Error('Données du chapitre invalides');
        }

        setChapterData({
          ...chapterDetailsData,
          pages: pagesArray,
          pageCount: chapterDetailsData.pageCount ?? pagesArray.length,
        });

        // Mettre à jour la progression de lecture
        if (chapterDetailsData.mangaTitle && chapterDetailsData.chapter) {
          let coverUrl = chapterDetailsData.mangaCover;
          if (!coverUrl) {
            try {
              // This fetch is a fallback, less critical if it fails or returns non-JSON for some reason
              const mangaDetailsResponse = await retry(() => fetch(`/api/manga/${mangaId}`), 3, 500);
              if (mangaDetailsResponse.ok) {
                const mangaDetailsContentType = mangaDetailsResponse.headers.get('content-type');
                if (mangaDetailsContentType && mangaDetailsContentType.includes('application/json')) {
                  const mangaData = await mangaDetailsResponse.json();
                  coverUrl = mangaData.cover;
                } else {
                  logger.log('warning', 'Manga details for cover fallback did not return JSON', { mangaId });
                }
              }
            } catch (error) {
              logger.log('warning', 'Failed to fetch manga details for cover fallback', { mangaId, error: String(error) });
            }
          }

          updateReadingProgress(
            mangaId,
            chapterId,
            chapterDetailsData.chapter,
            chapterDetailsData.mangaTitle,
            coverUrl,
            chapterDetailsData.language
          );
          updateHistoryCookie(mangaId);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Une erreur est survenue';
        // Simplify logging to avoid LogData issues, include IDs in the message string itself
        const detailedMessage = `Error fetching chapter data for mangaId: ${mangaId}, chapterId: ${chapterId}. Error: ${message}`;
        logger.log('error', detailedMessage);
        setError(detailedMessage); // Set the more detailed message in error state as well
        setChapterData(null);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId && chapterId) {
      fetchChapterData();
    }
  }, [mangaId, chapterId, updateReadingProgress]); // Added updateReadingProgress to dependency array

  // Gérer l'affichage/masquage de l'en-tête au scroll
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const currentY = window.scrollY;
        if (currentY < lastScrollY.current) {
          setShowHeader(true);
        } else if (currentY > lastScrollY.current) {
          setShowHeader(false);
        }
        lastScrollY.current = currentY;
        ticking = false;
      });
    };

    const handleMouseMove = () => {
      setShowHeader(true);
    };

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const navigateToChapter = (targetChapterId: string) => {
    router.push(`/manga/${mangaId}/chapter/${targetChapterId}`);
  };

  const goBackToManga = () => {
    router.push(`/manga/${mangaId}`);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  if (loading) {
    return <ChapterPageSkeleton />;
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
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={goBackToManga}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
                title="Retour au manga"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              {/* Version mobile ultra-compacte */}
              <div className="flex flex-col">
                <div className="md:hidden">
                  <p className="text-sm font-medium">
                    Ch. {chapterData.chapter}
                  </p>
                </div>
                
                {/* Version desktop complète */}
                <div className="hidden md:block">
                  <h1 className="text-lg font-semibold">
                    {chapterData.mangaTitle}
                  </h1>
                  <p className="text-sm text-gray-300">
                    Chapitre {chapterData.chapter}
                    {chapterData.title && ` - ${chapterData.title}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
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
                onClick={goBackToManga}
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
      <div className={`${showHeader ? 'pt-14 md:pt-16' : 'pt-0'} transition-all duration-300`}>
        <ChapterReader
          pages={chapterData.pages}
          chapter={chapterData.chapter}
          mangaTitle={chapterData.mangaTitle}
          onPageChange={(page) => {
            // Optionnel : sauvegarder la progression de lecture silencieusement
            // Suppression du console.log pour éviter le spam dans la console
          }}
        />
      </div>
    </div>
  );
}

export default function ChapterReaderPage() {
  return (
    <Suspense fallback={<ChapterPageSkeleton />}>
      <ChapterReaderContent />
    </Suspense>
  );
}
