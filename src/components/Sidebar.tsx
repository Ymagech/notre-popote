"use client";

import React, { useEffect, useState } from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '@/context/AuthContext';
import { useFilters } from '@/context/FilterContext';
import { getSettings } from '@/lib/settingsService';
import { getRecipes } from '@/lib/recipeService';
import { AppSettings, Recipe } from '@/types';
import CategoryManagerModal from './CategoryManagerModal';
import { usePathname, useRouter } from 'next/navigation';

export default function Sidebar() {
  const { user, logOut } = useAuth();
  const { activeCategory, activeOrigin, setActiveCategory, setActiveOrigin, clearFilters } = useFilters();
  const [settings, setSettings] = useState<AppSettings>({ mealCategories: [], originCategories: [] });
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalTab, setCategoryModalTab] = useState<'meal' | 'origin'>('meal');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter();

  const loadData = () => {
    getSettings().then(setSettings);
    getRecipes().then(setRecipes);
  };

  useEffect(() => {
    loadData();
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

  const handleCategoryClick = (cat: string) => {
    setActiveOrigin(null);
    setActiveCategory(activeCategory === cat ? null : cat);
    if (pathname !== '/') {
      router.push('/');
    }
    setIsMobileOpen(false);
  };

  const handleOriginClick = (origin: string) => {
    setActiveCategory(null);
    setActiveOrigin(activeOrigin === origin ? null : origin);
    if (pathname !== '/') {
      router.push('/');
    }
    setIsMobileOpen(false);
  };

  const handleClearFilters = () => {
    clearFilters();
    if (pathname !== '/') {
      router.push('/');
    }
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

        {/* Navigation Section */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>📅 NAVIGATION</h3>
          <ul className={styles.navList} style={{ marginTop: '0.5rem' }}>
            <li 
              className={`${styles.navItem} ${pathname === '/' ? styles.active : ''}`}
              onClick={() => { router.push('/'); setIsMobileOpen(false); }}
            >
              <span>📖 Recettes</span>
            </li>
            <li 
              className={`${styles.navItem} ${pathname === '/shopping-list' ? styles.active : ''}`}
              onClick={() => { router.push('/shopping-list'); setIsMobileOpen(false); }}
            >
              <span>📝 Liste de courses</span>
            </li>
            <li 
              className={`${styles.navItem} ${pathname === '/calendar' ? styles.active : ''}`}
              onClick={() => { router.push('/calendar'); setIsMobileOpen(false); }}
            >
              <span>📅 Calendrier de menus</span>
            </li>
          </ul>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3 className={styles.sectionTitle}>🍴 CATÉGORIES DE REPAS</h3>
            <button className={styles.settingsBtn} onClick={() => openCategoryManager('meal')} title="Gérer les catégories">⚙️</button>
          </div>
          <ul className={styles.navList}>
            <li
              className={`${styles.navItem} ${activeCategory === null && activeOrigin === null && pathname === '/' ? styles.active : ''}`}
              onClick={handleClearFilters}
            >
              <span>Toutes les catégories</span>
              <span className={styles.badge}>{recipes.length}</span>
            </li>
            {settings.mealCategories.map(cat => (
              <li
                key={cat}
                className={`${styles.navItem} ${activeCategory === cat && pathname === '/' ? styles.active : ''}`}
                onClick={() => handleCategoryClick(cat)}
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
              className={`${styles.navItem} ${activeOrigin === null && activeCategory === null && pathname === '/' ? styles.active : ''}`}
              onClick={handleClearFilters}
            >
              <span>Toutes les cuisines</span>
              <span className={styles.badge}>{recipes.length}</span>
            </li>
            {settings.originCategories.map(origin => (
              <li
                key={origin}
                className={`${styles.navItem} ${activeOrigin === origin && pathname === '/' ? styles.active : ''}`}
                onClick={() => handleOriginClick(origin)}
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
