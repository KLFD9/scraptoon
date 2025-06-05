'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

interface SynopsisContentProps {
  content: string;
}

export default function SynopsisContent({ content }: SynopsisContentProps) {
  const [activeTrailer, setActiveTrailer] = useState<string | null>(null);

  // Fonction pour extraire les différentes parties du synopsis
  const extractContent = (text: string) => {
    // Séparer le court synopsis du reste
    const parts = text.split('---').map(part => part.trim());
    const fullSynopsis = parts.slice(1).join('\n\n');

    // Extraire les trailers
    const trailers: { url: string; label: string }[] = [];
    const cleanText = fullSynopsis.replace(/\[(.*?)\]\((.*?)\)/g, (match, label, url) => {
      if (/youtube|trailer/i.test(url)) {
        trailers.push({ url, label });
        return '';
      }
      return '';
    }).trim();

    return {
      fullSynopsis: cleanText,
      trailers
    };
  };

  const { fullSynopsis, trailers } = extractContent(content);

  return (
    <div className="space-y-6">
      {/* Synopsis complet */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Synopsis</h2>
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
          {fullSynopsis}
        </p>
      </div>

      {/* Trailers section - uniquement affiché s'il y a des trailers */}
      {trailers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Bandes-annonces</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {trailers.map((trailer, index) => (
              <div key={index} className="relative">
                {activeTrailer === trailer.url ? (
                  <div className="relative pt-[56.25%]">
                    <iframe
                      className="absolute inset-0 w-full h-full rounded-lg"
                      src={trailer.url.replace('watch?v=', 'embed/')}
                      title={trailer.label}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => setActiveTrailer(trailer.url)}
                    className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg p-4 flex items-center gap-3 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <Play className="w-6 h-6 text-blue-500" />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {trailer.label || `Trailer ${index + 1}`}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Exporter la fonction d'extraction pour pouvoir l'utiliser dans le composant parent
export function extractShortSynopsis(content: string): string {
  return content.split('---')[0].trim();
} 