"use client";

import React, { useState } from 'react';
import styles from './Modal.module.css';
import { PantryItem, Article } from '@/types';
import Button from './Button';
import ArticleAutocomplete from './ArticleAutocomplete';

interface PantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PantryItem, 'id' | 'createdAt'>) => Promise<void>;
  articles: Article[];
}

export default function PantryItemModal({ isOpen, onClose, onSave, articles }: PantryItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pièce");
  const [category, setCategory] = useState("Épicerie");
  const [alertThreshold, setAlertThreshold] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSelectArticle = (article: { name: string; defaultUnit: string; category: string }) => {
    setName(article.name);
    setUnit(article.defaultUnit);
    setCategory(article.category);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    await onSave({ name, quantity, unit, category: category as PantryItem['category'], alertThreshold });
    setLoading(false);
    onClose();
    // Reset form
    setName(""); setQuantity(1); setUnit("pièce"); setCategory("Épicerie"); setAlertThreshold(0);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal} style={{ overflow: 'visible' }}>
        <h2>Ajouter un article au stock</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup} style={{ position: 'relative', zIndex: 10 }}>
            <label>Nom de l&apos;article</label>
            <ArticleAutocomplete
              value={name}
              onChange={setName}
              onSelectArticle={handleSelectArticle}
              articles={articles}
              required
              placeholder="Ex: Lait, Farine..."
            />
          </div>
          <div className={styles.row}>
            <div className={styles.formGroup}>
              <label>Quantité</label>
              <input type="number" min="0" step="0.1" required value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label>Unité</label>
              <select value={unit} onChange={e => setUnit(e.target.value)}>
                <option value="pièce">Pièce(s)</option>
                <option value="g">Grammes (g)</option>
                <option value="kg">Kilo (kg)</option>
                <option value="L">Litre (L)</option>
                <option value="ml">Millilitre (ml)</option>
              </select>
            </div>
          </div>
          <div className={styles.formGroup}>
            <label>Catégorie</label>
            <select value={category} onChange={e => setCategory(e.target.value)}>
              <option value="Épicerie">Épicerie</option>
              <option value="Frais">Frais</option>
              <option value="Surgelés">Surgelés</option>
              <option value="Boissons">Boissons</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label>Seuil d&apos;alerte (quantité minimum)</label>
            <input type="number" min="0" step="0.1" required value={alertThreshold} onChange={e => setAlertThreshold(Number(e.target.value))} />
          </div>
          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
