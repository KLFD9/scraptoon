'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useCollections } from '@/app/hooks/useCollections';
import Layout from '@/app/components/Layout';
import Breadcrumb from '@/app/components/Breadcrumb';
import EnhancedMangaResults from '@/app/components/EnhancedMangaResults';
import { ArrowLeft, Star, TrendingUp, BookOpen, Users } from 'lucide-react';
import type { Manga } from '@/app/types/manga';

interface CollectionDetails {
  id: string;
  manga: Manga[];
  count: number;
  trending: boolean;
  weeklyGrowth: number;
  newManga: string[];
  topManga: {
    title: string;
    cover: string;
  } | null;
}

const COLLECTION_INFO: Record<string, { name: string; description: string; emoji: string }> = {
  'romance-scolaire': {
    name: 'Romance scolaire',
    description: 'Des histoires d\'amour touchantes dans l\'univers scolaire, entre premiers émois et relations complexes.',
    emoji: '💕'
  },
  'action-intense': {
    name: 'Action intense',
    description: 'Des combats épiques, des héros puissants et des aventures palpitantes qui ne vous laisseront pas indifférents.',
    emoji: '⚡'
  },
  'fantasy-medieval': {
    name: 'Fantasy médiévale',
    description: 'Plongez dans des mondes fantastiques remplis de magie, de dragons et de quêtes héroïques.',
    emoji: '👑'
  },
  'thriller-psychologique': {
    name: 'Thriller psychologique',
    description: 'Des histoires sombres et captivantes qui vous tiendront en haleine jusqu\'à la dernière page.',
    emoji: '🌙'
  },
  'slice-of-life': {
    name: 'Tranches de vie',
    description: 'Le quotidien raconté avec poésie, des moments simples qui révèlent la beauté de la vie ordinaire.',
    emoji: '🌸'
  },
  'top-rated': {
    name: 'Les mieux notés',
    description: 'Une sélection des mangas les plus appréciés par la communauté, garantie qualité.',
    emoji: '⭐'
  },
};

export default function CollectionPage() {
  const params = useParams();
  const router = useRouter();
  const collectionId = params.id as string;
  const { getCollectionDetails } = useCollections();
  
  const [details, setDetails] = useState<CollectionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!collectionId) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getCollectionDetails(collectionId);
        setDetails(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [collectionId, getCollectionDetails]);

  const collectionInfo = COLLECTION_INFO[collectionId];

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-950">
          {/* Header skeleton */}
          <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 bg-gray-800 rounded-lg animate-pulse"></div>
                <div className="h-6 bg-gray-700 rounded w-48 animate-pulse"></div>
              </div>
            </div>
          </header>
          
          {/* Content skeleton */}
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="space-y-6">
              <div className="h-8 bg-gray-700 rounded w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-96 animate-pulse"></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="space-y-3 animate-pulse">
                    <div className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
                    <div className="h-4 bg-gray-800 rounded"></div>
                    <div className="h-3 bg-gray-800 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !details || !collectionInfo) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-950 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Collection non trouvée</h1>
            <p className="text-gray-400 mb-4">{error || 'Cette collection n\'existe pas.'}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-white text-gray-950 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Retour
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="border-b border-gray-800 bg-gray-950/95 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{collectionInfo.emoji}</span>
                <h1 className="text-xl font-semibold text-white">
                  {collectionInfo.name}
                </h1>
                {details.trending && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full">
                    <TrendingUp className="w-3 h-3 text-orange-400" />
                    <span className="text-xs text-orange-400 font-medium">Tendance</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <Breadcrumb 
            items={[
              { label: 'Collections', href: '/#collections' },
              { label: collectionInfo.name, current: true }
            ]}
            className="mb-6"
          />
          
          {/* Description et stats */}
          <div className="mb-8 space-y-4">
            <p className="text-gray-300 text-lg leading-relaxed max-w-3xl">
              {collectionInfo.description}
            </p>
            
            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <BookOpen className="w-4 h-4" />
                <span>{details.count} mangas</span>
              </div>
              
              {details.newManga.length > 0 && (
                <div className="flex items-center gap-2 text-green-400">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>{details.newManga.length} nouveaux cette semaine</span>
                </div>
              )}
              
              {details.weeklyGrowth !== 0 && (
                <div className={`flex items-center gap-2 ${
                  details.weeklyGrowth > 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  <TrendingUp className={`w-4 h-4 ${details.weeklyGrowth < 0 ? 'rotate-180' : ''}`} />
                  <span>{details.weeklyGrowth > 0 ? '+' : ''}{details.weeklyGrowth}% cette semaine</span>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-gray-400">
                <Users className="w-4 h-4" />
                <span>Collection populaire</span>
              </div>
            </div>
          </div>

          {/* Top manga highlight */}
          {details.topManga && (
            <div className="mb-8 p-4 bg-gray-900/50 rounded-lg border border-gray-800">
              <div className="flex items-center gap-2 mb-2">
                <Star className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium text-white">Manga vedette</span>
              </div>
              <p className="text-gray-300">{details.topManga.title}</p>
            </div>
          )}

          {/* Manga grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Tous les mangas ({details.count})
              </h2>
            </div>
            
            <EnhancedMangaResults mangas={details.manga} />
          </div>
        </div>
      </div>
    </Layout>
  );
}
