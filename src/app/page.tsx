import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>Bienvenue sur Notre Popote</h1>
        <p>L'application familiale pour gérer vos repas.</p>
      </main>
    </div>
  );
}
