import styles from "./page.module.css";
import Pantry from "@/components/Pantry";

export default function Home() {
  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Rechercher par titre, ingrédient ou pays..." />
        </div>
        <button className={styles.newRecipeBtn}>+ Nouvelle Recette</button>
      </header>

      <main className={styles.main}>
        {/* Placeholder for future components */}
        
        {/* Garde-manger Component */}
        <Pantry />
      </main>
    </div>
  );
}
