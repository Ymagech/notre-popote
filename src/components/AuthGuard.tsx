"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import styles from './AuthGuard.module.css';
import Button from './Button';
import Image from 'next/image';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, signIn, loading, error: contextError } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signIn();
    } catch (error: unknown) {
      if (error instanceof Error) {
        setAuthError(error.message);
      } else {
        setAuthError("Une erreur est survenue lors de la connexion.");
      }
    }
  }

  if (loading) {
    return <div className={styles.loading}>Chargement de l&apos;application...</div>;
  }

  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.imagePanel}>
          <Image 
            src="/login_bg.jpg" 
            alt="Cuisine chaleureuse" 
            fill 
            style={{ objectFit: 'cover' }}
            priority
          />
          <div className={styles.imageOverlay}>
            <h1>Bienvenue dans<br/>Notre Popote</h1>
            <p>Le carnet de recettes familial et votre assistant pour les courses du quotidien.</p>
          </div>
        </div>
        <div className={styles.formPanel}>
          <div className={styles.loginBox}>
            <div className={styles.icon}>🍳</div>
            <h2>Connexion</h2>
            <p className={styles.subtitle}>
              Connectez-vous pour accéder aux recettes de la famille, planifier vos repas et gérer votre liste de courses.
            </p>
            
            {contextError && (
              <div className={styles.error}>
                {contextError}
              </div>
            )}

            {authError && (
              <div className={styles.error}>
                Erreur : {authError}
              </div>
            )}

            <Button onClick={handleLogin} fullWidth>
              Connexion avec Google
            </Button>

          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
