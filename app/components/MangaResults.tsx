'use client';

import { Manga } from '../types/manga';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';

interface MangaResultsProps {
  mangas: Manga[];
}

export default function MangaResults({ mangas }: MangaResultsProps) {
  if (!mangas || mangas.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Aucun manga trouvé</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {mangas.map((manga) => (
        <Link
          href={`/manga/${manga.id}`}
          key={manga.id}
          className="group bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
        >
          <div className="relative">
            <div className="relative h-56 w-full">
              <Image
                src={manga.cover}
                alt={manga.title}
                fill
                className="object-cover transform transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-2">
                <span className="bg-gray-800/90 text-white px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                  {manga.type.toUpperCase()}
                </span>
                {manga.isAvailableInFrench && (
                  <span className="bg-blue-500/90 text-white px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
                    FR
                  </span>
                )}
              </div>

              {/* Informations en bas */}
              <div className="absolute bottom-2 right-2 flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                  manga.chapterCount?.french > 0 
                    ? 'bg-blue-500/90 text-white'
                    : 'bg-gray-500/90 text-white'
                }`}>
                  <BookOpen className="w-3 h-3 inline mr-1" />
                  {manga.chapterCount?.total || '?'} ch.
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold backdrop-blur-sm ${
                  manga.status === 'ongoing' 
                    ? 'bg-green-500/90 text-white' 
                    : 'bg-gray-500/90 text-white'
                }`}>
                  {manga.status === 'ongoing' ? 'En cours' : 'Terminé'}
                </span>
              </div>
            </div>

            <div className="p-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1 group-hover:text-blue-500 transition-colors duration-200">
                {manga.title}
              </h3>
              {manga.author && (
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">
                  {manga.author}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
} 