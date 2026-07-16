"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Article } from '@/types';
import styles from './ArticleAutocomplete.module.css';

interface ArticleAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSelectArticle?: (article: { name: string; defaultUnit: string; category: string }) => void;
  articles: Article[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export default function ArticleAutocomplete({
  value,
  onChange,
  onSelectArticle,
  articles,
  placeholder = "Rechercher ou ajouter un article...",
  required = false,
  className
}: ArticleAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = value.trim()
    ? articles.filter(article => article.name.toLowerCase().includes(value.toLowerCase())).slice(0, 8)
    : [];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setIsOpen(true);
    setHighlightedIndex(-1);
  };

  const handleSelect = (article: Article) => {
    onChange(article.name);
    if (onSelectArticle) {
      onSelectArticle({
        name: article.name,
        defaultUnit: article.defaultUnit,
        category: article.category
      });
    }
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOpen(true);
      setHighlightedIndex(prev => (prev + 1 < suggestions.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev - 1 >= 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      if (isOpen && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelect(suggestions[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={`${styles.autocomplete} ${className || ''}`} ref={containerRef}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsOpen(true)}
        placeholder={placeholder}
        required={required}
        autoComplete="off"
      />
      {isOpen && suggestions.length > 0 && (
        <ul className={styles.suggestionsList}>
          {suggestions.map((article, idx) => (
            <li
              key={article.id || article.name}
              className={`${styles.suggestionItem} ${idx === highlightedIndex ? styles.highlighted : ''}`}
              onClick={() => handleSelect(article)}
            >
              <span className={styles.name}>{article.name}</span>
              <span className={styles.meta}>
                {article.defaultUnit} • {article.category}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
