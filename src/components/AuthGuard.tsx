"use client";

import { useAuth } from "@/context/AuthContext";
import styles from "./AuthGuard.module.css";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading, error, signIn } = useAuth();

  if (loading) {
    return <div className={styles.loading}>Chargement...</div>;
  }

  if (!user) {
    return (
      <div className={styles.loginContainer}>
        <div className={styles.loginBox}>
          <h1>Notre Popote</h1>
          <p>Connectez-vous pour accéder à vos recettes familiales et listes de courses.</p>
          {error && <div className={styles.error}>{error}</div>}
          <button onClick={signIn} className={styles.loginButton}>
            Connexion avec Google
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
