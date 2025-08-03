import { useState, useEffect, useCallback } from 'react';

interface UseDebouncedSearchOptions {
  delay?: number;
  minLength?: number;
  onSearch?: (query: string) => void;
}

export const useDebouncedSearch = (options: UseDebouncedSearchOptions = {}) => {
  const {
    delay = 300,
    minLength = 2,
    onSearch,
  } = options;

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length >= minLength || searchQuery.length === 0) {
        setDebouncedQuery(searchQuery);
        if (onSearch) {
          setIsSearching(true);
          onSearch(searchQuery);
        }
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, delay, minLength, onSearch]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setDebouncedQuery('');
    setIsSearching(false);
  }, []);

  // Update search query
  const updateSearchQuery = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.length < minLength && query.length > 0) {
      setIsSearching(false);
    }
  }, [minLength]);

  return {
    searchQuery,
    debouncedQuery,
    isSearching,
    updateSearchQuery,
    clearSearch,
    setSearching: setIsSearching,
  };
}; 