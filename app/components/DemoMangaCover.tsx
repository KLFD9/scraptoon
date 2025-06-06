'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen } from 'lucide-react';

interface DemoMangaCoverProps {
  title: string;
  alt?: string;
  className?: string;
  sizes?: string;
}

const DEFAULT_COVER = '/images/default-cover.svg';

// Génère une couleur basée sur le titre
function generateColorFromTitle(title: string): string {
  const colors = [
    'from-blue-500 to-blue-700',
    'from-purple-500 to-purple-700', 
    'from-green-500 to-green-700',
    'from-red-500 to-red-700',
    'from-yellow-500 to-yellow-700',
    'from-pink-500 to-pink-700',
    'from-indigo-500 to-indigo-700',
    'from-teal-500 to-teal-700',
    'from-orange-500 to-orange-700',
    'from-cyan-500 to-cyan-700'
  ];
  
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

export default function DemoMangaCover({ title, alt, className = '', sizes }: DemoMangaCoverProps) {
  const [imageError, setImageError] = useState(false);
  const [useCustom, setUseCustom] = useState(true);
  
  // Si on veut utiliser l'image par défaut directement
  if (!useCustom || imageError) {
    return (
      <Image
        src={DEFAULT_COVER}
        alt={alt || title}
        fill
        className={className}
        sizes={sizes}
        onError={() => setImageError(true)}
      />
    );
  }
  
  // Génère une cover personnalisée
  const gradientColor = generateColorFromTitle(title);
  const shortTitle = title.length > 12 ? title.substring(0, 12) + '...' : title;
  
  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${gradientColor} flex flex-col items-center justify-center p-2 ${className}`}>
      {/* Icône livre */}
      <div className="w-8 h-8 mb-2 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-sm">
        <BookOpen className="w-4 h-4 text-white" />
      </div>
      
      {/* Titre */}
      <div className="text-center">
        <h4 className="text-xs font-semibold text-white leading-tight text-center px-1">
          {shortTitle}
        </h4>
        <div className="mt-1 w-8 h-0.5 bg-white/40 rounded mx-auto"></div>
      </div>
      
      {/* Pattern de fond subtil */}
      <div className="absolute inset-0 opacity-10">
        <div className="w-full h-full" style={{
          backgroundImage: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 2px,
            rgba(255,255,255,0.1) 2px,
            rgba(255,255,255,0.1) 4px
          )`
        }} />
      </div>
    </div>
  );
}
