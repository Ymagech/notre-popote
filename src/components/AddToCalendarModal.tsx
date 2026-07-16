"use client";

import React, { useEffect, useState } from 'react';
import styles from './Modal.module.css';
import Button from './Button';
import { Recipe } from '@/types';
import { getSettings } from '@/lib/settingsService';
import { addCalendarEntry } from '@/lib/calendarService';

interface AddToCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  servings: number;
  onSaved: (dateStr: string, mealType: string) => void;
}

export default function AddToCalendarModal({
  isOpen,
  onClose,
  recipe,
  servings,
  onSaved
}: AddToCalendarModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [mealType, setMealType] = useState('');
  const [mealCategories, setMealCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = new Date().toISOString().split('T')[0];
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDate(today);

      // Load meal categories for dropdown
      getSettings().then(settings => {
        setMealCategories(settings.mealCategories);
        if (settings.mealCategories.length > 0) {
          setMealType(settings.mealCategories[0]);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!date || !mealType) return;
    setLoading(true);
    try {
      await addCalendarEntry({
        date,
        mealType,
        recipeId: recipe.id!,
        recipeTitle: recipe.title,
        recipeImageUrl: recipe.imageUrl || '',
        servings: servings
      });
      onSaved(date, mealType);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la planification de la recette:', error);
      alert('Erreur lors de la planification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <h2>📅 Planifier dans le menu</h2>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Ajouter <strong>{recipe.title}</strong> au calendrier de menus pour {servings} personnes.
        </p>

        <div className={styles.formGroup}>
          <label htmlFor="calendar-date">Date</label>
          <input
            id="calendar-date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="calendar-meal">Repas</label>
          <select
            id="calendar-meal"
            value={mealType}
            onChange={e => setMealType(e.target.value)}
            required
          >
            {mealCategories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
          <Button onClick={handleSave} disabled={loading || !date || !mealType}>
            {loading ? 'Planification...' : 'Confirmer'}
          </Button>
        </div>
      </div>
    </div>
  );
}
