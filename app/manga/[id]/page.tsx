'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Manga } from '@/app/types/manga';
import Image from 'next/image';
import { BookOpen, Star, Users, ArrowLeft, BookmarkPlus, Play, Share2, QrCode, Bookmark } from 'lucide-react';
import { useFavorites } from '@/app/hooks/useFavorites';
import Layout from '@/app/components/Layout';
import { extractShortSynopsis } from '@/app/components/SynopsisContent';
import ChaptersList from '@/app/components/ChaptersList';
import { logger } from '@/app/utils/logger';

const DEFAULT_COVER = '/images/default-cover.jpg';

function MangaContent() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params.id as string;
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstChapterId, setFirstChapterId] = useState<string | null>(null);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
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
        
        // Récupérer le premier chapitre pour le bouton "Commencer la lecture"
        try {
          const chaptersResponse = await fetch(`/api/manga/${mangaId}/chapters?page=1`);
          const chaptersData = await chaptersResponse.json();
          if (chaptersResponse.ok && chaptersData.chapters && chaptersData.chapters.length > 0) {
            setFirstChapterId(chaptersData.chapters[0].id);
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
  }, [mangaId]);

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
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Erreur
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            Manga non trouvé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Le manga que vous recherchez n&apos;existe pas ou n&apos;est plus disponible.
          </p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Retour
          </button>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        {/* Header mobile */}
        <div className="lg:hidden bg-white dark:bg-gray-800 shadow-lg py-4">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
              </button>
              <button
                onClick={handleFavoriteClick}
                className={`p-2 rounded-full transition-colors ${
                  isInFavorites 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600'
                }`}
              >
                <BookmarkPlus className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Bannière avec image de couverture */}
        <div className="relative h-[30vh] md:h-[40vh] w-full">
          <div className="absolute inset-0">
            <Image
              src={manga.cover || DEFAULT_COVER}
              alt={manga.title}
              fill
              className="object-cover blur-sm brightness-50"
              priority
              onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                (e.target as HTMLImageElement).src = DEFAULT_COVER;
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-gray-900/30" />
          
          <div className="relative h-full container mx-auto px-4 flex items-end pb-8">
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 w-full">
              {/* Couverture */}
              <div className="relative w-32 sm:w-48 h-48 sm:h-72 shadow-xl rounded-lg overflow-hidden flex-shrink-0 -mt-16 sm:mt-0 mx-auto sm:mx-0">
                <Image
                  src={manga.cover || DEFAULT_COVER}
                  alt={manga.title}
                  fill
                  className="object-cover"
                  priority
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = DEFAULT_COVER;
                  }}
                />
              </div>
              
              {/* Informations principales */}
              <div className="flex-grow text-white pb-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-bold">{manga.title}</h1>
                  <div className="flex items-center gap-3">
                    <span className="text-sm px-3 py-1 bg-gray-700/50 rounded-full">
                      {manga.year}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${
                      manga.status === 'ongoing' 
                        ? 'bg-green-500/50' 
                        : 'bg-red-500/50'
                    }`}>
                      {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
                    </span>
                    <span className="text-sm px-3 py-1 bg-blue-500/50 rounded-full">
                      {manga.chapterCount?.total || '?'} chapitres
                    </span>
                  </div>
                </div>

                {/* Court synopsis */}
                <p className="text-sm text-gray-300 mb-4 line-clamp-2 sm:line-clamp-3 max-w-3xl">
                  {extractShortSynopsis(manga.description)}
                </p>
                
                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6 text-gray-300 mb-4">
                  {manga.author && (
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      <span>{manga.author}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <span>{manga.chapterCount?.total || '?'} chapitres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    <span>{manga.status === 'ongoing' ? 'En cours' : 'Terminé'}</span>
                  </div>
                </div>

                <div className="flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-3">
                  {manga.isAvailableInFrench && (
                    <span className="px-3 py-1 bg-blue-500 rounded-full text-sm font-semibold">
                      Disponible en français
                    </span>
                  )}
                  <span className="px-3 py-1 bg-gray-700 rounded-full text-sm font-semibold">
                    {manga.type.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="mb-6">
            <button 
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Retour</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
              {/* Liste des chapitres */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
                <ChaptersList mangaId={mangaId} />
              </div>
            </div>

            {/* Barre latérale */}
            <div className="space-y-4 sm:space-y-6">
              {/* Lecture et signets */}
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg w-72">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Lecture</h2>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {/* TODO: Implémenter les signets */}}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Ajouter un signet"
                      >
                        <BookmarkPlus className="w-4 h-4 text-gray-500" />
                      </button>
                      <button
                        onClick={handleShare}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                        title="Partager"
                      >
                        <Share2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {/* QR Code pour la reprise de lecture */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-500">Scanner pour continuer</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-4 rounded-lg flex items-center justify-center">
                      <div className="w-full aspect-square bg-gray-100 dark:bg-gray-600 rounded-lg flex items-center justify-center">
                        <span className="text-xs text-gray-500 dark:text-gray-400 text-center px-2">
                          QR Code pour reprendre la lecture
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Signets */}
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Signets</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {/* Liste des signets - placeholder pour le moment */}
                      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                        Aucun signet pour le moment
                      </div>
                      <button
                        className="w-full py-2 px-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200 flex items-center justify-center gap-2"
                        onClick={() => {/* TODO: Implémenter l'ajout de signet */}}
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        Ajouter un signet
                      </button>
                    </div>
                  </div>

                  {/* Bouton de lecture */}
                  <div className="p-4">
                    <button
                      className="w-full py-2.5 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => {
                        if (firstChapterId) {
                          router.push(`/manga/${mangaId}/chapter/${firstChapterId}`);
                        }
                      }}
                      disabled={!firstChapterId}
                    >
                      <Play className="w-4 h-4" />
                      {firstChapterId ? 'Commencer la lecture' : 'Chapitres non disponibles'}
                    </button>
                  </div>

                  {/* Catégories en format compact */}
                  <div className="p-4">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                      Informations
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Type :</span>
                        <span className="font-medium">{manga.type.toUpperCase()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Statut :</span>
                        <span className="font-medium">
                          {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
                        </span>
                      </div>
                      {manga.author && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Auteur :</span>
                          <span className="font-medium">{manga.author}</span>
                        </div>
                      )}
                      {manga.year && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Année :</span>
                          <span className="font-medium">{manga.year}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bande annonce - uniquement si disponible (future fonctionnalité) */}
              {false && (
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg w-72">
                  <div className="relative pt-[56.25%]">
                    <iframe
                      className="absolute inset-0 w-full h-full"
                      src=""
                      title="Bande annonce"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              )}
            </div>
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