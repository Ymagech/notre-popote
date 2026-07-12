"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { deleteRecipe } from '@/lib/recipeService';
import { deleteRecipeImage } from '@/lib/storageService';
import { Recipe } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import styles from './page.module.css';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustedServings, setAdjustedServings] = useState(4);

  useEffect(() => {
    const loadRecipe = async () => {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Recipe;
        setRecipe(data);
        setAdjustedServings(data.servings || 4);
      }
      setLoading(false);
    };
    loadRecipe();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette recette ? Cette action est irréversible.')) return;
    if (recipe?.imageUrl) {
      await deleteRecipeImage(id);
    }
    await deleteRecipe(id);
    router.push('/');
  };

  const getScaledQuantity = (baseQuantity: number) => {
    if (!recipe?.servings || recipe.servings === 0) return baseQuantity;
    const ratio = adjustedServings / recipe.servings;
    const scaled = baseQuantity * ratio;
    return Math.round(scaled * 100) / 100;
  };

  if (loading) {
    return <div className={styles.loadingState}>Chargement de la recette...</div>;
  }

  if (!recipe) {
    return (
      <div className={styles.detailPage}>
        <Link href="/" className={styles.backLink}>← Retour aux recettes</Link>
        <p>Recette introuvable.</p>
      </div>
    );
  }

  return (
    <div className={styles.detailPage}>
      <Link href="/" className={styles.backLink}>← Retour aux recettes</Link>

      <div className={styles.heroImage}>
        {recipe.imageUrl ? (
          <Image
            src={recipe.imageUrl}
            alt={recipe.title}
            fill
            style={{ objectFit: 'cover' }}
            sizes="900px"
            priority
          />
        ) : (
          <div className={styles.heroPlaceholder}><span>🍲</span></div>
        )}
      </div>

      <div className={styles.titleRow}>
        <h1 className={styles.title}>{recipe.title}</h1>
        <div className={styles.badges}>
          <span className={`${styles.badge} ${styles.badgeCategory}`}>{recipe.category}</span>
          <span className={`${styles.badge} ${styles.badgeOrigin}`}>🌍 {recipe.origin}</span>
        </div>
      </div>

      <p className={styles.description}>{recipe.description}</p>

      <div className={styles.metaRow}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Préparation</span>
          <span className={styles.metaValue}>⏱️ {recipe.prepTime} min</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Cuisson</span>
          <span className={styles.metaValue}>🔥 {recipe.cookTime} min</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Total</span>
          <span className={styles.metaValue}>⏱️ {recipe.prepTime + recipe.cookTime} min</span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Portions</span>
          <div className={styles.portionAdjuster}>
            <button className={styles.portionBtn} onClick={() => setAdjustedServings(Math.max(1, adjustedServings - 1))}>−</button>
            <span className={styles.metaValue}>{adjustedServings}</span>
            <button className={styles.portionBtn} onClick={() => setAdjustedServings(adjustedServings + 1)}>+</button>
          </div>
        </div>
      </div>

      {recipe.ingredients && recipe.ingredients.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>🧂 Ingrédients</h2>
          <table className={styles.ingredientsTable}>
            <thead>
              <tr>
                <th>Ingrédient</th>
                <th>Quantité</th>
                <th>Unité</th>
              </tr>
            </thead>
            <tbody>
              {recipe.ingredients.map((ing, i) => (
                <tr key={i}>
                  <td>{ing.name}</td>
                  <td>{getScaledQuantity(ing.quantity)}</td>
                  <td>{ing.unit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {recipe.instructions && recipe.instructions.length > 0 && (
        <>
          <h2 className={styles.sectionTitle}>👨‍🍳 Préparation</h2>
          <ol className={styles.instructionsList}>
            {recipe.instructions.map((step, i) => (
              <li key={i} className={styles.instructionStep}>
                <span className={styles.stepNumber}>{i + 1}</span>
                <span className={styles.stepText}>{step}</span>
              </li>
            ))}
          </ol>
        </>
      )}

      {recipe.nutritionalValues && (
        <>
          <h2 className={styles.sectionTitle}>📊 Valeurs nutritionnelles (par portion)</h2>
          <div className={styles.nutritionGrid}>
            <div className={styles.nutritionCard}>
              <div className={styles.nutritionValue}>{recipe.nutritionalValues.calories ?? '—'}</div>
              <div className={styles.nutritionLabel}>kcal</div>
            </div>
            <div className={styles.nutritionCard}>
              <div className={styles.nutritionValue}>{recipe.nutritionalValues.proteins ?? '—'}</div>
              <div className={styles.nutritionLabel}>Protéines (g)</div>
            </div>
            <div className={styles.nutritionCard}>
              <div className={styles.nutritionValue}>{recipe.nutritionalValues.carbs ?? '—'}</div>
              <div className={styles.nutritionLabel}>Glucides (g)</div>
            </div>
            <div className={styles.nutritionCard}>
              <div className={styles.nutritionValue}>{recipe.nutritionalValues.fats ?? '—'}</div>
              <div className={styles.nutritionLabel}>Lipides (g)</div>
            </div>
          </div>
        </>
      )}

      <div className={styles.actionBar}>
        <Link href={`/recipe/${id}/edit`}>
          <Button>✏️ Modifier</Button>
        </Link>
        <Button variant="danger" onClick={handleDelete}>🗑️ Supprimer</Button>
      </div>
    </div>
  );
}
