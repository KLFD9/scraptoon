'use client';

import { Search, Clock } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

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
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const searchBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target as Node)) {
        setShowHistory(false);
        setIsFocused(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && !loading) {
      onSearch(searchQuery.trim());
      setShowHistory(false);
    }
  };

  const handleHistoryItemClick = (query: string) => {
    setSearchQuery(query);
    onSearch(query);
    setShowHistory(false);
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (searchHistory.length > 0) {
      setShowHistory(true);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div ref={searchBarRef} className="relative">
        {/* Main search input */}
        <div className={`relative transition-all duration-300 ${isFocused ? 'scale-[1.01]' : ''}`}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleFocus}
            placeholder="Rechercher un manga..."
            disabled={loading}
            className={`w-full h-12 pl-12 pr-4 bg-gray-900/60 backdrop-blur-sm border rounded-xl text-white placeholder-gray-400 transition-all duration-300 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed ${
              isFocused 
                ? 'border-blue-500/60 bg-gray-900/80 shadow-lg shadow-blue-500/10' 
                : 'border-gray-700/50 hover:border-gray-600/70'
            }`}
          />
          
          {/* Search Icon or Loading Spinner */}
          <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <Search className={`w-5 h-5 transition-colors ${
                isFocused ? 'text-blue-400' : 'text-gray-400'
              }`} />
            )}
          </div>

          {/* Focus ring */}
          {isFocused && (
            <div className="absolute inset-0 rounded-xl border border-blue-500/30 pointer-events-none animate-pulse" />
          )}
        </div>

        {/* Search History Dropdown */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
            <div className="p-2">
              <div className="flex items-center justify-between px-3 py-2 text-xs text-gray-400 uppercase tracking-wide">
                <span>Recherches récentes</span>
                {onClearHistory && (
                  <button
                    type="button"
                    onClick={onClearHistory}
                    className="text-gray-500 hover:text-gray-300 transition-colors"
                  >
                    Effacer
                  </button>
                )}
              </div>
              {searchHistory.map((query, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleHistoryItemClick(query)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left text-gray-300 hover:bg-gray-800/60 hover:text-white rounded-lg transition-all duration-200 group"
                >
                  <Clock className="w-4 h-4 text-gray-500 group-hover:text-gray-400" />
                  <span className="flex-1 text-sm">{query}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </form>
  );
}