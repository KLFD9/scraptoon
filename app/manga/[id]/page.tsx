'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Manga } from '@/app/types/manga';
import Image from 'next/image';
import { BookOpen, Star, Users, ArrowLeft, BookmarkPlus, Play, Share2, QrCode, Bookmark } from 'lucide-react';
import { useFavorites } from '@/app/hooks/useFavorites';
import { useReadingProgress } from '@/app/hooks/useReadingProgress';
import Layout from '@/app/components/Layout';
import { extractShortSynopsis } from '@/app/components/SynopsisContent';
import ChaptersList from '@/app/components/ChaptersList';
import ChapterListSkeleton from '@/app/components/ChapterListSkeleton'; // Import the skeleton component
import { logger } from '@/app/utils/logger';

const DEFAULT_COVER = '/images/default-cover.svg';

function MangaContent() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params.id as string;
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstChapterId, setFirstChapterId] = useState<string | null>(null);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [readingButtonText, setReadingButtonText] = useState('Commencer la lecture');
  const [targetChapterId, setTargetChapterId] = useState<string | null>(null);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const { readingProgress } = useReadingProgress();
  const [isInFavorites, setIsInFavorites] = useState(false);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        setError(null);
        setLoading(true);

        if (!mangaId) {
          throw new Error('ID du manga manquant');
        }

        const response = await fetch(`/api/manga/${mangaId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Erreur lors du chargement du manga');
        }

        if (!data) {
          throw new Error('Données du manga invalides');
        }

        setManga(data);
        setIsInFavorites(isFavorite(mangaId));
        
        // Récupérer tous les chapitres pour analyser la progression
        try {
          const chaptersResponse = await fetch(`/api/manga/${mangaId}/chapters?all=true`);
          const chaptersData = await chaptersResponse.json();
          if (chaptersResponse.ok && chaptersData.chapters && chaptersData.chapters.length > 0) {
            const chapters = chaptersData.chapters;
            setAllChapters(chapters);
            
            // Vérifier s'il y a une progression de lecture pour ce manga
            const currentProgress = readingProgress.find(p => p.mangaId === mangaId);
            
            // Trouver le premier chapitre (chapitre 1 ou le plus ancien)
            const sortedChapters = [...chapters].sort((a, b) => {
              // Essayer de trier par numéro de chapitre extrait du titre
              const aChapterText = a.chapter || '';
              const bChapterText = b.chapter || '';
              
              // Extraire les numéros de chapitre (gérer Episode 1, Chapitre 1, etc.)
              const aNum = parseFloat(aChapterText.replace(/[^\d.]/g, ''));
              const bNum = parseFloat(bChapterText.replace(/[^\d.]/g, ''));
              
              // Si on a des numéros valides, trier par numéro
              if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
              }
              
              // Fallback : trier par date de publication (plus ancien en premier)
              const aDate = new Date(a.publishedAt || '1970-01-01');
              const bDate = new Date(b.publishedAt || '1970-01-01');
              return aDate.getTime() - bDate.getTime();
            });
            
            const firstChapter = sortedChapters[0];
            
            if (firstChapter) {
              setFirstChapterId(firstChapter.id);
              
              if (currentProgress) {
                // L'utilisateur a déjà commencé ce manga
                setReadingButtonText(`Continuer chapitre ${currentProgress.chapterNumber}`);
                setTargetChapterId(currentProgress.chapterId);
              } else {
                // Nouveau manga : commencer au chapitre 1
                setTargetChapterId(firstChapter.id);
                setReadingButtonText('Commencer la lecture');
              }
            }
          }
        } catch (error) {
          logger.log('error', 'fetch chapters failed', { error: String(error) });
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Une erreur est survenue');
        setManga(null);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId) {
      fetchMangaDetails();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mangaId, readingProgress]);

  const handleFavoriteClick = () => {
    if (!manga) return;
    
    try {
      if (isInFavorites) {
        removeFromFavorites(manga.id);
      } else {
        addToFavorites(manga);
      }
      setIsInFavorites(!isInFavorites);
    } catch (error) {
      // Afficher une notification d'erreur si nécessaire
      logger.log('error', 'favorites management failed', { error: String(error) });
    }
  };

  const handleShare = async () => {
    if (!manga) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: manga.title,
          text: `Découvrez ${manga.title} sur MangaScraper`,
          url: window.location.href
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        // Afficher une notification de succès si nécessaire
      }
    } catch {
      // Ignorer les erreurs de partage (souvent dues à l'annulation par l'utilisateur)
    }
  };

  if (loading) {
    return <ChapterListSkeleton />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Erreur
          </h1>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white text-gray-950 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">
            Manga non trouvé
          </h1>
          <p className="text-gray-400 mb-4">
            Le manga que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-white text-gray-950 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Back button + Title */}
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => router.push('/')}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Retour à l'accueil"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <button 
                  onClick={() => router.push('/')}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-gray-950" />
                  </div>
                  <h1 className="text-lg font-semibold text-white truncate max-w-xs sm:max-w-md">
                    "{manga.title}"
                  </h1>
                </button>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleShare}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  title="Partager"
                >
                  <Share2 className="w-5 h-5 text-gray-400 hover:text-white" />
                </button>
                <button
                  onClick={handleFavoriteClick}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    isInFavorites 
                      ? 'bg-white text-gray-950' 
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">{isInFavorites ? 'Retiré' : 'Favoris'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-6">
            {/* Cover Image */}
            <div className="lg:col-span-1">
              <div className="relative aspect-[3/4] w-full max-w-sm mx-auto lg:max-w-none">
                <Image
                  src={manga.cover || DEFAULT_COVER}
                  alt={manga.title}
                  fill
                  className="object-cover rounded-lg"
                  priority
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COVER;
                  }}
                />
              </div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-tight">
                  {manga.title}
                </h1>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {manga.isAvailableInFrench && (
                    <span className="bg-white text-gray-950 px-2.5 py-1 rounded-md text-sm font-medium">
                      FR
                    </span>
                  )}
                  <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md text-sm">
                    {manga.type.toUpperCase()}
                  </span>
                  <span className={`px-2.5 py-1 rounded-md text-sm ${
                    manga.status === 'ongoing' 
                      ? 'bg-green-900/30 text-green-400' 
                      : 'bg-gray-800 text-gray-400'
                  }`}>
                    {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
                  </span>
                  <span className="bg-gray-800 text-gray-300 px-2.5 py-1 rounded-md text-sm">
                    {manga.chapterCount?.total || '?'} chapitres
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-300 leading-relaxed mb-5 text-sm sm:text-base">
                  {extractShortSynopsis(manga.description)}
                </p>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {manga.author && (
                    <div>
                      <span className="text-gray-500 block">Auteur</span>
                      <p className="text-white font-medium">{manga.author}</p>
                    </div>
                  )}
                  {manga.year && (
                    <div>
                      <span className="text-gray-500 block">Année</span>
                      <p className="text-white font-medium">{manga.year}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="space-y-3">
                <button
                  className="w-full sm:w-auto px-6 py-2.5 bg-white text-gray-950 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    if (targetChapterId) {
                      router.push(`/manga/${mangaId}/chapter/${targetChapterId}`);
                    }
                  }}
                  disabled={!targetChapterId}
                >
                  <Play className="w-4 h-4" />
                  {targetChapterId ? readingButtonText : 'Chapitres non disponibles'}
                </button>
                
                {/* Bouton "Recommencer" si l'utilisateur a déjà une progression */}
                {readingProgress.find(p => p.mangaId === mangaId) && firstChapterId && firstChapterId !== targetChapterId && (
                  <button
                    className="w-full sm:w-auto px-4 py-2 border border-gray-600 text-gray-300 rounded-lg font-medium hover:bg-gray-800 hover:text-white transition-colors flex items-center justify-center gap-2"
                    onClick={() => {
                      if (firstChapterId) {
                        router.push(`/manga/${mangaId}/chapter/${firstChapterId}`);
                      }
                    }}
                  >
                    Recommencer depuis le début
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-1">
              Chapitres
            </h2>
            <p className="text-gray-400 text-sm">
              {manga.chapterCount?.total || '?'} chapitre{(manga.chapterCount?.total || 0) > 1 ? 's' : ''} disponible{(manga.chapterCount?.total || 0) > 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            <ChaptersList mangaId={mangaId} />
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default function MangaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <MangaContent />
    </Suspense>
  );
}