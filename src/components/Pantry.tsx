import React, { useEffect, useState } from 'react';
import styles from './Pantry.module.css';
import { getPantryItems, updatePantryItem, addPantryItem } from '@/lib/pantryService';
import { PantryItem, Article } from '@/types';
import Button from './Button';
import PantryItemModal from './PantryItemModal';
import ArticleManagerModal from './ArticleManagerModal';
import { getArticles, findOrCreateArticleByName } from '@/lib/articleService';

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  const loadData = async () => {
    try {
      const [pantryData, articlesData] = await Promise.all([
        getPantryItems(),
        getArticles()
      ]);
      setItems(pantryData);
      setArticles(articlesData);
    } catch (error) {
      console.error("Erreur lors du chargement du garde-manger/articles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, []);

  const handleUpdateQuantity = async (id: string, newQuantity: number) => {
    if (newQuantity < 0) return;
    
    // Optimistic UI update
    setItems(items.map(item => item.id === id ? { ...item, quantity: newQuantity } : item));
    
    try {
      await updatePantryItem(id, { quantity: newQuantity });
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      // Revert in real app, simple log for now
      window.location.reload();
    }
  };

  const handleSavePantryItem = async (itemData: Omit<PantryItem, 'id' | 'createdAt'>) => {
    await findOrCreateArticleByName(itemData.name, itemData.unit, itemData.category);
    await addPantryItem(itemData);
    await loadData();
  };

  if (loading) return <div>Chargement du garde-manger...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Garde-manger Familial</h2>
          <p className={styles.subtitle}>INGRÉDIENTS EN STOCK & ALERTES</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Button variant="outline" onClick={() => setIsArticleModalOpen(true)}>Gérer les articles 📦</Button>
          <Button onClick={() => setIsModalOpen(true)}>+ Nouvel Article</Button>
        </div>
      </div>

      <div className={styles.grid}>
        {items.map(item => {
          // Simple logic for status based on alertThreshold
          const status = item.quantity <= item.alertThreshold ? 'À RACHETER' : 'EN STOCK';
          const percentage = item.alertThreshold > 0 ? Math.min(100, Math.round((item.quantity / (item.alertThreshold * 3)) * 100)) : 100;
          
          return (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <span className={`${styles.badge} ${status === 'EN STOCK' ? styles.badgeSuccess : styles.badgeDanger}`}>
                  {status}
                </span>
              </div>
              <div className={styles.amount}>
                {item.quantity} {item.unit} (Alerte: {item.alertThreshold})
              </div>
              
              <div className={styles.progressContainer}>
                <div 
                  className={styles.progressBar}
                  style={{ width: `${percentage}%`, backgroundColor: status === 'EN STOCK' ? 'var(--color-primary)' : 'var(--color-danger)' }}
                ></div>
              </div>
              
              <div className={styles.actions}>
                <div className={styles.quantityControls}>
                  <button onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}>-</button>
                  <button onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}>+</button>
                </div>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className={styles.empty}>Votre garde-manger est vide.</p>
        )}
      </div>

      <PantryItemModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSavePantryItem} 
        articles={articles}
      />

      <ArticleManagerModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        onArticlesChanged={loadData}
      />
    </div>
  );
}
