"use client";

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addRecipe } from '@/lib/recipeService';
import { updateRecipe } from '@/lib/recipeService';
import { uploadRecipeImage } from '@/lib/storageService';
import { getSettings } from '@/lib/settingsService';
import { Ingredient, AppSettings, Article } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/Button';
import styles from '@/components/RecipeForm.module.css';
import { getArticles, findOrCreateArticleByName } from '@/lib/articleService';
import ArticleAutocomplete from '@/components/ArticleAutocomplete';
import ArticleManagerModal from '@/components/ArticleManagerModal';

export default function NewRecipePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<AppSettings>({ mealCategories: [], originCategories: [] });
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);

  // Importer state
  const [importedImageUrl, setImportedImageUrl] = useState('');
  const [showImporter, setShowImporter] = useState(false);
  const [importText, setImportText] = useState('');

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

  const loadArticlesData = () => {
    getArticles().then(setArticles);
  };

  useEffect(() => {
    getSettings().then(s => {
      setSettings(s);
      if (s.mealCategories.length > 0) setCategory(s.mealCategories[0]);
      if (s.originCategories.length > 0) setOrigin(s.originCategories[0]);
    });
    loadArticlesData();

    // Check query params for Bookmarklet import
    const searchParams = new URLSearchParams(window.location.search);
    const importParam = searchParams.get('import');
    if (importParam) {
      try {
        const data = JSON.parse(decodeURIComponent(importParam));
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.prepTime) setPrepTime(data.prepTime);
        if (data.cookTime) setCookTime(data.cookTime);
        if (data.servings) setServings(data.servings);
        
        if (data.ingredients && Array.isArray(data.ingredients)) {
          const parsedIngredients = data.ingredients.map((ing: string | { name: string }) => {
            const rawText = typeof ing === 'string' ? ing : ing.name;
            return parseIngredientText(rawText);
          });
          setIngredients(parsedIngredients);
        }
        
        if (data.instructions && Array.isArray(data.instructions)) {
          setInstructions(data.instructions);
        }
        
        if (data.imageUrl) {
          setImagePreview(data.imageUrl);
          setImportedImageUrl(data.imageUrl);
        }
      } catch (error) {
        console.error('Erreur lors du décodage de l\'import:', error);
      }
    }
  }, []);

  const handleTextImport = () => {
    if (!importText.trim()) return;
    const parsed = parseRecipeFromText(importText);
    
    if (parsed.title) setTitle(parsed.title);
    if (parsed.ingredients.length > 0) setIngredients(parsed.ingredients);
    if (parsed.instructions.length > 0) setInstructions(parsed.instructions);
    setPrepTime(parsed.prepTime);
    setCookTime(parsed.cookTime);
    setServings(parsed.servings);
    
    setImportText('');
    setShowImporter(false);
  };

  // Ingredients
  const addIngredient = () => setIngredients([...ingredients, { name: '', quantity: 0, unit: 'g' }]);
  const removeIngredient = (i: number) => setIngredients(ingredients.filter((_, idx) => idx !== i));
  const handleSelectArticle = (index: number, article: { name: string; defaultUnit: string; category: string }) => {
    updateIngredient(index, 'name', article.name);
    updateIngredient(index, 'unit', article.defaultUnit);
  };

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

    // Automatically register ingredients in the shared database
    for (const ing of filteredIngredients) {
      await findOrCreateArticleByName(ing.name.trim(), ing.unit, 'Autre');
    }


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
      imageUrl: importedImageUrl || undefined
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

      {/* Importer Section */}
      <div className={styles.section} style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: '1px', borderStyle: 'solid' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ✨ Importer une recette
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={() => setShowImporter(!showImporter)}>
            {showImporter ? 'Fermer' : "Ouvrir l'importateur"}
          </Button>
        </div>
        
        {showImporter && (
          <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4' }}>
              <strong style={{ color: 'var(--color-primary)' }}>Méthode 1 : Favori (Recommandé pour Cookidoo.ch)</strong><br />
              1. Glissez ou enregistrez ce lien dans vos favoris : <a 
                href="javascript:(function(){let recipe=null;document.querySelectorAll('script[type=%22application/ld%2Bjson%22]').forEach(script=>{try{const data=JSON.parse(script.innerText);const findRecipe=(obj)=>{if(!obj)return null;if(obj['@type']==='Recipe')return obj;if(Array.isArray(obj)){for(let item of obj){const r=findRecipe(item);if(r)return r;}}if(typeof obj==='object'){if(obj['@graph'])return findRecipe(obj['@graph']);for(let k in obj){const r=findRecipe(obj[k]);if(r)return r;}}return null;};const r=findRecipe(data);if(r)recipe=r;}catch(e){}});if(!recipe){alert(%22Aucune recette structur%C3%A9e trouv%C3%A9e sur cette page.%22);return;}const parseDuration=(iso)=>{if(!iso)return 0;const match=iso.match(/PT(?:(\\d+)H)?(?:(\\d+)M)?/);if(!match)return 0;const hours=parseInt(match[1])||0;const minutes=parseInt(match[2])||0;return hours*60%2Bminutes;};let servings=4;if(recipe.recipeYield){const yieldStr=Array.isArray(recipe.recipeYield)?recipe.recipeYield[0]:String(recipe.recipeYield);const match=yieldStr.match(/\\d%2B/);if(match)servings=parseInt(match[0]);}const ingredients=(recipe.recipeIngredient||[]).map(ing=>({name:ing,quantity:1,unit:'pi%C3%A8ce'}));const instructions=[];const steps=recipe.recipeInstructions||[];if(Array.isArray(steps)){steps.forEach(step=>{if(typeof step==='string'){instructions.push(step);}else if(step.text){instructions.push(step.text);}else if(step['@type']==='HowToStep'){instructions.push(step.text);}else if(Array.isArray(step.itemListElement)){step.itemListElement.forEach(sub=>{if(sub.text)instructions.push(sub.text);});}});}else if(typeof steps==='string'){instructions.push(steps);}let imageUrl='';if(recipe.image){imageUrl=Array.isArray(recipe.image)?recipe.image[0]:(typeof recipe.image==='object'?recipe.image.url:recipe.image);}const importData={title:recipe.name||document.title,description:recipe.description||'',prepTime:parseDuration(recipe.prepTime)||15,cookTime:parseDuration(recipe.cookTime)||30,servings:servings,ingredients:ingredients,instructions:instructions,imageUrl:imageUrl};const url='http://localhost:3000/recipe/new?import='%2BencodeURIComponent(JSON.stringify(importData));window.open(url,'_blank');})();"
                style={{ fontWeight: 'bold', color: '#16a34a', textDecoration: 'underline', backgroundColor: '#dcfce7', padding: '0.2rem 0.5rem', borderRadius: '4px', cursor: 'grab', display: 'inline-block', margin: '0.25rem 0' }}
                onClick={(e) => e.preventDefault()}
              >
                📥 Importer dans Notre Popote
              </a><br />
              2. Allez sur une recette sur <strong style={{ color: 'var(--color-text)' }}>Cookidoo.ch</strong> (ou Marmiton, Cookomix, NYT Cooking, etc.).<br />
              3. Cliquez sur le favori. La recette s’ouvrira préremplie ici !
            </div>
            
            <hr style={{ border: '0', borderTop: '1px solid var(--color-border)' }} />

            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label><strong style={{ color: 'var(--color-primary)' }}>Méthode 2 : Copier-coller du texte</strong></label>
              <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: '0.25rem 0' }}>
                Copiez le texte complet de la page de la recette (Titre, Ingrédients, Étapes) et collez-le ci-dessous.
              </p>
              <textarea
                rows={5}
                placeholder="Ex:&#10;Titre de la recette&#10;Ingrédients&#10;400 g de spaghetti&#10;4 oeufs&#10;Préparation&#10;1. Faire cuire les pâtes..."
                value={importText}
                onChange={e => setImportText(e.target.value)}
                style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}
              />
              <Button type="button" onClick={handleTextImport} style={{ marginTop: '0.5rem' }} disabled={!importText.trim()}>
                Analyser et Remplir
              </Button>
            </div>
          </div>
        )}
      </div>

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 className={styles.sectionTitle} style={{ marginBottom: 0 }}>🧂 Ingrédients</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setIsArticleModalOpen(true)}>
              Gérer les articles 📦
            </Button>
          </div>
          {ingredients.map((ing, i) => (
            <div key={i} className={styles.ingredientRow} style={{ overflow: 'visible', zIndex: 100 - i, position: 'relative' }}>
              <div style={{ flex: 2, position: 'relative' }}>
                <ArticleAutocomplete
                  value={ing.name}
                  onChange={val => updateIngredient(i, 'name', val)}
                  onSelectArticle={art => handleSelectArticle(i, art)}
                  articles={articles}
                  required
                  placeholder="Nom de l'ingrédient"
                />
              </div>
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

      <ArticleManagerModal
        isOpen={isArticleModalOpen}
        onClose={() => setIsArticleModalOpen(false)}
        onArticlesChanged={loadArticlesData}
      />
    </div>
  );
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase();
  if (u === 'g') return 'g';
  if (u === 'kg') return 'kg';
  if (u === 'ml') return 'ml';
  if (u === 'l' || u === 'litre' || u === 'litres') return 'L';
  if (u.includes('gousse')) return 'gousse';
  if (u.includes('cuillère') && u.includes('soupe') || u === 'c.à.s') return 'c.à.s';
  if (u.includes('cuillère') && u.includes('café') || u === 'c.à.c') return 'c.à.c';
  if (u.includes('pincée')) return 'pincée';
  if (u.includes('verre')) return 'verre';
  if (u.includes('sachet')) return 'sachet';
  return 'pièce';
}

function parseIngredientText(line: string) {
  const trimmed = line.trim();
  const qtyMatch = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*(g|kg|ml|l|cl|pièce|gousse|gousses|c\.à\.s|c\.à\.c|cuillère|cuillères|sachet|sachets|verre|verres|pincée|pincées)?(?:\s+de\s+|\s+d'\s+|\s+)?(.*)/i);
  
  if (qtyMatch) {
    const quantity = parseFloat(qtyMatch[1].replace(',', '.'));
    const unit = qtyMatch[2] ? qtyMatch[2].toLowerCase().trim() : 'pièce';
    const name = qtyMatch[3] ? qtyMatch[3].trim() : trimmed;
    
    return {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity,
      unit: normalizeUnit(unit)
    };
  }
  return {
    name: trimmed,
    quantity: 1,
    unit: 'pièce'
  };
}

function parseRecipeFromText(text: string) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l !== '');
  
  let title = '';
  const ingredients: { name: string; quantity: number; unit: string }[] = [];
  const instructions: string[] = [];
  let prepTime = 15;
  let cookTime = 30;
  let servings = 4;
  
  let currentSection: 'meta' | 'ingredients' | 'instructions' = 'meta';
  
  if (lines.length > 0) {
    title = lines[0];
  }
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes('ingrédient')) {
      currentSection = 'ingredients';
      continue;
    } else if (lowerLine.includes('préparation') || lowerLine.includes('étape') || lowerLine.includes('instruction')) {
      currentSection = 'instructions';
      continue;
    }
    
    if (currentSection === 'meta') {
      if (lowerLine.includes('portion') || lowerLine.includes('personne') || lowerLine.includes('parts')) {
        const match = line.match(/\d+/);
        if (match) servings = parseInt(match[0]);
      } else if (lowerLine.includes('préparation') && (lowerLine.includes('min') || lowerLine.includes('h'))) {
        const match = line.match(/\d+/);
        if (match) prepTime = parseInt(match[0]);
      } else if ((lowerLine.includes('total') || lowerLine.includes('cuisson')) && (lowerLine.includes('min') || lowerLine.includes('h'))) {
        const match = line.match(/\d+/);
        if (match) cookTime = parseInt(match[0]);
      }
    }
    else if (currentSection === 'ingredients') {
      ingredients.push(parseIngredientText(line));
    }
    else if (currentSection === 'instructions') {
      const cleanStep = line.replace(/^\d+[\s.:\-)]+/, '').trim();
      if (cleanStep) {
        instructions.push(cleanStep);
      }
    }
  }
  
  return { title, ingredients, instructions, prepTime, cookTime, servings };
}
