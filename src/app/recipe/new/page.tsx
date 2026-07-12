"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addRecipe } from '@/lib/recipeService';
import { updateRecipe } from '@/lib/recipeService';
import { uploadRecipeImage } from '@/lib/storageService';
import { getSettings } from '@/lib/settingsService';
import { Ingredient, AppSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import styles from '@/components/RecipeForm.module.css';

export default function NewRecipePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>({ mealCategories: [], originCategories: [] });
  const [loading, setLoading] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [origin, setOrigin] = useState('');
  const [prepTime, setPrepTime] = useState(15);
  const [cookTime, setCookTime] = useState(30);
  const [servings, setServings] = useState(4);
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', quantity: 0, unit: 'g' }]);
  const [instructions, setInstructions] = useState<string[]>(['']);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [calories, setCalories] = useState<number | ''>('');
  const [proteins, setProteins] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fats, setFats] = useState<number | ''>('');

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      if (s.mealCategories.length > 0) setCategory(s.mealCategories[0]);
      if (s.originCategories.length > 0) setOrigin(s.originCategories[0]);
    });
  }, []);

  // Ingredients
  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g' }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredient = (i: number, field: keyof Ingredient, value: string | number) => {
    const updated = [...ingredients];
    (updated[i] as unknown as Record<string, string | number>)[field] = value;
    setIngredients(updated);
  };

  // Instructions
  const addInstruction = () => setInstructions([...instructions, '']);
  const removeInstruction = (i: number) => setInstructions(instructions.filter((_, idx) => idx !== i));
  const updateInstruction = (i: number, value: string) => {
    const updated = [...instructions];
    updated[i] = value;
    setInstructions(updated);
  };

  // Image
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    const nutritionalValues = (calories || proteins || carbs || fats) ? {
      calories: calories || undefined,
      proteins: proteins || undefined,
      carbs: carbs || undefined,
      fats: fats || undefined,
    } : undefined;

    const filteredIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    const filteredInstructions = instructions.filter(inst => inst.trim() !== '');

    // 1. Create recipe first
    const recipeId = await addRecipe({
      title: title.trim(),
      description: description.trim(),
      category,
      origin,
      prepTime,
      cookTime,
      servings,
      ingredients: filteredIngredients,
      instructions: filteredInstructions,
      nutritionalValues,
    });

    // 2. Upload image if selected
    if (imageFile) {
      const imageUrl = await uploadRecipeImage(imageFile, recipeId);
      await updateRecipe(recipeId, { imageUrl });
    }

    setLoading(false);
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <div className={styles.formPage}>
      <Link href="/" className={styles.backLink}>← Retour aux recettes</Link>
      <h1 className={styles.pageTitle}>Nouvelle Recette</h1>

      <form onSubmit={handleSubmit}>
        {/* General Info */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📝 Informations générales</h2>
          <div className={styles.formGroup}>
            <label>Titre de la recette *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Pâtes Carbonara" />
          </div>
          <div className={styles.formGroup}>
            <label>Description courte</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Décrivez votre recette en quelques mots..." />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Catégorie de repas</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {settings.mealCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Origine / Cuisine</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}>
                {settings.originCategories.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Préparation (min)</label>
              <input type="number" min="0" value={prepTime} onChange={e => setPrepTime(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label>Cuisson (min)</label>
              <input type="number" min="0" value={cookTime} onChange={e => setCookTime(Number(e.target.value))} />
            </div>
            <div className={styles.formGroup}>
              <label>Portions</label>
              <input type="number" min="1" value={servings} onChange={e => setServings(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Image */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📸 Image</h2>
          {imagePreview ? (
            <div style={{ textAlign: 'center' }}>
              <div className={styles.imagePreview}>
                <Image src={imagePreview} alt="Aperçu" fill style={{ objectFit: 'cover' }} />
              </div>
              <button type="button" className={styles.removeImageBtn} onClick={removeImage}>Supprimer l&apos;image</button>
            </div>
          ) : (
            <div className={styles.imageUploadZone} onClick={() => fileInputRef.current?.click()}>
              <span className={styles.imageUploadIcon}>📷</span>
              <span className={styles.imageUploadText}>Cliquez pour ajouter une photo</span>
            </div>
          )}
          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
        </div>

        {/* Ingredients */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>🧂 Ingrédients</h2>
          {ingredients.map((ing, i) => (
            <div key={i} className={styles.ingredientRow}>
              <input className={styles.ingredientName} type="text" placeholder="Nom de l'ingrédient"
                value={ing.name} onChange={e => updateIngredient(i, 'name', e.target.value)} />
              <input className={styles.ingredientQty} type="number" min="0" step="0.1" placeholder="Qté"
                value={ing.quantity || ''} onChange={e => updateIngredient(i, 'quantity', Number(e.target.value))} />
              <select className={styles.ingredientUnit} value={ing.unit} onChange={e => updateIngredient(i, 'unit', e.target.value)}>
                <option value="g">Grammes (g)</option>
                <option value="kg">Kilo (kg)</option>
                <option value="ml">Millilitres (ml)</option>
                <option value="L">Litres (L)</option>
                <option value="pièce">Pièce(s)</option>
                <option value="c.à.s">c. à soupe</option>
                <option value="c.à.c">c. à café</option>
                <option value="pincée">Pincée(s)</option>
                <option value="verre">Verre(s)</option>
                <option value="sachet">Sachet(s)</option>
                <option value="rouleau">Rouleau(x)</option>
                <option value="gousse">Gousse(s)</option>
              </select>
              {ingredients.length > 1 && (
                <button type="button" className={styles.removeBtn} onClick={() => removeIngredient(i)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addIngredient}>+ Ajouter un ingrédient</button>
        </div>

        {/* Instructions */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>👨‍🍳 Étapes de préparation</h2>
          {instructions.map((inst, i) => (
            <div key={i} className={styles.instructionRow}>
              <span className={styles.stepLabel}>{i + 1}</span>
              <textarea placeholder={`Étape ${i + 1}...`}
                value={inst} onChange={e => updateInstruction(i, e.target.value)} />
              {instructions.length > 1 && (
                <button type="button" className={styles.removeBtn} onClick={() => removeInstruction(i)}>✕</button>
              )}
            </div>
          ))}
          <button type="button" className={styles.addBtn} onClick={addInstruction}>+ Ajouter une étape</button>
        </div>

        {/* Nutritional Values */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📊 Valeurs nutritionnelles (optionnel)</h2>
          <div className={styles.nutritionGrid}>
            <div className={styles.formGroup}>
              <label>Calories (kcal/portion)</label>
              <input type="number" min="0" value={calories} onChange={e => setCalories(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className={styles.formGroup}>
              <label>Protéines (g)</label>
              <input type="number" min="0" step="0.1" value={proteins} onChange={e => setProteins(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className={styles.formGroup}>
              <label>Glucides (g)</label>
              <input type="number" min="0" step="0.1" value={carbs} onChange={e => setCarbs(e.target.value ? Number(e.target.value) : '')} />
            </div>
            <div className={styles.formGroup}>
              <label>Lipides (g)</label>
              <input type="number" min="0" step="0.1" value={fats} onChange={e => setFats(e.target.value ? Number(e.target.value) : '')} />
            </div>
          </div>
        </div>

        <div className={styles.submitBar}>
          <Link href="/"><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" disabled={loading}>{loading ? 'Création en cours...' : 'Créer la recette'}</Button>
        </div>
      </form>
    </div>
  );
}
