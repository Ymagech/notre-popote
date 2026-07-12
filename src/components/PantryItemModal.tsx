"use client";

import React, { useState } from 'react';
import styles from './Modal.module.css';
import { PantryItem } from '@/types';
import Button from './Button';

interface PantryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Omit<PantryItem, 'id' | 'createdAt'>) => Promise<void>;
}

export default function PantryItemModal({ isOpen, onClose, onSave }: PantryItemModalProps) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("pièce");
  const [category, setCategory] = useState("Épicerie");
  const [alertThreshold, setAlertThreshold] = useState(0);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSave({ name, quantity, unit, category: category as PantryItem['category'], alertThreshold });
    setLoading(false);
    onClose();
    // Reset form
    setName(""); setQuantity(1); setUnit("pièce"); setCategory("Épicerie"); setAlertThreshold(0);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Ajouter un article</h2>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label>Nom de l&apos;article</label>
            <input type="text" required value={name} onChange={e => setName(e.target.value)} />
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
          <div className={styles.actions}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Enregistrement...' : 'Enregistrer'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
