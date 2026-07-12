"use client";

import React, { useState } from 'react';
import styles from './Modal.module.css';
import { Recipe } from '@/types';
import Button from './Button';

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => Promise<void>;
}

export default function RecipeModal({ isOpen, onClose, onSave }: RecipeModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [origin, setOrigin] = useState("France");
  const [category, setCategory] = useState("Dîner");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ title, description, prepTime, cookTime, origin, category: category as Recipe['category'], ingredients: [], instructions: [] });
    setLoading(false);
    onClose();
    // Reset basic form
    setTitle(""); setDescription("");
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modalLarge}>
        <h2>Nouvelle Recette</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Titre</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Description courte</label>
            <textarea required value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Préparation (min)</label>
              <input type="number" min="0" required value={prepTime} onChange={e => setPrepTime(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label>Cuisson (min)</label>
              <input type="number" min="0" required value={cookTime} onChange={e => setCookTime(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label>Catégorie</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                <option value="Déjeuner">Déjeuner</option>
                <option value="Dîner">Dîner</option>
                <option value="Souper">Souper</option>
                <option value="Dessert">Dessert</option>
              </select>
            </div>
          </div>
          <p className={styles.info}>Note : L&apos;ajout d&apos;ingrédients et d&apos;instructions détaillées sera disponible dans la vue détaillée de la recette après création.</p>
          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Création...' : 'Créer la recette'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
