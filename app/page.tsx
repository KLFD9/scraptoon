'use client';

import { useState, useEffect } from 'react';
import { Manga } from './types/manga';
import SearchBar from './components/SearchBar';
import MangaResults from './components/MangaResults';
import FavoritesList from './components/FavoritesList';
import Layout from './components/Layout';
import ClientOnly from './components/ClientOnly';
import { scrapeManga } from './services/scraping.service';
import { useFavorites } from './hooks/useFavorites';
import { BookmarkPlus } from 'lucide-react';

const MAX_HISTORY_ITEMS = 5;

export default function Home() {
  const [results, setResults] = useState<Manga[]>([]);
  const [loading, setLoading] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('searchHistory');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const {
    favorites,
    removeFromFavorites,
    updateReadingStatus,
    addNote
  } = useFavorites();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
    }
  }, [searchHistory]);

  const handleSearch = async (query: string) => {
    setLoading(true);
    setShowFavorites(false);
    try {
      const mangaResults = await scrapeManga(query);
      setResults(mangaResults);
      
      setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(q => q !== query)].slice(0, MAX_HISTORY_ITEMS);
        return newHistory;
      });
    } catch (error) {
      console.error('Erreur:', error);
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <header className="bg-white dark:bg-gray-800 shadow-lg py-4">
            <div className="max-w-7xl mx-auto px-4">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white whitespace-nowrap">
                  MangaScraper
                </h1>
                <div className="flex-grow max-w-2xl">
                  <SearchBar 
                    onSearch={handleSearch} 
                    loading={loading}
                    searchHistory={searchHistory}
                    onClearHistory={clearHistory}
                  />
                </div>
                <button
                  onClick={() => setShowFavorites(!showFavorites)}
                  className={`px-4 py-2 rounded-full flex items-center gap-2 transition-colors ${
                    showFavorites
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <BookmarkPlus className="w-5 h-5" />
                  <span className="hidden sm:inline">Favoris</span>
                </button>
              </div>
            </div>
          </header>

          <main className="max-w-7xl mx-auto px-4 py-8">
            {showFavorites ? (
              <FavoritesList
                favorites={favorites}
                onUpdateStatus={updateReadingStatus}
                onRemove={removeFromFavorites}
                onAddNote={addNote}
              />
            ) : (
              <MangaResults 
                mangas={results}
              />
            )}
          </main>
        </div>
      </ClientOnly>
    </Layout>
  );
}
