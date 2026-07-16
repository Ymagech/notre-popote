"use client";

import React, { useEffect, useState } from 'react';
import styles from './Modal.module.css';
import catStyles from './CategoryManager.module.css';
import Button from './Button';
import { Article } from '@/types';
import { getArticles, addArticle, updateArticle, deleteArticle } from '@/lib/articleService';

interface ArticleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onArticlesChanged?: () => void;
}

const UNITS = ['pièce', 'g', 'kg', 'ml', 'L', 'c.à.s', 'c.à.c', 'pincée', 'verre', 'sachet', 'rouleau', 'gousse'];
const CATEGORIES = ['Épicerie', 'Frais', 'Surgelés', 'Boissons', 'Autre'];

export default function ArticleManagerModal({
  isOpen,
  onClose,
  onArticlesChanged
}: ArticleManagerModalProps) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  // New Article Form
  const [newName, setNewName] = useState('');
  const [newUnit, setNewUnit] = useState('pièce');
  const [newCategory, setNewCategory] = useState('Épicerie');

  // Edit Article State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editUnit, setEditUnit] = useState('pièce');
  const [editCategory, setEditCategory] = useState('Épicerie');

  const loadArticles = async () => {
    setLoading(true);
    try {
      const data = await getArticles();
      setArticles(data);
    } catch (error) {
      console.error('Erreur lors du chargement des articles:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadArticles();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setLoading(true);
    try {
      await addArticle({
        name: newName.trim(),
        defaultUnit: newUnit,
        category: newCategory
      });
      setNewName('');
      setNewUnit('pièce');
      setNewCategory('Épicerie');
      await loadArticles();
      if (onArticlesChanged) onArticlesChanged();
    } catch (error) {
      console.error('Erreur de création d\'article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartEdit = (article: Article) => {
    setEditingId(article.id!);
    setEditName(article.name);
    setEditUnit(article.defaultUnit);
    setEditCategory(article.category);
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) return;
    setLoading(true);
    try {
      await updateArticle(id, {
        name: editName.trim(),
        defaultUnit: editUnit,
        category: editCategory
      });
      setEditingId(null);
      await loadArticles();
      if (onArticlesChanged) onArticlesChanged();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Voulez-vous supprimer l'article "${name}" de la base commune ?`)) return;
    setLoading(true);
    try {
      await deleteArticle(id);
      await loadArticles();
      if (onArticlesChanged) onArticlesChanged();
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = articles.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modalLarge} onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', maxHeight: '85vh' }}>
        <h2>📦 Base commune des articles</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
          Gérez les articles de référence, leurs unités par défaut et leurs catégories.
        </p>

        {/* Search */}
        <div className={styles.formGroup} style={{ marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ padding: '0.65rem 0.75rem', width: '100%' }}
          />
        </div>

        {/* Scrollable list */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: '1.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem' }}>
          {filteredArticles.length === 0 ? (
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>
              {loading ? 'Chargement...' : 'Aucun article trouvé.'}
            </p>
          ) : (
            <div className={catStyles.list} style={{ gap: '0.5rem' }}>
              {filteredArticles.map(a => (
                <div key={a.id} className={catStyles.item} style={{ padding: '0.5rem 0.75rem' }}>
                  {editingId === a.id ? (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', width: '100%', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        style={{ padding: '0.4rem', flex: '1', minWidth: '150px' }}
                      />
                      <select value={editUnit} onChange={e => setEditUnit(e.target.value)} style={{ padding: '0.4rem' }}>
                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                      <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ padding: '0.4rem' }}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button className={catStyles.saveBtn} onClick={() => handleSaveEdit(a.id!)}>✓</button>
                      <button className={catStyles.cancelBtn} onClick={() => setEditingId(null)}>✕</button>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span className={catStyles.itemName} style={{ fontWeight: '600' }}>{a.name}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          Unité : {a.defaultUnit} • Catégorie : {a.category}
                        </span>
                      </div>
                      <div className={catStyles.itemActions}>
                        <button className={catStyles.editBtn} onClick={() => handleStartEdit(a)} title="Modifier">✏️</button>
                        <button className={catStyles.deleteBtn} onClick={() => handleDelete(a.id!, a.name)} title="Supprimer">🗑️</button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Article Form */}
        <form onSubmit={handleAdd} style={{ borderTop: '2px solid var(--color-bg)', paddingTop: '1.25rem' }}>
          <h4 style={{ marginBottom: '0.75rem', color: 'var(--color-primary)' }}>Créer un nouvel article</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'flex-end' }}>
            <div className={styles.formGroup} style={{ flex: 2, minWidth: '180px', marginBottom: 0 }}>
              <input
                type="text"
                placeholder="Nom de l'article (ex: Pâtes)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                style={{ padding: '0.65rem' }}
              />
            </div>
            <div className={styles.formGroup} style={{ flex: 1, minWidth: '100px', marginBottom: 0 }}>
              <select value={newUnit} onChange={e => setNewUnit(e.target.value)} style={{ padding: '0.65rem' }}>
                {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className={styles.formGroup} style={{ flex: 1, minWidth: '110px', marginBottom: 0 }}>
              <select value={newCategory} onChange={e => setNewCategory(e.target.value)} style={{ padding: '0.65rem' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Button type="submit" disabled={loading || !newName.trim()}>Ajouter</Button>
          </div>
        </form>

        <div className={styles.actions} style={{ marginTop: '1.5rem' }}>
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </div>
  );
}
