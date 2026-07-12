"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface FilterState {
  activeCategory: string | null;
  activeOrigin: string | null;
  searchQuery: string;
}

interface FilterContextType extends FilterState {
  setActiveCategory: (category: string | null) => void;
  setActiveOrigin: (origin: string | null) => void;
  setSearchQuery: (query: string) => void;
  clearFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activeOrigin, setActiveOrigin] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const clearFilters = () => {
    setActiveCategory(null);
    setActiveOrigin(null);
    setSearchQuery('');
  };

  return (
    <FilterContext.Provider value={{
      activeCategory,
      activeOrigin,
      searchQuery,
      setActiveCategory,
      setActiveOrigin,
      setSearchQuery,
      clearFilters,
    }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
