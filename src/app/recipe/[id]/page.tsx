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
import { addItemsToShoppingList } from '@/lib/shoppingListService';
import AddToCalendarModal from '@/components/AddToCalendarModal';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);
  const [adjustedServings, setAdjustedServings] = useState(4);
  
  // New States
  const [selectedIngredients, setSelectedIngredients] = useState<number[]>([]);
  const [isAddingToShoppingList, setIsAddingToShoppingList] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadRecipe = async () => {
      const docRef = doc(db, 'recipes', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() } as Recipe;
        setRecipe(data);
        setAdjustedServings(data.servings || 4);
        if (data.ingredients) {
          setSelectedIngredients(data.ingredients.map((_, i) => i));
        }
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

  const handleToggleIngredient = (index: number) => {
    if (selectedIngredients.includes(index)) {
      setSelectedIngredients(selectedIngredients.filter(i => i !== index));
    } else {
      setSelectedIngredients([...selectedIngredients, index]);
    }
  };

  const handleToggleAllIngredients = () => {
    if (!recipe?.ingredients) return;
    if (selectedIngredients.length === recipe.ingredients.length) {
      setSelectedIngredients([]);
    } else {
      setSelectedIngredients(recipe.ingredients.map((_, i) => i));
    }
  };

  const handleAddToShoppingList = async () => {
    if (!recipe || selectedIngredients.length === 0) return;
    setIsAddingToShoppingList(true);
    try {
      const itemsToAdd = selectedIngredients.map(index => {
        const ing = recipe.ingredients[index];
        return {
          name: ing.name,
          quantity: getScaledQuantity(ing.quantity),
          unit: ing.unit,
          recipeId: recipe.id,
          recipeTitle: recipe.title
        };
      });
      
      await addItemsToShoppingList(itemsToAdd);
      
      setToastMessage('✅ Ingrédients ajoutés à la liste de courses !');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (error) {
      console.error('Erreur lors de l\'ajout des ingrédients:', error);
      alert('Erreur lors de l\'ajout des ingrédients.');
    } finally {
      setIsAddingToShoppingList(false);
    }
  };

  const handleCalendarSaved = (dateStr: string, mealType: string) => {
    setToastMessage(`📅 Recette planifiée pour le ${dateStr} (${mealType}) !`);
    setTimeout(() => setToastMessage(null), 3000);
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0, border: 'none' }}>🧂 Ingrédients</h2>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Button variant="outline" size="sm" onClick={handleToggleAllIngredients}>
                {selectedIngredients.length === recipe.ingredients.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </Button>
              <Button 
                onClick={handleAddToShoppingList} 
                disabled={selectedIngredients.length === 0 || isAddingToShoppingList}
              >
                {isAddingToShoppingList ? 'Ajout...' : `Ajouter à la liste (${selectedIngredients.length})`}
              </Button>
            </div>
          </div>
          <table className={styles.ingredientsTable}>
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={recipe.ingredients.length > 0 && selectedIngredients.length === recipe.ingredients.length}
                    onChange={handleToggleAllIngredients}
                    style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                  />
                </th>
                <th>Ingrédient</th>
                <th>Quantité</th>
                <th>Unité</th>
              </tr>
            </thead>
            <tbody>
              {recipe.ingredients.map((ing, i) => {
                const isSelected = selectedIngredients.includes(i);
                return (
                  <tr key={i} onClick={() => handleToggleIngredient(i)} style={{ cursor: 'pointer' }}>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleIngredient(i)}
                        style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                      />
                    </td>
                    <td style={{ fontWeight: isSelected ? '500' : 'normal', opacity: isSelected ? 1 : 0.6 }}>{ing.name}</td>
                    <td style={{ opacity: isSelected ? 1 : 0.6 }}>{getScaledQuantity(ing.quantity)}</td>
                    <td style={{ opacity: isSelected ? 1 : 0.6 }}>{ing.unit}</td>
                  </tr>
                );
              })}
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
        <Button variant="outline" onClick={() => setIsCalendarModalOpen(true)}>📅 Planifier</Button>
        <Button variant="danger" onClick={handleDelete}>🗑️ Supprimer</Button>
      </div>

      {/* Add To Calendar Modal */}
      <AddToCalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        recipe={recipe}
        servings={adjustedServings}
        onSaved={handleCalendarSaved}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '2rem',
          right: '2rem',
          backgroundColor: 'var(--color-primary)',
          color: 'white',
          padding: '1rem 1.5rem',
          borderRadius: 'var(--radius-md)',
          boxShadow: 'var(--shadow-lg)',
          zIndex: 1000,
          fontWeight: '500',
        }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
