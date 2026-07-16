"use client";

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import modalStyles from '@/components/Modal.module.css';
import Button from '@/components/Button';
import { CalendarEntry, Recipe, ShoppingListItem } from '@/types';
import { getRecipes } from '@/lib/recipeService';
import { getSettings } from '@/lib/settingsService';
import { getCalendarEntries, addCalendarEntry, deleteCalendarEntry } from '@/lib/calendarService';
import { addItemsToShoppingList } from '@/lib/shoppingListService';
import Image from 'next/image';
import Link from 'next/link';

const DAY_NAMES = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealCategories, setMealCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State for adding directly from calendar slot
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ dateStr: string; mealType: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [customServings, setCustomServings] = useState<number>(4);
  const [isAddingWeekly, setIsAddingWeekly] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper date logic
  const getMonday = (d: Date) => {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(date.setDate(diff));
  };

  const monday = getMonday(currentDate);
  const daysOfWeek = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const startDateStr = daysOfWeek[0].toISOString().split('T')[0];
  const endDateStr = daysOfWeek[6].toISOString().split('T')[0];

  const loadData = async () => {
    setLoading(true);
    try {
      const activeEntries = await getCalendarEntries(startDateStr, endDateStr);
      setEntries(activeEntries);
      
      const allRecipes = await getRecipes();
      setRecipes(allRecipes);

      const settings = await getSettings();
      setMealCategories(settings.mealCategories);
    } catch (error) {
      console.error('Erreur lors du chargement des données du calendrier:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handlePrevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleRemoveEntry = async (id: string) => {
    if (!confirm('Voulez-vous retirer cette recette du calendrier ?')) return;
    try {
      await deleteCalendarEntry(id);
      setEntries(entries.filter(e => e.id !== id));
      showToast('🗑️ Recette retirée du calendrier');
    } catch (error) {
      console.error('Erreur lors du retrait:', error);
    }
  };

  const handleOpenAddModal = (dateStr: string, mealType: string) => {
    setSelectedSlot({ dateStr, mealType });
    setCustomServings(4);
    setSearchQuery('');
    setIsAddModalOpen(true);
  };

  const handleSelectRecipe = async (recipe: Recipe) => {
    if (!selectedSlot) return;
    try {
      await addCalendarEntry({
        date: selectedSlot.dateStr,
        mealType: selectedSlot.mealType,
        recipeId: recipe.id!,
        recipeTitle: recipe.title,
        recipeImageUrl: recipe.imageUrl || '',
        servings: customServings
      });
      setIsAddModalOpen(false);
      setSelectedSlot(null);
      loadData();
      showToast('📅 Recette planifiée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la planification:', error);
    }
  };

  // Add all ingredients of the planned meals of the week
  const handleAddAllIngredientsToShoppingList = async () => {
    if (entries.length === 0) {
      alert('Aucune recette planifiée pour cette semaine !');
      return;
    }
    
    setIsAddingWeekly(true);
    try {
      const itemsToAdd: Omit<ShoppingListItem, 'id' | 'createdAt' | 'checked'>[] = [];
      
      for (const entry of entries) {
        // Find corresponding recipe data to fetch its ingredients list
        const recipe = recipes.find(r => r.id === entry.recipeId);
        if (recipe && recipe.ingredients) {
          const plannedServings = entry.servings || recipe.servings || 4;
          const ratio = plannedServings / (recipe.servings || 4);
          
          recipe.ingredients.forEach(ing => {
            itemsToAdd.push({
              name: ing.name,
              quantity: Math.round((ing.quantity * ratio) * 100) / 100,
              unit: ing.unit,
              recipeId: recipe.id,
              recipeTitle: recipe.title
            });
          });
        }
      }

      if (itemsToAdd.length === 0) {
        alert('Aucun ingrédient trouvé dans les recettes de cette semaine.');
        setIsAddingWeekly(false);
        return;
      }

      await addItemsToShoppingList(itemsToAdd);
      showToast(`🛒 ${itemsToAdd.length} ingrédients ajoutés à la liste de courses !`);
    } catch (error) {
      console.error('Erreur lors de l\'export des ingrédients de la semaine:', error);
      alert('Une erreur est survenue.');
    } finally {
      setIsAddingWeekly(false);
    }
  };

  // Filter recipes for direct search modal
  const filteredRecipes = recipes.filter(recipe => {
    return recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
           recipe.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
           recipe.origin.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const startStr = daysOfWeek[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
  const endStr = daysOfWeek[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>📅 Menu de la semaine</h1>
          <p className={styles.subtitle}>Semaine du {startStr} au {endStr}</p>
        </div>
        
        <div className={styles.headerActions}>
          <div className={styles.navBtns}>
            <button className={styles.navBtn} onClick={handlePrevWeek} title="Semaine précédente">←</button>
            <button className={styles.navBtn} onClick={handleToday}>{"Aujourd'hui"}</button>
            <button className={styles.navBtn} onClick={handleNextWeek} title="Semaine suivante">→</button>
          </div>
          <Button 
            variant="outline" 
            onClick={handleAddAllIngredientsToShoppingList} 
            disabled={entries.length === 0 || isAddingWeekly}
          >
            {isAddingWeekly ? 'Ajout...' : '🛒 Courses de la semaine'}
          </Button>
        </div>
      </header>

      {loading ? (
        <p className={styles.loadingState}>Chargement du calendrier...</p>
      ) : (
        <div className={styles.calendarGrid}>
          {daysOfWeek.map((day, idx) => {
            const dateStr = day.toISOString().split('T')[0];
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            
            return (
              <div key={dateStr} className={`${styles.dayCard} ${isToday ? styles.todayCard : ''}`}>
                <div className={styles.dayHeader}>
                  <span className={styles.dayName}>{DAY_NAMES[idx]}</span>
                  <span className={styles.dayDate}>
                    {day.toLocaleDateString('fr-FR', { day: 'numeric', month: 'numeric' })}
                  </span>
                </div>

                <div className={styles.mealsList}>
                  {mealCategories.map(mealType => {
                    // Find if there's an entry for this day and this meal slot
                    const slotEntry = entries.find(
                      e => e.date === dateStr && e.mealType === mealType
                    );

                    return (
                      <div key={mealType} className={styles.mealSlot}>
                        <div className={styles.mealLabel}>{mealType}</div>
                        
                        {slotEntry ? (
                          <div className={styles.plannedCard}>
                            {slotEntry.recipeImageUrl && (
                              <div className={styles.plannedImageWrapper}>
                                <Image
                                  src={slotEntry.recipeImageUrl}
                                  alt={slotEntry.recipeTitle}
                                  fill
                                  style={{ objectFit: 'cover' }}
                                  sizes="100px"
                                />
                              </div>
                            )}
                            <div className={styles.plannedInfo}>
                              <Link href={`/recipe/${slotEntry.recipeId}`} className={styles.plannedTitle}>
                                {slotEntry.recipeTitle}
                              </Link>
                              {slotEntry.servings && (
                                <span className={styles.plannedServings}>👥 {slotEntry.servings} pers.</span>
                              )}
                            </div>
                            <button 
                              className={styles.removeSlotBtn}
                              onClick={() => handleRemoveEntry(slotEntry.id!)}
                              title="Retirer"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button 
                            className={styles.addSlotBtn}
                            onClick={() => handleOpenAddModal(dateStr, mealType)}
                          >
                            + Ajouter une recette
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Recipe directly from Slot Modal */}
      {isAddModalOpen && selectedSlot && (
        <div className={modalStyles.overlay} onClick={() => setIsAddModalOpen(false)}>
          <div className={modalStyles.modalLarge} onClick={e => e.stopPropagation()}>
            <h2>Planifier un repas</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
              Planifier le <strong>{selectedSlot.dateStr}</strong> pour le <strong>{selectedSlot.mealType}</strong>
            </p>

            <div className={modalStyles.formGroup} style={{ marginBottom: '1.5rem' }}>
              <label htmlFor="calendar-servings">Nombre de portions (personnes)</label>
              <input
                id="calendar-servings"
                type="number"
                min="1"
                value={customServings}
                onChange={e => setCustomServings(Math.max(1, Number(e.target.value) || 4))}
              />
            </div>

            <div className={modalStyles.formGroup} style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Rechercher une recette par titre, pays, catégorie..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ padding: '0.75rem', width: '100%' }}
              />
            </div>

            <div className={styles.modalRecipeList}>
              {filteredRecipes.map(recipe => (
                <div key={recipe.id} className={styles.modalRecipeItem} onClick={() => handleSelectRecipe(recipe)}>
                  <div className={styles.modalRecipeImage}>
                    {recipe.imageUrl ? (
                      <Image 
                        src={recipe.imageUrl} 
                        alt={recipe.title} 
                        fill 
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className={styles.modalPlaceholder}>🍲</div>
                    )}
                  </div>
                  <div className={styles.modalRecipeInfo}>
                    <h4 className={styles.modalRecipeTitle}>{recipe.title}</h4>
                    <p className={styles.modalRecipeMeta}>{recipe.category} • {recipe.origin}</p>
                  </div>
                  <Button size="sm">Sélectionner</Button>
                </div>
              ))}
              {filteredRecipes.length === 0 && (
                <p className={styles.modalEmpty}>Aucune recette trouvée.</p>
              )}
            </div>

            <div className={modalStyles.actions}>
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Fermer</Button>
            </div>
          </div>
        </div>
      )}

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
