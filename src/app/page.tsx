"use client";

import React, { useEffect, useState } from "react";
import styles from "./page.module.css";
import Pantry from "@/components/Pantry";
import Button from "@/components/Button";
import RecipeModal from "@/components/RecipeModal";
import { Recipe } from "@/types";
import { getRecipes, addRecipe } from "@/lib/recipeService";
import { seedDatabase } from "@/lib/seedData";
import Image from "next/image";

export default function Home() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecipes().then(data => {
      setRecipes(data);
      setLoading(false);
    }).catch(error => {
      console.error("Erreur lors du chargement des recettes:", error);
      setLoading(false);
    });
  }, []);

  const handleSaveRecipe = async (recipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    await addRecipe(recipeData);
    // Reload is handled optimistically or let's just ignore for this prototype, or reload the page
    window.location.reload();
  };

  const handleSeed = async () => {
    if (confirm("Voulez-vous injecter les données de démonstration (4 recettes, 4 articles) ?")) {
      await seedDatabase();
      alert("Données injectées avec succès ! Rechargez la page.");
      window.location.reload();
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.topbar}>
        <div className={styles.searchBar}>
          <input type="text" placeholder="Rechercher par titre, ingrédient ou pays..." />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          {recipes.length === 0 && (
            <Button variant="outline" onClick={handleSeed}>Bouton Magique (Seed)</Button>
          )}
          <Button onClick={() => setIsRecipeModalOpen(true)}>+ Nouvelle Recette</Button>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.recipeSection}>
          <h2 style={{ marginBottom: '1.5rem', color: 'var(--color-primary)' }}>Vos Recettes</h2>
          
          {loading ? (
            <p>Chargement des recettes...</p>
          ) : recipes.length === 0 ? (
            <p>Aucune recette pour le moment. Cliquez sur &quot;Bouton Magique&quot; pour en générer ou créez-en une nouvelle !</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginBottom: '3rem' }}>
              {recipes.map(recipe => (
                <div key={recipe.id} style={{ backgroundColor: 'var(--color-card)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--shadow-md)' }}>
                  {recipe.imageUrl ? (
                    <div style={{ position: 'relative', height: '200px' }}>
                      <Image src={recipe.imageUrl} alt={recipe.title} fill style={{ objectFit: 'cover' }} />
                    </div>
                  ) : (
                    <div style={{ height: '200px', backgroundColor: 'var(--color-bg-alt)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: '3rem' }}>🍲</span>
                    </div>
                  )}
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--color-text)' }}>{recipe.title}</h3>
                      <span style={{ backgroundColor: 'var(--color-bg)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', color: 'var(--color-text-light)' }}>
                        {recipe.category}
                      </span>
                    </div>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.875rem', marginBottom: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {recipe.description}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                      <span>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
                      <span>🌍 {recipe.origin}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <Pantry />
      </main>

      <RecipeModal 
        isOpen={isRecipeModalOpen} 
        onClose={() => setIsRecipeModalOpen(false)} 
        onSave={handleSaveRecipe} 
      />
    </div>
  );
}
