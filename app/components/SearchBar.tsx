'use client';

import { Search, Clock, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  loading?: boolean;
  searchHistory?: string[];
  onClearHistory?: () => void;
}

export default function SearchBar({ 
  onSearch, 
  loading = false, 
  searchHistory = [], 
  onClearHistory 
}: SearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowHistory(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim());
      setShowHistory(false);
    }
  };

  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
    setShowHistory(false);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div ref={searchBarRef} className="relative flex items-center">
        <div className="relative flex-grow">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Rechercher un manga, manhwa..."
            className="w-full px-4 py-3 pl-12 pr-16 text-gray-900 bg-white dark:bg-gray-800 dark:text-white border border-gray-200 dark:border-gray-700 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow duration-200"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        </div>
        <button
          type="submit"
          disabled={loading}
          className={`absolute right-2 px-4 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
            loading ? 'opacity-75 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <div className="flex items-center">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              <span>Recherche...</span>
            </div>
          ) : (
            'Rechercher'
          )}
        </button>

        {/* Historique de recherche */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50">
            <div className="p-2 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Historique
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearHistory?.();
                  setShowHistory(false);
                }}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Effacer
              </button>
            </div>
            <ul className="py-2">
              {searchHistory.map((query, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleHistoryItemClick(query)}
                    className="w-full px-4 py-2 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                  >
                    <Clock className="w-4 h-4 mr-2 text-gray-400" />
                    {query}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </form>
  );
} 