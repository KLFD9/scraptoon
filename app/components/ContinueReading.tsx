'use client';

import { useReadingProgress } from '@/app/hooks/useReadingProgress';
import Image from 'next/image';
import Link from 'next/link';
import { Play, X, Clock } from 'lucide-react';

const DEFAULT_COVER = '/images/default-cover.svg';

export default function ContinueReading() {
  const { readingProgress, removeFromReadingProgress } = useReadingProgress();

  if (readingProgress.length === 0) {
    return null;
  }

  const formatLastRead = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Il y a quelques minutes';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours}h`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-gray-400" />
        <h2 className="text-lg font-semibold text-white">
          Continuer la lecture
        </h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {readingProgress.map((item) => (
          <div key={item.mangaId} className="group relative">
            <Link
              href={`/manga/${item.mangaId}/chapter/${item.chapterId}`}
              className="block"
            >
              <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800">
                {item.mangaCover ? (
                  <Image
                    src={item.mangaCover}
                    alt={item.mangaTitle}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      (e.target as HTMLImageElement).src = DEFAULT_COVER;
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="w-12 h-12 mx-auto mb-2 bg-gray-700 rounded-lg flex items-center justify-center">
                        <span className="text-lg font-bold">📚</span>
                      </div>
                      <p className="text-xs">Pas d'image</p>
                    </div>
                  </div>
                )}
                
                {/* Overlay avec bouton play */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <div className="w-10 h-10 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play className="w-5 h-5 text-gray-950 ml-0.5" />
                  </div>
                </div>

                {/* Badge chapitre */}
                <div className="absolute bottom-2 left-2 right-2">
                  <div className="bg-black/80 backdrop-blur-sm rounded-md px-2 py-1">
                    <p className="text-white text-xs font-medium truncate">
                      Ch. {item.chapterNumber}
                    </p>
                  </div>
                </div>
              </div>
            </Link>

            {/* Bouton supprimer */}
            <button
              onClick={(e) => {
                e.preventDefault();
                removeFromReadingProgress(item.mangaId);
              }}
              className="absolute -top-2 -right-2 w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity border border-gray-700"
              title="Retirer de la liste"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>

            {/* Titre et info */}
            <div className="mt-2">
              <Link
                href={`/manga/${item.mangaId}`}
                className="block"
              >
                <h3 className="text-sm font-medium text-white line-clamp-2 hover:text-gray-300 transition-colors">
                  {item.mangaTitle}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 mt-1">
                {formatLastRead(item.lastReadAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
