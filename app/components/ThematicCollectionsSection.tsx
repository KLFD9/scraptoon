'use client';

import React, { JSX } from 'react';
import { BookOpen, Star, Crown, Heart, Zap, Moon, ArrowRight } from 'lucide-react';
import { useState } from 'react';

interface ThematicCollectionsSectionProps {
  onSearch: (query: string) => void;
}

interface Collection {
  id: string;
  name: string;
  icon: JSX.Element;
  color: string;
  bgColor: string;
  searchTerms: string[];
  count: number;
}

const COLLECTIONS: Collection[] = [
  {
    id: 'romance-scolaire',
    name: 'Romance',
    icon: <Heart className="w-4 h-4" />,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/10 border-pink-500/20',
    searchTerms: ['romance', 'school life'],
    count: 156
  },
  {
    id: 'action-intense',
    name: 'Action',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-red-500',
    bgColor: 'bg-red-500/10 border-red-500/20',
    searchTerms: ['action', 'fighting'],
    count: 243
  },
  {
    id: 'fantasy-medieval',
    name: 'Fantasy',
    icon: <Crown className="w-4 h-4" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/20',
    searchTerms: ['fantasy', 'medieval'],
    count: 89
  },
  {
    id: 'thriller-psychologique',
    name: 'Thriller',
    icon: <Moon className="w-4 h-4" />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/10 border-slate-500/20',
    searchTerms: ['thriller', 'psychological'],
    count: 67
  },
  {
    id: 'slice-of-life',
    name: 'Vie quotidienne',
    icon: <BookOpen className="w-4 h-4" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    searchTerms: ['slice of life', 'daily life'],
    count: 134
  },
  {
    id: 'top-rated',
    name: 'Top-rated',
    icon: <Star className="w-4 h-4" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/20',
    searchTerms: ['top rated', 'best'],
    count: 50
  }
];

export default function ThematicCollectionsSection({ onSearch }: ThematicCollectionsSectionProps) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
        <h3 className="text-lg font-medium text-white">Collections thématiques</h3>
      </div>

      {/* Collections Grid - Mobile First, Compact Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {COLLECTIONS.map((collection) => (
          <button
            key={collection.id}
            onClick={() => onSearch(collection.searchTerms[0])}
            className={`group relative p-3 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${collection.bgColor} hover:border-current focus:outline-none focus:ring-2 focus:ring-blue-500/50`}
          >
            {/* Icon and Count */}
            <div className="flex items-center justify-between mb-2">
              <div className={`${collection.color} transition-transform group-hover:scale-110`}>
                {collection.icon}
              </div>
              <span className="text-xs font-medium text-gray-400">
                {collection.count}
              </span>
            </div>
            
            {/* Title */}
            <div className="text-left">
              <h4 className="text-sm font-medium text-white group-hover:text-white/90 transition-colors">
                {collection.name}
              </h4>
            </div>

            {/* Hover Effect */}
            <div className="absolute inset-0 rounded-lg bg-white/0 group-hover:bg-white/5 transition-colors pointer-events-none"></div>
            
            {/* Arrow Icon on Hover */}
            <ArrowRight className="absolute top-2 right-2 w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>

      {/* Footer Stats */}
      <div className="flex items-center justify-center gap-4 text-xs text-gray-500 pt-2">
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
          {COLLECTIONS.reduce((total, collection) => total + collection.count, 0)} titres
        </span>
        <span className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
          {COLLECTIONS.length} collections
        </span>
      </div>
    </div>
  );
}
