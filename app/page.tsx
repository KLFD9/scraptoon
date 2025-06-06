'use client';

import { useState, useEffect } from 'react';
import { Manga } from './types/manga';
import SearchBar from './components/SearchBar';
import MangaResults from './components/MangaResults';
import ContinueReading from './components/ContinueReading';
import Layout from './components/Layout';
import ClientOnly from './components/ClientOnly';
import SimpleDiscovery from './components/SimpleDiscovery';
import ToastContainer from './components/ToastContainer';
import AnimatedSection from './components/AnimatedSection';
import { scrapeManga } from './services/scraping.service';
import { useFavorites } from './hooks/useFavorites';
import { useToast } from './hooks/useToast';
import { BookmarkPlus, BookOpen, Search, TrendingUp } from 'lucide-react';
import { logger } from '@/app/utils/logger';
import Link from 'next/link';

const MAX_HISTORY_ITEMS = 5;

export default function Home() {
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { toasts, removeToast, error: showError, success: showSuccess } = useToast();

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

  const handleSearch = async (query: string) => {
    setLoading(true);
    try {
      const mangaResults = await scrapeManga(query);
      setResults(mangaResults);
      
      if (mangaResults.length > 0) {
        showSuccess(`${mangaResults.length} manga${mangaResults.length > 1 ? 's' : ''} trouvé${mangaResults.length > 1 ? 's' : ''}`);
      } else {
        showError('Aucun résultat trouvé pour cette recherche');
      }
      
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, MAX_HISTORY_ITEMS);
        return newHistory;
      });
    } catch (error) {
      logger.log('error', 'search failed', { error: String(error), query });
      showError('Erreur lors de la recherche. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };
  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
    showSuccess('Historique de recherche effacé');
  };

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <Layout>
        <ClientOnly>
          <div className="min-h-screen bg-gray-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur-sm border-b border-gray-800">
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
                      Koon
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
            </header>            {/* Welcome Section */}
            {results.length === 0 && !loading && (
              <div className="px-4 pt-4 sm:pt-6 pb-6 sm:pb-8">
                <div className="max-w-7xl mx-auto">
                  {/* Hero compact */}
                  <AnimatedSection animation="fade-up" className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Search className="w-4 h-4 text-gray-400" />
                      <h2 className="text-lg sm:text-xl font-semibold text-white">
                        Rechercher un manga
                      </h2>
                    </div>
                    <p className="text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                      Explorez des milliers de titres et reprenez votre lecture où vous l'avez laissée
                    </p>
                  </AnimatedSection>{/* Continue Reading */}
                  <AnimatedSection animation="fade-up" delay={200}>                    <ClientOnly
                      fallback={
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
                  }                    >
                      <ContinueReading />
                    </ClientOnly>
                  </AnimatedSection>                  {/* Simple Discovery Section - Minimal and modern */}
                  <AnimatedSection animation="fade-up" delay={400} className="mb-8">
                    <SimpleDiscovery onSearch={handleSearch} />
                  </AnimatedSection>
                
                {/* Recherches récentes */}
                {searchHistory.length > 0 && (
                  <div className="text-center">
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
                          onClick={() => handleSearch(query)}
                          className="px-3 py-1.5 bg-gray-800/60 text-gray-300 rounded-lg text-sm hover:bg-gray-700 hover:text-white transition-all duration-200 border border-gray-700/30 hover:border-gray-600 hover:scale-105"
                        >
                          {query}
                        </button>
                      ))}
                    </div>
                  </div>                )}
              </div>
            </div>
          )}

            {/* Main Content */}
            <main className="px-3 sm:px-4 pb-6 sm:pb-8">
              {results.length > 0 && (
                <div className="max-w-7xl mx-auto">
                  <div className="mb-4 sm:mb-6">
                    <h2 className="text-xl sm:text-2xl font-semibold text-white mb-1 sm:mb-2">
                      Résultats de recherche
                    </h2>
                    <p className="text-gray-400 text-sm sm:text-base">
                      {results.length} manga{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <MangaResults mangas={results} />
                </div>
              )}
            </main>
          </div>
        </ClientOnly>
      </Layout>
    </>
  );
}
