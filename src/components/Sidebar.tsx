"use client";

import React, { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { getSettings } from '@/lib/settingsService';
import { getRecipes } from '@/lib/recipeService';
import { AppSettings, Recipe } from '@/types';
import CategoryManagerModal from './CategoryManagerModal';

export default function Sidebar() {
  const { user, logOut } = useAuth();
  const { activeCategory, activeOrigin, setActiveCategory, setActiveOrigin, clearFilters } = useFilters();
  const [settings, setSettings] = useState<AppSettings>({ mealCategories: [], originCategories: [] });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTab, setCategoryModalTab] = useState<'meal' | 'origin'>('meal');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const loadData = () => {
    getSettings().then(setSettings);
    getRecipes().then(setRecipes);
  };

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getOriginCount = (origin: string) =>
    recipes.filter(r => r.origin === origin).length;

  const getCategoryCount = (category: string) =>
    recipes.filter(r => r.category === category).length;

  const openCategoryManager = (tab: 'meal' | 'origin') => {
    setCategoryModalTab(tab);
    setIsCategoryModalOpen(true);
    setIsMobileOpen(false);
  };

  return (
    <>
      <button 
        className={`${styles.mobileToggle} ${isMobileOpen ? styles.toggleOpen : ''}`}
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Menu"
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {isMobileOpen && (
        <div className={styles.backdrop} onClick={() => setIsMobileOpen(false)} />
      )}

      <aside className={`${styles.sidebar} ${isMobileOpen ? styles.open : ''}`}>
        <div className={styles.header}>
          <div className={styles.avatar}>
            {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'P'}
          </div>
          <div>
            <h2 className={styles.title}>Notre Popote</h2>
            <p className={styles.subtitle}>FAMILLE &amp; PARTAGE</p>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.syncCard}>
            <div className={styles.syncStatus}>
              <span className={styles.statusDot}></span> EN LIGNE
            </div>
            <p className={styles.syncText}>
              Connecté en tant que <strong>{user?.email}</strong>. Vos données sont synchronisées avec Firebase.
            </p>
            <button onClick={() => { logOut(); setIsMobileOpen(false); }} className={styles.logoutButton}>
              Déconnexion
            </button>
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>🍴 CATÉGORIES DE REPAS</h3>
            <button className={styles.settingsBtn} onClick={() => openCategoryManager('meal')} title="Gérer les catégories">⚙️</button>
          </div>
          <ul className={styles.navList}>
            <li
              className={`${styles.navItem} ${activeCategory === null && activeOrigin === null ? styles.active : ''}`}
              onClick={() => { clearFilters(); setIsMobileOpen(false); }}
            >
              <span>Toutes les catégories</span>
              <span className={styles.badge}>{recipes.length}</span>
            </li>
            {settings.mealCategories.map(cat => (
              <li
                key={cat}
                className={`${styles.navItem} ${activeCategory === cat ? styles.active : ''}`}
                onClick={() => {
                  setActiveOrigin(null);
                  setActiveCategory(activeCategory === cat ? null : cat);
                  setIsMobileOpen(false);
                }}
              >
                <span>{cat}</span>
                <span className={styles.badge}>{getCategoryCount(cat)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>🌍 ORIGINES &amp; CUISINES</h3>
            <button className={styles.settingsBtn} onClick={() => openCategoryManager('origin')} title="Gérer les origines">⚙️</button>
          </div>
          <ul className={styles.navList}>
            <li
              className={`${styles.navItem} ${activeOrigin === null && activeCategory === null ? styles.active : ''}`}
              onClick={() => { clearFilters(); setIsMobileOpen(false); }}
            >
              <span>Toutes les cuisines</span>
              <span className={styles.badge}>{recipes.length}</span>
            </li>
            {settings.originCategories.map(origin => (
              <li
                key={origin}
                className={`${styles.navItem} ${activeOrigin === origin ? styles.active : ''}`}
                onClick={() => {
                  setActiveCategory(null);
                  setActiveOrigin(activeOrigin === origin ? null : origin);
                  setIsMobileOpen(false);
                }}
              >
                <span>{origin}</span>
                <span className={styles.badge}>{getOriginCount(origin)}</span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        settings={settings}
        onSettingsChanged={loadData}
        initialTab={categoryModalTab}
      />
    </>
  );
}
