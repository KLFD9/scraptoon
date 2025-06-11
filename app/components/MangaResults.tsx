'use client';

import { Manga } from '../types/manga';
import Link from 'next/link';
import { BookOpen, Star } from 'lucide-react';
import OptimizedMangaImage from './OptimizedMangaImage';

interface MangaResultsProps {
  mangas: Manga[];
}

export default function MangaResults({ mangas }: MangaResultsProps) {
  if (!mangas || mangas.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-800 rounded-lg flex items-center justify-center">
          <BookOpen className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">
          Aucun manga trouvé
        </h3>
        <p className="text-gray-400">
          Essayez avec d'autres mots-clés
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3 sm:gap-4">
      {mangas.map((manga) => (
        <Link
          href={`/manga/${manga.id}`}
          key={manga.id}
          className="group bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-700 transition-all duration-200"
        >
          {/* Image Container */}
          <div className="relative aspect-[3/4] overflow-hidden">
            <OptimizedMangaImage
              src={manga.cover}
              alt={manga.title}
              className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, (max-width: 1280px) 16vw, 14vw"
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
            
            {/* Badges */}
            <div className="absolute top-1.5 left-1.5 flex flex-col gap-1">
              {manga.isAvailableInFrench && (
                <span className="bg-white text-gray-950 px-1.5 py-0.5 rounded text-xs font-medium">
                  FR
                </span>
              )}
              <span className="bg-gray-900/80 text-white px-1.5 py-0.5 rounded text-xs">
                {manga.type.charAt(0).toUpperCase()}
              </span>
            </div>
            
            {/* Chapter count */}
            <div className="absolute bottom-1.5 right-1.5">
              <span className="bg-gray-900/80 text-white px-1.5 py-0.5 rounded text-xs flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">{manga.chapterCount?.total || '?'}</span>
                <span className="sm:hidden">{manga.chapterCount?.total || '?'}</span>
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-2 sm:p-3">
            <h3 className="text-white font-medium text-xs sm:text-sm line-clamp-2 mb-1 sm:mb-2 group-hover:text-gray-300 transition-colors leading-tight">
              {manga.title}
            </h3>
            
            <div className="flex items-center justify-between text-xs mb-1">
              <span className={`px-1.5 py-0.5 rounded text-xs ${
                manga.status === 'ongoing' 
                  ? 'bg-green-900/30 text-green-400' 
                  : 'bg-gray-800 text-gray-400'
              }`}>
                {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
              </span>
              
              {/* Score display */}
              {(manga.score || manga.rating) && typeof (manga.score || manga.rating) === 'number' && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-3 h-3 fill-yellow-400" />
                  <span className="text-xs font-medium">
                    {((manga.score || manga.rating) as number).toFixed(1)}
                  </span>
                </div>
              )}
            </div>
            
            {manga.author && (
              <div className="text-gray-400 truncate text-xs hidden sm:block">
                {manga.author.split(' ')[0]}
              </div>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}