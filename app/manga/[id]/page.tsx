'use client';

import { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Manga } from '@/app/types/manga';
import Image from 'next/image';
import { BookOpen, Calendar, Clock, Globe, Heart, Info, Star, Users, ArrowLeft, BookmarkPlus, Play, Share2 } from 'lucide-react';
import { useFavorites } from '@/app/hooks/useFavorites';
import Layout from '@/app/components/Layout';
import SynopsisContent, { extractShortSynopsis } from '@/app/components/SynopsisContent';

const DEFAULT_COVER = '/images/default-cover.jpg';

function MangaContent() {
  const router = useRouter();
  const params = useParams();
  const mangaId = params.id as string;
  const [manga, setManga] = useState<Manga | null>(null);
  const [loading, setLoading] = useState(true);
  const { addToFavorites, removeFromFavorites, isFavorite } = useFavorites();
  const [isInFavorites, setIsInFavorites] = useState(false);
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);
  const [trailers, setTrailers] = useState<{ url: string; label: string }[]>([]);

  useEffect(() => {
    const fetchMangaDetails = async () => {
      try {
        const response = await fetch(`/api/manga/${mangaId}`);
        const data = await response.json();
        setManga(data);
        setIsInFavorites(isFavorite(mangaId));
        setTrailers(data.trailers || []);
      } catch (error) {
        console.error('Erreur lors du chargement du manga:', error);
      } finally {
        setLoading(false);
      }
    };

    if (mangaId) {
      fetchMangaDetails();
    }
  }, [mangaId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!manga) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Manga non trouvé</h1>
          <p className="text-gray-600 dark:text-gray-400">Le manga que vous recherchez n'existe pas.</p>
        </div>
      </div>
    );
  }

  const handleFavoriteClick = () => {
    if (isInFavorites) {
      removeFromFavorites(manga.id);
    } else {
      addToFavorites(manga);
    }
    setIsInFavorites(!isInFavorites);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga.title,
          text: `Découvrez ${manga.title} sur MangaScraper`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Erreur lors du partage:', err);
      }
    } else {
      // Fallback: copier le lien dans le presse-papier
      navigator.clipboard.writeText(window.location.href);
      // TODO: Ajouter une notification de confirmation
    }
  };

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
              onError={(e: any) => {
                e.target.src = DEFAULT_COVER;
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
                  onError={(e: any) => {
                    e.target.src = DEFAULT_COVER;
                  }}
                />
              </div>
              
              {/* Informations principales */}
              <div className="flex-grow text-white pb-4 text-center sm:text-left">
                <div className="flex flex-col sm:flex-row items-center gap-4 mb-2">
                  <h1 className="text-2xl sm:text-4xl font-bold">{manga.title}</h1>
                  <button
                    onClick={handleFavoriteClick}
                    className={`hidden lg:flex p-2 rounded-full transition-colors duration-200 ${
                      isInFavorites 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-gray-600 hover:bg-gray-700'
                    }`}
                  >
                    <Heart className={`w-6 h-6 ${isInFavorites ? 'fill-white' : ''}`} />
                  </button>
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
            {/* Colonne principale pour d'autres contenus futurs */}
            <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            </div>

            {/* Barre latérale */}
            <div className="space-y-4 sm:space-y-6">
              {/* Informations */}
              <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Informations</h2>
                    <button
                      onClick={handleShare}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                      title="Partager"
                    >
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                </div>
                
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {/* Stats rapides */}
                  <div className="grid grid-cols-2 divide-x divide-gray-100 dark:divide-gray-700">
                    <div className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <BookOpen className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-500">Total</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {manga.chapterCount?.total || '?'}
                      </div>
                    </div>
                    <div className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2 mb-1">
                        <Globe className="w-4 h-4 text-purple-500" />
                        <span className="text-sm text-gray-500">FR</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {manga.chapterCount?.french || '0'}
                      </div>
                    </div>
                  </div>

                  {/* Infos détaillées */}
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {manga.year || 'Non spécifié'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-300">
                          {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Langues */}
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {manga.availableLanguages?.map((lang, index) => (
                        <span
                          key={index}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300"
                        >
                          {lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Bande annonce - uniquement si disponible */}
                  {manga.videoUrl && (
                    <div className="p-4">
                      <div className="relative pt-[56.25%] bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden">
                        <iframe
                          className="absolute inset-0 w-full h-full"
                          src={manga.videoUrl.replace('watch?v=', 'embed/')}
                          title="Bande annonce"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags et genres - design plus compact */}
              {manga.genres && manga.genres.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg">
                  <div className="p-4">
                    <div className="flex flex-wrap gap-1">
                      {manga.genres.map((genre, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
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