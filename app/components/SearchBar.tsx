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
        <div className="relative group">          <div className="flex items-center bg-gray-950/50 backdrop-blur-sm border border-gray-800/50 rounded-xl focus-within:border-gray-600/50 focus-within:bg-gray-900/60 focus-within:shadow-lg focus-within:shadow-gray-900/20 transition-all duration-200 overflow-hidden">
            <Search className="w-4 h-4 text-gray-500 ml-3.5 group-focus-within:text-gray-400 transition-colors duration-200" /><input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowHistory(searchHistory.length > 0)}
              placeholder="Rechercher un manga..."
              className="flex-1 px-3.5 py-2.5 bg-transparent text-white placeholder-gray-500 border-none outline-none focus:outline-none focus:ring-0 border-b border-transparent focus:border-gray-400/30 text-sm font-medium placeholder:font-normal transition-all duration-200"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="mr-1.5 px-3 py-1.5 bg-gradient-to-r from-gray-100 to-white text-gray-900 rounded-lg hover:from-white hover:to-gray-50 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-gray-100 disabled:hover:to-white transition-all duration-200 text-xs font-semibold shadow-sm"
            >
              {loading ? (
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                  <span className="hidden sm:inline">Recherche...</span>
                </div>
              ) : (
                <span className="hidden sm:inline">Rechercher</span>
              )}
              {!loading && (
                <Search className="w-3.5 h-3.5 sm:hidden" />
              )}
            </button>
          </div>
        </div>        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-3 bg-gray-950/90 backdrop-blur-xl border border-gray-800/50 rounded-xl shadow-2xl shadow-black/20 z-50 overflow-hidden">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-800/50">
              <span className="text-sm text-gray-400 flex items-center font-medium">
                <Clock className="w-4 h-4 mr-2" />
                Récentes
              </span>
              <button
                type="button"
                onClick={() => {
                  onClearHistory?.();
                  setShowHistory(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-300 px-2 py-1 rounded-md hover:bg-gray-800/50 transition-all duration-200 font-medium"
              >
                Effacer
              </button>
            </div>
            <ul className="py-1 max-h-48 overflow-y-auto">
              {searchHistory.map((query, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => handleHistoryItemClick(query)}
                    className="w-full px-4 py-2.5 text-left text-gray-300 hover:bg-gray-800/40 hover:text-white flex items-center transition-all duration-200 group"
                  >
                    <Clock className="w-4 h-4 mr-3 text-gray-500 group-hover:text-gray-400 transition-colors duration-200" />
                    <span className="truncate text-sm">{query}</span>
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