"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Pantry from "@/components/Pantry";
import Button from "@/components/Button";
import { Recipe } from "@/types";
import { getRecipes } from "@/lib/recipeService";
import { seedDatabase } from "@/lib/seedData";
import { useFilters } from "@/context/FilterContext";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const { activeCategory, activeOrigin, searchQuery, setSearchQuery } = useFilters();

  useEffect(() => {
    getRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    }).catch(error => {
      console.error("Erreur lors du chargement des recettes:", error);
      setLoading(false);
    });
  }, []);

  const handleSeed = async () => {
    if (confirm("Voulez-vous injecter les données de démonstration (4 recettes, 4 articles) ?")) {
      await seedDatabase();
      window.location.reload();
    }
  };

  // Apply filters
  const filteredRecipes = recipes.filter(recipe => {
    if (activeCategory && recipe.category !== activeCategory) return false;
    if (activeOrigin && recipe.origin !== activeOrigin) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = recipe.title.toLowerCase().includes(q);
      const matchDesc = recipe.description.toLowerCase().includes(q);
      const matchOrigin = recipe.origin.toLowerCase().includes(q);
      const matchIngredient = recipe.ingredients?.some(i => i.name.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchOrigin && !matchIngredient) return false;
    }
    return true;
  });

  const activeFilterLabel = activeCategory || activeOrigin || null;

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.searchBar}>
          <input
            type="text"
            placeholder="Rechercher par titre, ingrédient ou pays..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className={styles.topbarActions}>
          {recipes.length === 0 && (
            <Button variant="outline" onClick={handleSeed}>🪄 Données démo</Button>
          )}
          <Link href="/recipe/new">
            <Button>+ Nouvelle Recette</Button>
          </Link>
        </div>
      </header>

      <main className={styles.main}>
        <section>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              {activeFilterLabel ? `Recettes — ${activeFilterLabel}` : 'Vos Recettes'}
            </h2>
            <span className={styles.recipeCount}>{filteredRecipes.length} recette{filteredRecipes.length > 1 ? 's' : ''}</span>
          </div>

          {loading ? (
            <p className={styles.emptyState}>Chargement des recettes...</p>
          ) : filteredRecipes.length === 0 ? (
            <p className={styles.emptyState}>
              {recipes.length === 0
                ? 'Aucune recette pour le moment. Cliquez sur « 🪄 Données démo » pour commencer !'
                : 'Aucune recette ne correspond à vos filtres.'}
            </p>
          ) : (
            <div className={styles.recipeGrid}>
              {filteredRecipes.map(recipe => (
                <Link href={`/recipe/${recipe.id}`} key={recipe.id} className={styles.recipeCard}>
                  <div className={styles.recipeImageWrapper}>
                    {recipe.imageUrl ? (
                      <Image
                        src={recipe.imageUrl}
                        alt={recipe.title}
                        fill
                        style={{ objectFit: 'cover' }}
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className={styles.recipeImagePlaceholder}>
                        <span>🍲</span>
                      </div>
                    )}
                  </div>
                  <div className={styles.recipeCardBody}>
                    <div className={styles.recipeCardHeader}>
                      <h3 className={styles.recipeTitle}>{recipe.title}</h3>
                      <span className={styles.recipeBadge}>{recipe.category}</span>
                    </div>
                    <p className={styles.recipeDescription}>{recipe.description}</p>
                    <div className={styles.recipeMeta}>
                      <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                      <span>🌍 {recipe.origin}</span>
                      {recipe.servings && <span>👥 {recipe.servings} pers.</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <Pantry />
      </main>
    </div>
  );
}
