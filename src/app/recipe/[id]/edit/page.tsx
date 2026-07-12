"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateRecipe } from '@/lib/recipeService';
import { uploadRecipeImage, deleteRecipeImage } from '@/lib/storageService';
import { getSettings } from '@/lib/settingsService';
import { Recipe, Ingredient, AppSettings } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import styles from '@/components/RecipeForm.module.css';

export default function EditRecipePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>({ mealCategories: [], originCategories: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeExistingImage, setRemoveExistingImage] = useState(false);
  const [calories, setCalories] = useState<number | ''>('');
  const [proteins, setProteins] = useState<number | ''>('');
  const [carbs, setCarbs] = useState<number | ''>('');
  const [fats, setFats] = useState<number | ''>('');

  useEffect(() => {
    const loadData = async () => {
      const [settingsData, docSnap] = await Promise.all([
        getSettings(),
        getDoc(doc(db, 'recipes', id)),
      ]);
      setSettings(settingsData);

      if (docSnap.exists()) {
        const recipe = docSnap.data() as Recipe;
        setTitle(recipe.title);
        setDescription(recipe.description || '');
        setCategory(recipe.category);
        setOrigin(recipe.origin);
        setPrepTime(recipe.prepTime);
        setCookTime(recipe.cookTime);
        setServings(recipe.servings || 4);
        setIngredients(recipe.ingredients?.length > 0 ? recipe.ingredients : [{ name: '', quantity: 0, unit: 'g' }]);
        setInstructions(recipe.instructions?.length > 0 ? recipe.instructions : ['']);
        if (recipe.imageUrl) setExistingImageUrl(recipe.imageUrl);
        if (recipe.nutritionalValues) {
          setCalories(recipe.nutritionalValues.calories ?? '');
          setProteins(recipe.nutritionalValues.proteins ?? '');
          setCarbs(recipe.nutritionalValues.carbs ?? '');
          setFats(recipe.nutritionalValues.fats ?? '');
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  // Ingredients
  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g' }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const updateIngredientField = (i: number, field: keyof Ingredient, value: string | number) => {
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
      setRemoveExistingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveExistingImage(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);

    const nutritionalValues = (calories || proteins || carbs || fats) ? {
      calories: calories || undefined,
      proteins: proteins || undefined,
      carbs: carbs || undefined,
      fats: fats || undefined,
    } : undefined;

    const filteredIngredients = ingredients.filter(ing => ing.name.trim() !== '');
    const filteredInstructions = instructions.filter(inst => inst.trim() !== '');

    const updates: Partial<Recipe> = {
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
    };

    // Handle image changes
    if (removeExistingImage && !imageFile) {
      await deleteRecipeImage(id);
      updates.imageUrl = '';
    }
    if (imageFile) {
      if (existingImageUrl) await deleteRecipeImage(id);
      const imageUrl = await uploadRecipeImage(imageFile, id);
      updates.imageUrl = imageUrl;
    }

    await updateRecipe(id, updates);
    setSaving(false);
    router.push(`/recipe/${id}`);
  };

  if (loading) return <div style={{ padding: '2rem', color: 'var(--color-text-muted)' }}>Chargement...</div>;

  const displayedImage = imagePreview || (!removeExistingImage ? existingImageUrl : null);

  return (
    <div className={styles.formPage}>
      <Link href={`/recipe/${id}`} className={styles.backLink}>← Retour à la recette</Link>
      <h1 className={styles.pageTitle}>Modifier la recette</h1>

      <form onSubmit={handleSubmit}>
        {/* General Info */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>📝 Informations générales</h2>
          <div className={styles.formGroup}>
            <label>Titre de la recette *</label>
            <input type="text" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className={styles.formGroup}>
            <label>Description courte</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} />
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>Catégorie de repas</label>
              <select value={category} onChange={e => setCategory(e.target.value)}>
                {settings.mealCategories.map(c => <option key={c} value={c}>{c}</option>)}
                {category && !settings.mealCategories.includes(category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>
            <div className={styles.formGroup}>
              <label>Origine / Cuisine</label>
              <select value={origin} onChange={e => setOrigin(e.target.value)}>
                {settings.originCategories.map(o => <option key={o} value={o}>{o}</option>)}
                {origin && !settings.originCategories.includes(origin) && (
                  <option value={origin}>{origin}</option>
                )}
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
          {displayedImage ? (
            <div style={{ textAlign: 'center' }}>
              <div className={styles.imagePreview}>
                <Image src={displayedImage} alt="Aperçu" fill style={{ objectFit: 'cover' }} />
              </div>
              <button type="button" className={styles.removeImageBtn} onClick={handleRemoveImage}>Supprimer l&apos;image</button>
              <span style={{ margin: '0 0.5rem', color: 'var(--color-text-muted)' }}>ou</span>
              <button type="button" className={styles.removeImageBtn} style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }} onClick={() => fileInputRef.current?.click()}>Remplacer</button>
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
              <input className={styles.ingredientName} type="text" placeholder="Ingrédient"
                value={ing.name} onChange={e => updateIngredientField(i, 'name', e.target.value)} />
              <input className={styles.ingredientQty} type="number" min="0" step="0.1" placeholder="Qté"
                value={ing.quantity || ''} onChange={e => updateIngredientField(i, 'quantity', Number(e.target.value))} />
              <select className={styles.ingredientUnit} value={ing.unit} onChange={e => updateIngredientField(i, 'unit', e.target.value)}>
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
              <textarea placeholder={`Étape ${i + 1}...`} value={inst} onChange={e => updateInstruction(i, e.target.value)} />
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
          <Link href={`/recipe/${id}`}><Button type="button" variant="outline">Annuler</Button></Link>
          <Button type="submit" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer les modifications'}</Button>
        </div>
      </form>
    </div>
  );
}
