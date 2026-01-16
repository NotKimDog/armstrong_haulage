'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Loader } from 'lucide-react';

interface SearchResult {
  id: string;
  displayName?: string;
  email?: string;
  slug?: string;
  photoURL?: string;
  type?: string;
}

interface AdvancedSearchProps {
  onSelect?: (result: SearchResult) => void;
  placeholder?: string;
  type?: 'users' | 'all';
}

export function AdvancedSearch({
  onSelect,
  placeholder = 'Search users...',
  type = 'users',
}: AdvancedSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(searchQuery)}&type=${type}&limit=10`
      );

      if (!response.ok) throw new Error('Search failed');

      const data = await response.json();
      setResults(data.results.items || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [type]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (value.trim()) {
      setShowResults(true);
      debounceTimerRef.current = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setResults([]);
      setShowResults(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    onSelect?.(result);
    setQuery('');
    setResults([]);
    setShowResults(false);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowResults(false);
    inputRef.current?.focus();
  };

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => query && setShowResults(true)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-neutral-900 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-emerald-500/50 focus:outline-none transition-colors"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-white/10 rounded-lg shadow-xl overflow-hidden z-50"
          >
            {loading ? (
              <div className="p-4 text-center">
                <Loader className="w-4 h-4 animate-spin mx-auto text-emerald-500" />
              </div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-gray-400 text-sm">
                {query ? 'No results found' : 'Start typing to search'}
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {results.map((result) => (
                  <motion.button
                    key={result.id}
                    onClick={() => handleSelectResult(result)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="w-full p-3 hover:bg-white/5 transition-colors text-left flex items-center gap-3 group"
                  >
                    {result.photoURL && (
                      <img
                        src={result.photoURL}
                        alt={result.displayName || ''}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                        {result.displayName || result.email}
                      </p>
                      {result.slug && (
                        <p className="text-xs text-gray-400 truncate">@{result.slug}</p>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default AdvancedSearch;
