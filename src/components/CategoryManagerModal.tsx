"use client";

import React, { useState } from 'react';
import styles from './Modal.module.css';
import catStyles from './CategoryManager.module.css';
import Button from './Button';
import { AppSettings } from '@/types';
import {
  addMealCategory, removeMealCategory, renameMealCategory,
  addOriginCategory, removeOriginCategory, renameOriginCategory,
} from '@/lib/settingsService';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChanged: () => void;
  initialTab?: 'meal' | 'origin';
}

export default function CategoryManagerModal({
  isOpen, onClose, settings, onSettingsChanged, initialTab = 'meal'
}: CategoryManagerModalProps) {
  const [activeTab, setActiveTab] = useState<'meal' | 'origin'>(initialTab);
  const [newCategory, setNewCategory] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const categories = activeTab === 'meal' ? settings.mealCategories : settings.originCategories;

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    setLoading(true);
    if (activeTab === 'meal') {
      await addMealCategory(newCategory.trim());
    } else {
      await addOriginCategory(newCategory.trim());
    }
    setNewCategory('');
    setLoading(false);
    onSettingsChanged();
  };

  const handleRemove = async (cat: string) => {
    if (!confirm(`Supprimer la catégorie "${cat}" ?`)) return;
    setLoading(true);
    if (activeTab === 'meal') {
      await removeMealCategory(cat);
    } else {
      await removeOriginCategory(cat);
    }
    setLoading(false);
    onSettingsChanged();
  };

  const handleStartEdit = (index: number, value: string) => {
    setEditingIndex(index);
    setEditValue(value);
  };

  const handleSaveEdit = async (oldName: string) => {
    if (!editValue.trim() || editValue.trim() === oldName) {
      setEditingIndex(null);
      return;
    }
    setLoading(true);
    if (activeTab === 'meal') {
      await renameMealCategory(oldName, editValue.trim());
    } else {
      await renameOriginCategory(oldName, editValue.trim());
    }
    setEditingIndex(null);
    setLoading(false);
    onSettingsChanged();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalLarge} onClick={e => e.stopPropagation()}>
        <h2>⚙️ Gérer les catégories</h2>

        <div className={catStyles.tabs}>
          <button
            className={`${catStyles.tab} ${activeTab === 'meal' ? catStyles.tabActive : ''}`}
            onClick={() => setActiveTab('meal')}
          >
            🍴 Catégories de repas
          </button>
          <button
            className={`${catStyles.tab} ${activeTab === 'origin' ? catStyles.tabActive : ''}`}
            onClick={() => setActiveTab('origin')}
          >
            🌍 Origines &amp; Cuisines
          </button>
        </div>

        <div className={catStyles.list}>
          {categories.map((cat, index) => (
            <div key={cat} className={catStyles.item}>
              {editingIndex === index ? (
                <div className={catStyles.editRow}>
                  <input
                    type="text"
                    value={editValue}
                    onChange={e => setEditValue(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSaveEdit(cat)}
                    autoFocus
                  />
                  <button className={catStyles.saveBtn} onClick={() => handleSaveEdit(cat)}>✓</button>
                  <button className={catStyles.cancelBtn} onClick={() => setEditingIndex(null)}>✕</button>
                </div>
              ) : (
                <>
                  <span className={catStyles.itemName}>{cat}</span>
                  <div className={catStyles.itemActions}>
                    <button className={catStyles.editBtn} onClick={() => handleStartEdit(index, cat)} title="Renommer">✏️</button>
                    <button className={catStyles.deleteBtn} onClick={() => handleRemove(cat)} title="Supprimer">🗑️</button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className={catStyles.addRow}>
          <input
            type="text"
            placeholder={activeTab === 'meal' ? 'Nouvelle catégorie de repas...' : 'Nouvelle origine...'}
            value={newCategory}
            onChange={e => setNewCategory(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
          />
          <Button onClick={handleAdd} disabled={loading || !newCategory.trim()}>Ajouter</Button>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
