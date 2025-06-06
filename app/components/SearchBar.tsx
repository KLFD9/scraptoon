'use client';

import { Search, Clock } from 'lucide-react';
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
      <div ref={searchBarRef} className="relative">
        {/* Main search input */}
        <div className="relative">
          <div className="flex items-center bg-gray-900 border border-gray-700 rounded-lg focus-within:border-gray-600 transition-colors">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-3 sm:ml-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowHistory(searchHistory.length > 0)}
              placeholder="Rechercher un manga..."
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-transparent text-white placeholder-gray-400 border-none outline-none text-sm sm:text-base"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="m-1 px-3 sm:px-4 py-1.5 sm:py-2 bg-white text-gray-950 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-xs sm:text-sm font-medium"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-950 border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Recherche...</span>
                </div>
              ) : (
                <span className="hidden sm:inline">Rechercher</span>
              )}
              {!loading && (
                <Search className="w-4 h-4 sm:hidden" />
              )}
            </button>
          </div>
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="p-3 flex justify-between items-center border-b border-gray-700">
              <span className="text-sm text-gray-400 flex items-center">
                <Clock className="w-4 h-4 mr-2" />
                Récentes
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearHistory?.();
                  setShowHistory(false);
                }}
                className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
              >
                Effacer
              </button>
            </div>
            <ul className="py-2 max-h-48 overflow-y-auto">
              {searchHistory.map((query, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleHistoryItemClick(query)}
                    className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 flex items-center transition-colors"
                  >
                    <Clock className="w-4 h-4 mr-3 text-gray-500" />
                    <span className="truncate">{query}</span>
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