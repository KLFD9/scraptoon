'use client';

import { useState, useEffect } from 'react';
import { Manga } from './types/manga';
import SearchBar from './components/SearchBar';
import MangaResults from './components/MangaResults';
import ContinueReading from './components/ContinueReading';
import Layout from './components/Layout';
import ClientOnly from './components/ClientOnly';
import { scrapeManga } from './services/scraping.service';
import { useFavorites } from './hooks/useFavorites';
import ModernRecommendationsSection from './components/ModernRecommendationsSection';
import NewestSection from './components/NewestSection';
import ThematicCollectionsSection from './components/ThematicCollectionsSection';
import BestSellersSection from './components/BestSellersSection';
import { BookmarkPlus, BookOpen, Search, TrendingUp } from 'lucide-react';
import { logger } from '@/app/utils/logger';
import Link from 'next/link';

const MAX_HISTORY_ITEMS = 5;

export default function Home() {
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('searchHistory');
      setSearchHistory(saved ? JSON.parse(saved) : []);
    }
  }, []);

  const { favorites } = useFavorites();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  const handleSearch = async (query: string, forceRefresh: boolean = false) => {
    setLoading(true);
    try {
      // Pass the forceRefresh flag to scrapeManga
      const mangaResults = await scrapeManga(query, forceRefresh);
      setResults(mangaResults);
      
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, MAX_HISTORY_ITEMS);
        return newHistory;
      });
    } catch (error) {
      logger.log('error', 'search failed', { error: String(error), query });
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  return (
    <Layout>
      <ClientOnly>
        <div className="min-h-screen bg-gray-950 text-gray-100">
          {/* Header */}
          <header className="sticky top-0 z-50 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                {/* Brand - Cliquable pour retourner à l'accueil */}
                <button 
                  onClick={() => window.location.href = '/'}
                  className="flex items-center gap-3 flex-shrink-0 hover:opacity-80 transition-opacity"
                >
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gray-950" />
                  </div>
                  <h1 className="text-xl font-semibold text-white">
                    Woons
                  </h1>
                </button>

                {/* Search Bar - Desktop */}
                <div className="hidden md:flex flex-1 max-w-2xl mx-8">
                  <SearchBar 
                    onSearch={handleSearch} 
                    loading={loading}
                    searchHistory={searchHistory}
                    onClearHistory={clearHistory}
                  />
                </div>

                {/* Favorites Link */}
                <Link
                  href="/favorites"
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 flex-shrink-0 bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
                >
                  <BookmarkPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Favoris</span>
                  {favorites.length > 0 && (
                    <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              </div>

              {/* Search Bar - Mobile */}
              <div className="md:hidden mt-4">
                <SearchBar 
                  onSearch={handleSearch} 
                  loading={loading}
                  searchHistory={searchHistory}
                  onClearHistory={clearHistory}
                />
              </div>
            </div>
          </header>

          {/* Search Bar - Mobile (appears below header on small screens) */}
          <div className="md:hidden p-4 border-b border-gray-800">
            <SearchBar 
              onSearch={handleSearch} 
              loading={loading}
              searchHistory={searchHistory}
              onClearHistory={clearHistory}
            />
          </div>
          
          <main className="max-w-7xl mx-auto px-4 py-8 space-y-12">
            {results.length > 0 ? (
              <MangaResults mangas={results} />
            ) : (
              <>
                <ContinueReading />
                <ModernRecommendationsSection onSearch={handleSearch} />
                <NewestSection onSearch={handleSearch} />
                
                {/* Best-sellers - contenus populaires et de qualité */}
                <BestSellersSection onSearch={handleSearch} />
                
                {/* Recommendations personnalisées basées sur les favoris */}
                {/* <ModernRecommendationsSection onSearch={handleSearch} /> */}
                
                {/* Collections thématiques pour la découverte par genre */}
                <ThematicCollectionsSection onSearch={handleSearch} />
                
                {/* Recherches récentes */}
                {searchHistory.length > 0 && (
                  <div className="text-center pt-4">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-gray-500" />
                      <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide">
                        Recherches récentes
                      </h3>
                    </div>
                    <div className="flex flex-wrap justify-center gap-2">
                      {searchHistory.slice(0, 6).map((query, index) => (
                        <button
                          key={index}
                          // Pass true for forceRefresh when a history item is clicked, for testing
                          onClick={() => handleSearch(query, true)}
                          className="px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg text-sm hover:bg-gray-700 hover:text-white transition-colors"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </main>

          {/* Footer */}
          <footer className="bg-gray-950 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-8">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-gray-400 text-sm">
                    &copy; {new Date().getFullYear()} Woons. Tous droits réservés.
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4">
                  <Link href="/about" className="text-gray-300 hover:text-white transition-colors">
                    À propos
                  </Link>
                  <Link href="/contact" className="text-gray-300 hover:text-white transition-colors">
                    Contact
                  </Link>
                  <Link href="/privacy" className="text-gray-300 hover:text-white transition-colors">
                    Politique de confidentialité
                  </Link>
                  <Link href="/terms" className="text-gray-300 hover:text-white transition-colors">
                    Conditions d'utilisation
                  </Link>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </ClientOnly>
    </Layout>
  );
}
