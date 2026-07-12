"use client";

import React from 'react';
import styles from './Sidebar.module.css';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar() {
  const { user, logOut } = useAuth();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'N'}
        </div>
        <div>
          <h2 className={styles.title}>Notre Popote</h2>
          <p className={styles.subtitle}>FAMILLE & PARTAGE</p>
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
          <button onClick={logOut} className={styles.logoutButton}>
            Déconnexion
          </button>
        </div>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🍴 CATÉGORIES DE REPAS</h3>
        <ul className={styles.navList}>
          <li className={styles.navItem}>Déjeuner</li>
          <li className={styles.navItem}>Dîner</li>
          <li className={styles.navItem}>Souper</li>
        </ul>
      </div>

      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>🌍 ORIGINES & CUISINES</h3>
        <ul className={styles.navList}>
          <li className={`${styles.navItem} ${styles.active}`}>
            <span>Toutes les cuisines</span>
            <span className={styles.badge}>4</span>
          </li>
          <li className={styles.navItem}>
            <span>Français</span>
            <span className={styles.badge}>2</span>
          </li>
          <li className={styles.navItem}>
            <span>Italien</span>
            <span className={styles.badge}>1</span>
          </li>
          <li className={styles.navItem}>
            <span>Thaï</span>
            <span className={styles.badge}>1</span>
          </li>
          <li className={styles.navItem}>
            <span>✨ Autres origines</span>
            <span className={styles.badge}>0</span>
          </li>
        </ul>
      </div>
    </aside>
  );
}
