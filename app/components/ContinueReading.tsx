'use client';

import { useReadingProgress } from '@/app/hooks/useReadingProgress';
import { useSafeDate } from '@/app/hooks/useSafeDate';
import Image from 'next/image';
import Link from 'next/link';
import { getLanguageFlag } from '@/app/utils/language';
import { Play, X, Clock, BookOpen } from 'lucide-react';

const DEFAULT_COVER = '/images/default-cover.svg';

export default function ContinueReading() {
  const { readingProgress, removeFromReadingProgress } = useReadingProgress();
  const { formatLastRead, mounted } = useSafeDate();
  // Show skeleton while mounting
  if (!mounted) {
    return (
      <div className="mb-6 animate-pulse">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 bg-gray-700 rounded"></div>
          <div className="h-5 bg-gray-700 rounded w-40"></div>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="aspect-[3/4] bg-gray-800 rounded-lg"></div>
              <div className="h-3 bg-gray-800 rounded"></div>
              <div className="h-2 bg-gray-800 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (readingProgress.length === 0) {
    return null;
  }
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-400" />
        <h2 className="text-base font-semibold text-white">
          Continuer la lecture
        </h2>
        <span className="text-xs text-gray-500 bg-gray-800/60 px-2 py-0.5 rounded-full border border-gray-700/30">
          {readingProgress.length} titre{readingProgress.length > 1 ? 's' : ''}
        </span>
      </div>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
        {readingProgress.map((item) => (
          <div key={item.mangaId} className="group relative">
            <Link
              href={`/manga/${item.mangaId}/chapter/${item.chapterId}`}
              className="block"
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 border border-gray-700/50 hover:border-gray-600 transition-all duration-200 hover:shadow-lg">
                {item.mangaCover ? (
                  <Image
                    src={item.mangaCover}
                    alt={item.mangaTitle}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLImageElement).src = DEFAULT_COVER;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-8 h-8 mx-auto mb-1 bg-gray-700 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                      </div>
                      <p className="text-xs">Pas d'image</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay avec bouton play */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 transform scale-75 group-hover:scale-100 shadow-lg">
                    <Play className="w-4 h-4 text-gray-950 ml-0.5" />
                  </div>
                </div>

                {/* Badge chapitre - Plus compact */}
                <div className="absolute bottom-1.5 left-1.5 right-1.5">
                  <div className="bg-black/80 backdrop-blur-sm rounded px-2 py-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-xs font-medium truncate">
                        Ch. {item.chapterNumber}
                      </p>
                      {item.language && (
                        <span className="text-xs ml-1">
                          {getLanguageFlag(item.language)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            
            {/* Bouton supprimer - Plus petit */}
            <button
              onClick={(e) => {
                e.preventDefault();
                removeFromReadingProgress(item.mangaId);
              }}
              className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-gray-800 hover:bg-red-900/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 border border-gray-700 hover:border-red-600/50 hover:scale-110"
              title="Retirer de la liste"
            >
              <X className="w-2.5 h-2.5 text-gray-400 hover:text-red-400" />
            </button>

            {/* Titre et info - Plus compact */}
            <div className="mt-2">
              <Link
                href={`/manga/${item.mangaId}`}
                className="block"
              >
                <h3 className="text-xs font-medium text-white line-clamp-2 hover:text-gray-300 transition-colors leading-tight">
                  {item.mangaTitle}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatLastRead(item.lastReadAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
