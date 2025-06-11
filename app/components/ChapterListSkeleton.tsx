'use client';

import React from 'react';
import Layout from './Layout';

const ChapterListSkeleton: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-950">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
          <div className="max-w-7xl mx-auto px-4 py-3 animate-pulse">
            <div className="flex items-center justify-between">
              {/* Back button + Title */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-gray-800 rounded-lg"></div> {/* Back button */}
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-white rounded-md"></div> {/* Icon */}
                  <div className="h-5 bg-gray-700 rounded w-48"></div> {/* Title */}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-gray-800 rounded-lg"></div> {/* Share button */}
                <div className="w-20 h-8 bg-gray-800 rounded-lg"></div> {/* Favorite button */}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="relative animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto px-4 py-6">
            {/* Cover Image */}
            <div className="lg:col-span-1">
              <div className="relative aspect-[3/4] w-full max-w-sm mx-auto lg:max-w-none bg-gray-800 rounded-lg"></div>
            </div>

            {/* Info Section */}
            <div className="lg:col-span-2 space-y-5">
              <div>
                {/* Title */}
                <div className="h-8 bg-gray-700 rounded w-3/4 mb-4"></div>
                
                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="w-8 h-6 bg-white rounded-md"></div>
                  <div className="w-16 h-6 bg-gray-800 rounded-md"></div>
                  <div className="w-20 h-6 bg-green-900/30 rounded-md"></div>
                  <div className="w-24 h-6 bg-gray-800 rounded-md"></div>
                </div>

                {/* Description */}
                <div className="space-y-2 mb-5">
                  <div className="h-4 bg-gray-700 rounded w-full"></div>
                  <div className="h-4 bg-gray-700 rounded w-11/12"></div>
                  <div className="h-4 bg-gray-700 rounded w-4/5"></div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="h-3 bg-gray-600 rounded w-12 mb-1"></div>
                    <div className="h-4 bg-gray-700 rounded w-20"></div>
                  </div>
                  <div>
                    <div className="h-3 bg-gray-600 rounded w-10 mb-1"></div>
                    <div className="h-4 bg-gray-700 rounded w-16"></div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <div className="w-full sm:w-48 h-10 bg-white rounded-lg"></div>
                <div className="w-full sm:w-56 h-9 bg-gray-800 border border-gray-600 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapters Section */}
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <div className="mb-4 animate-pulse">
            <div className="h-6 bg-gray-700 rounded w-24 mb-1"></div>
            <div className="h-4 bg-gray-600 rounded w-40"></div>
          </div>
          
          <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
            {/* Chapter list skeleton */}
            <div className="space-y-0">
              {/* En-tête avec titre et options de tri */}
              <div className="p-4 border-b border-gray-800 animate-pulse">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-5 bg-gray-700 rounded w-36"></div> {/* Titre "Chapitres disponibles" */}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 bg-gray-800 border border-gray-700 rounded-lg w-28"></div> {/* Select de tri */}
                    </div>
                  </div>
                  <div className="sm:ml-auto">
                    <div className="h-4 bg-gray-700 rounded w-20"></div> {/* Compteur de chapitres */}
                  </div>
                </div>
              </div>

              {/* Liste des chapitres */}
              <div className="divide-y divide-gray-800">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="block p-4 animate-pulse">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-5 bg-gray-700 rounded w-48"></div> {/* Titre du chapitre */}
                          <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded">
                            <div className="h-3 w-4 bg-gray-600 rounded"></div> {/* Flag */}
                            <div className="h-3 w-6 bg-gray-600 rounded"></div> {/* Code langue */}
                          </div>
                        </div>
                        <div className="h-3 bg-gray-700 rounded w-20"></div> {/* Date de publication */}
                      </div>
                      <div className="ml-4">
                        <div className="w-5 h-5 bg-gray-600 rounded"></div> {/* Icône chevron */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination skeleton */}
              <div className="flex flex-col items-center justify-center gap-4 p-4 border-t border-gray-800 animate-pulse">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gray-700 rounded-lg"></div> {/* Bouton précédent */}
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="w-8 h-8 bg-gray-700 rounded-lg"></div>
                    ))}
                  </div>
                  
                  <div className="w-8 h-8 bg-gray-700 rounded-lg"></div> {/* Bouton suivant */}
                </div>
                
                {/* Sélecteur de page */}
                <div className="flex items-center gap-2">
                  <div className="h-4 bg-gray-700 rounded w-20"></div> {/* "Aller à la page" */}
                  <div className="w-16 h-6 bg-gray-800 border border-gray-700 rounded-lg"></div> {/* Input */}
                  <div className="h-4 bg-gray-700 rounded w-12"></div> {/* "sur X" */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChapterListSkeleton;
