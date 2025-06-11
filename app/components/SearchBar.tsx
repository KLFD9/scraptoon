'use client';

import { Search, Clock, X as XIcon } from 'lucide-react'; // Added XIcon
import { useState, useRef, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface SearchBarProps {
  onSearch: (query: string, forceRefresh?: boolean) => void; // Updated to accept optional forceRefresh
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
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to store the latest versions of onSearch and loading, to avoid them as direct dependencies in debounce useEffect
  const onSearchRef = useRef(onSearch);
  const loadingRef = useRef(loading);

  useEffect(() => {
    // Keep refs updated with the latest prop values
    onSearchRef.current = onSearch;
    loadingRef.current = loading;
  }, [onSearch, loading]);

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

  // Debounce effect for search query
  useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    const currentQuery = searchQuery.trim();

    if (currentQuery && isFocused) {
      debounceTimeoutRef.current = setTimeout(() => {
        if (!loadingRef.current) { 
          // Call onSearch with forceRefresh: true when search is triggered by debounce
          onSearchRef.current(currentQuery, true); 
        }
      }, 1000); // Increased debounce delay to 1000ms
    } else if (!currentQuery && debounceTimeoutRef.current) {
      // If query becomes empty, clear any existing timeout immediately
      clearTimeout(debounceTimeoutRef.current);
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  // Only re-run this effect if searchQuery or isFocused changes.
  // onSearch and loading changes are handled by refs.
  }, [searchQuery, isFocused]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // Debouncing is handled by the useEffect hook watching searchQuery
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (debounceTimeoutRef.current) { 
      clearTimeout(debounceTimeoutRef.current);
    }
    if (searchQuery.trim() && !loading) {
      // Call onSearch with forceRefresh: true on form submit
      onSearch(searchQuery.trim(), true); 
      setShowHistory(false);
    }
  };

  const handleHistoryItemClick = (query: string) => {
    if (debounceTimeoutRef.current) { 
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchQuery(query);
    // Call onSearch with forceRefresh: true on history item click
    onSearch(query, true); 
    setShowHistory(false);
  };

  const handleClearSearch = () => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    setSearchQuery('');
    // Optionally, call onSearch with an empty string if you want to clear results or reset to a default state
    // onSearchRef.current(''); 
    // For now, just clearing the input. The parent component can decide how to handle empty search.
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
            onChange={handleInputChange} // Use new handler
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

          {/* Clear Search Button */}
          {searchQuery && isFocused && !loading && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
              aria-label="Clear search query"
            >
              <XIcon className="w-5 h-5" />
            </button>
          )}

          {/* Focus ring */}
          {isFocused && (
            <div className="absolute inset-0 rounded-xl border border-blue-500/30 pointer-events-none animate-pulse" />
          )}
        </div>

        {/* Search History Dropdown */}
        <div 
          className={`
            absolute top-full left-0 right-0 mt-2 z-50 
            max-h-64 overflow-y-auto 
            bg-gray-900/95 backdrop-blur-sm border border-gray-700/50 rounded-xl shadow-xl
            transition-all duration-300 ease-in-out
            ${showHistory && searchHistory.length > 0 
              ? 'opacity-100 scale-100 translate-y-0' 
              : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }
          `}
        >
          {searchHistory.length > 0 && ( // Keep rendering children if history exists, let opacity/pointer-events handle visibility
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
          )}
        </div>
      </div>
    </form>
  );
}