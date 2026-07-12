"use client";

import React, { useEffect, useState } from 'react';
import styles from './Pantry.module.css';
import { PantryItem, fetchPantryItems, updatePantryItem, getPantryStatus } from '@/lib/pantryService';
import Button from './Button';

export default function Pantry() {
  const [items, setItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItems = async () => {
      try {
        const data = await fetchPantryItems();
        setItems(data);
      } catch (error) {
        console.error("Erreur lors du chargement du garde-manger:", error);
      } finally {
        setLoading(false);
      }
    };
    loadItems();
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
    }
  };

  if (loading) return <div>Chargement du garde-manger...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h2 className={styles.title}>Garde-manger Familial</h2>
          <p className={styles.subtitle}>INGRÉDIENTS EN STOCK & ALERTES</p>
        </div>
        <Button>+ Nouvel Article</Button>
      </div>

      <div className={styles.grid}>
        {items.map(item => {
          const status = getPantryStatus(item.quantity, item.maxQuantity);
          const percentage = Math.round((item.quantity / item.maxQuantity) * 100);
          
          return (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3 className={styles.itemName}>{item.name}</h3>
                <span className={`${styles.badge} ${styles[status.replace(' ', '')]}`}>
                  {status}
                </span>
              </div>
              <div className={styles.amount}>
                {item.quantity} / {item.maxQuantity} {item.unit}
              </div>
              
              <div className={styles.progressContainer}>
                <div 
                  className={`${styles.progressBar} ${styles['bar' + status.replace(' ', '')]}`}
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
              
              <div className={styles.actions}>
                <div className={styles.quantityControls}>
                  <button onClick={() => handleUpdateQuantity(item.id!, item.quantity - 1)}>-</button>
                  <span>{percentage}%</span>
                  <button onClick={() => handleUpdateQuantity(item.id!, item.quantity + 1)}>+</button>
                </div>
                <button className={styles.editButton}>Edit</button>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <p className={styles.empty}>Votre garde-manger est vide.</p>
        )}
      </div>
    </div>
  );
}
