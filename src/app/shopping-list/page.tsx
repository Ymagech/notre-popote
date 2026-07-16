"use client";

import React, { useEffect, useState } from 'react';
import styles from './page.module.css';
import Button from '@/components/Button';
import { ShoppingListItem } from '@/types';
import { 
  getShoppingListItems, 
  updateShoppingListItem, 
  deleteShoppingListItem, 
  clearShoppingList,
  addItemsToShoppingList
} from '@/lib/shoppingListService';

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Custom item inputs
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState('');

  // Bring! States
  const [bringEmail, setBringEmail] = useState('');
  const [bringPassword, setBringPassword] = useState('');
  const [bringLists, setBringLists] = useState<{ listUuid: string; name: string }[]>([]);
  const [selectedListUuid, setSelectedListUuid] = useState('');
  const [showBringSettings, setShowBringSettings] = useState(false);
  const [isFetchingLists, setIsFetchingLists] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const data = await getShoppingListItems();
      setItems(data);
    } catch (error) {
      console.error('Erreur lors du chargement de la liste de courses:', error);
    } finally {
      setLoading(false);
    }
  };

  // Bring! Logic (declared before useEffect to avoid hoisting/linter issue)
  const fetchBringLists = async (emailStr: string, passwordStr: string, autoSelectUuid?: string) => {
    if (!emailStr || !passwordStr) return;
    setIsFetchingLists(true);
    try {
      const response = await fetch('/api/bring/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailStr, password: passwordStr })
      });
      const data = await response.json();
      if (response.ok && data.lists) {
        setBringLists(data.lists);
        
        // Auto select first list or saved list
        if (data.lists.length > 0) {
          const matched = data.lists.find((l: { listUuid: string; name: string }) => l.listUuid === autoSelectUuid);
          const activeUuid = matched ? matched.listUuid : data.lists[0].listUuid;
          setSelectedListUuid(activeUuid);
          localStorage.setItem('bring_list_uuid', activeUuid);
        }
      } else {
        console.error('Bring! authentication failed:', data.error);
      }
    } catch (error) {
      console.error('Error connecting to Bring! API:', error);
    } finally {
      setIsFetchingLists(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadItems();
    
    // Load Bring! credentials from localStorage
    const savedEmail = localStorage.getItem('bring_email') || '';
    const savedPassword = localStorage.getItem('bring_password') || '';
    const savedListUuid = localStorage.getItem('bring_list_uuid') || '';
    
    setBringEmail(savedEmail);
    setBringPassword(savedPassword);
    
    if (savedEmail && savedPassword) {
      fetchBringLists(savedEmail, savedPassword, savedListUuid);
    }
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    try {
      await addItemsToShoppingList([{
        name: name.trim(),
        quantity: Number(quantity) || 1,
        unit: unit.trim()
      }]);
      
      setName('');
      setQuantity(1);
      setUnit('');
      loadItems();
      showToast('🛒 Article ajouté !');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'article:', error);
    }
  };

  const handleToggleChecked = async (item: ShoppingListItem) => {
    const newChecked = !item.checked;
    
    // Optimistic UI update
    setItems(items.map(i => i.id === item.id ? { ...i, checked: newChecked } : i));
    
    try {
      await updateShoppingListItem(item.id!, { checked: newChecked });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      loadItems();
    }
  };

  const handleUpdateQuantity = async (id: string, currentQty: number, change: number) => {
    const newQty = Math.max(0, currentQty + change);
    if (newQty === 0) {
      handleDeleteItem(id);
      return;
    }

    setItems(items.map(i => i.id === id ? { ...i, quantity: newQty } : i));
    try {
      await updateShoppingListItem(id, { quantity: newQty });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quantité:', error);
      loadItems();
    }
  };

  const handleDeleteItem = async (id: string) => {
    setItems(items.filter(i => i.id !== id));
    try {
      await deleteShoppingListItem(id);
      showToast('🗑️ Article supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      loadItems();
    }
  };

  const handleClear = async (onlyChecked: boolean) => {
    const confirmMsg = onlyChecked 
      ? 'Voulez-vous supprimer tous les articles cochés ?' 
      : 'Voulez-vous vider complètement la liste de courses ?';
      
    if (!confirm(confirmMsg)) return;

    setLoading(true);
    try {
      await clearShoppingList(onlyChecked);
      await loadItems();
      showToast(onlyChecked ? '🧹 Articles cochés supprimés' : '🧹 Liste vidée');
    } catch (error) {
      console.error('Erreur lors du nettoyage de la liste:', error);
      setLoading(false);
    }
  };

  const handleSaveBringSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('bring_email', bringEmail);
    localStorage.setItem('bring_password', bringPassword);
    fetchBringLists(bringEmail, bringPassword);
    showToast('💾 Paramètres Bring! enregistrés localement');
  };

  const handleDisconnectBring = () => {
    localStorage.removeItem('bring_email');
    localStorage.removeItem('bring_password');
    localStorage.removeItem('bring_list_uuid');
    setBringEmail('');
    setBringPassword('');
    setBringLists([]);
    setSelectedListUuid('');
    showToast('🔌 Bring! déconnecté');
  };

  const handleExportToBring = async () => {
    const uncheckedItems = items.filter(item => !item.checked);
    if (uncheckedItems.length === 0) {
      alert('Aucun article non coché à exporter !');
      return;
    }
    if (!bringEmail || !bringPassword || !selectedListUuid) {
      setShowBringSettings(true);
      alert('Veuillez configurer et tester vos identifiants Bring! avant l\'export.');
      return;
    }

    setIsExporting(true);
    try {
      const payload = uncheckedItems.map(item => ({
        name: item.name,
        specification: item.quantity ? `${item.quantity} ${item.unit || ''}`.trim() : ''
      }));

      const response = await fetch('/api/bring/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: bringEmail,
          password: bringPassword,
          listUuid: selectedListUuid,
          items: payload
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        showToast(`🚀 ${payload.length} articles exportés vers Bring!`);
      } else {
        alert(`Erreur Bring! : ${data.error || 'Erreur inconnue'}`);
      }
    } catch (error) {
      console.error('Error exporting to Bring!:', error);
      alert('Impossible d\'exporter vers Bring!.');
    } finally {
      setIsExporting(false);
    }
  };

  const uncheckedItems = items.filter(i => !i.checked);
  const checkedItems = items.filter(i => i.checked);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>📝 Liste de courses</h1>
          <p className={styles.subtitle}>ORGANISÉE & SYNCHRONISÉE</p>
        </div>
        
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => setShowBringSettings(!showBringSettings)}>
            {bringEmail ? '🦊 Bring! (Connecté)' : '🦊 Lier Bring!'}
          </Button>
          {items.length > 0 && (
            <>
              <Button variant="outline" onClick={() => handleClear(true)}>🧹 Nettoyer cochés</Button>
              <Button variant="danger" onClick={() => handleClear(false)}>🗑️ Tout vider</Button>
            </>
          )}
        </div>
      </header>

      {/* Bring! Integration panel */}
      {showBringSettings && (
        <section className={styles.bringCard}>
          <div className={styles.bringHeader}>
            <h3>🦊 Connexion Bring! (Local &amp; Sécurisé)</h3>
            {bringEmail && (
              <button className={styles.disconnectBtn} onClick={handleDisconnectBring}>
                Déconnexion
              </button>
            )}
          </div>
          <p className={styles.bringInfo}>
            Vos identifiants Bring! sont stockés uniquement dans le stockage local de votre navigateur. Ils ne sont jamais enregistrés sur nos serveurs.
          </p>

          <form onSubmit={handleSaveBringSettings} className={styles.bringForm}>
            <div className={styles.inputRow}>
              <input
                type="email"
                placeholder="Email Bring!"
                value={bringEmail}
                onChange={e => setBringEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Mot de passe"
                value={bringPassword}
                onChange={e => setBringPassword(e.target.value)}
                required
              />
              <Button type="submit" disabled={isFetchingLists}>
                {isFetchingLists ? 'Connexion...' : 'Valider'}
              </Button>
            </div>

            {bringLists.length > 0 && (
              <div className={styles.listSelectorRow}>
                <label htmlFor="bring-list-select">Liste cible :</label>
                <select
                  id="bring-list-select"
                  value={selectedListUuid}
                  onChange={e => {
                    setSelectedListUuid(e.target.value);
                    localStorage.setItem('bring_list_uuid', e.target.value);
                  }}
                >
                  {bringLists.map(list => (
                    <option key={list.listUuid} value={list.listUuid}>{list.name}</option>
                  ))}
                </select>
              </div>
            )}
          </form>
        </section>
      )}

      <main className={styles.mainGrid}>
        {/* Left column: Current List */}
        <section className={styles.listContainer}>
          <form onSubmit={handleAddItem} className={styles.addItemForm}>
            <input
              type="text"
              placeholder="Ajouter un article (ex: Bananes, Pâtes...)"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className={styles.itemNameInput}
            />
            <input
              type="number"
              step="any"
              placeholder="Qté"
              value={quantity}
              onChange={e => setQuantity(Number(e.target.value) || 1)}
              className={styles.qtyInput}
            />
            <input
              type="text"
              placeholder="Unité (g, l, pc...)"
              value={unit}
              onChange={e => setUnit(e.target.value)}
              className={styles.unitInput}
            />
            <Button type="submit">Ajouter</Button>
          </form>

          {loading ? (
            <p className={styles.emptyState}>Chargement de la liste...</p>
          ) : items.length === 0 ? (
            <div className={styles.emptyState}>
              <span>🛒</span>
              <p>Votre liste de courses est vide. Ajoutez des articles manuellement ou depuis les recettes !</p>
            </div>
          ) : (
            <div className={styles.shoppingSections}>
              {uncheckedItems.length > 0 && (
                <div className={styles.listSection}>
                  <div className={styles.sectionHeaderLine}>
                    <h3>À acheter ({uncheckedItems.length})</h3>
                    {bringEmail && selectedListUuid && (
                      <Button size="sm" onClick={handleExportToBring} disabled={isExporting}>
                        {isExporting ? 'Export en cours...' : '🚀 Transférer vers Bring!'}
                      </Button>
                    )}
                  </div>
                  <ul className={styles.itemList}>
                    {uncheckedItems.map(item => (
                      <li key={item.id} className={styles.itemRow}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleChecked(item)}
                          className={styles.itemCheckbox}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName}>{item.name}</span>
                          {item.recipeTitle && (
                            <span className={styles.itemSource}>🍳 {item.recipeTitle}</span>
                          )}
                        </div>
                        <div className={styles.itemQuantityArea}>
                          <button onClick={() => handleUpdateQuantity(item.id!, item.quantity, -1)}>-</button>
                          <span className={styles.itemQtyValue}>{item.quantity} {item.unit}</span>
                          <button onClick={() => handleUpdateQuantity(item.id!, item.quantity, 1)}>+</button>
                        </div>
                        <button className={styles.deleteItemBtn} onClick={() => handleDeleteItem(item.id!)} title="Supprimer">✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {checkedItems.length > 0 && (
                <div className={styles.listSection} style={{ opacity: 0.7 }}>
                  <h3>Déjà achetés ({checkedItems.length})</h3>
                  <ul className={styles.itemList}>
                    {checkedItems.map(item => (
                      <li key={item.id} className={`${styles.itemRow} ${styles.rowChecked}`}>
                        <input
                          type="checkbox"
                          checked={item.checked}
                          onChange={() => handleToggleChecked(item)}
                          className={styles.itemCheckbox}
                        />
                        <div className={styles.itemInfo}>
                          <span className={styles.itemName} style={{ textDecoration: 'line-through' }}>{item.name}</span>
                          {item.recipeTitle && (
                            <span className={styles.itemSource}>🍳 {item.recipeTitle}</span>
                          )}
                        </div>
                        <div className={styles.itemQuantityArea}>
                          <span className={styles.itemQtyValue}>{item.quantity} {item.unit}</span>
                        </div>
                        <button className={styles.deleteItemBtn} onClick={() => handleDeleteItem(item.id!)}>✕</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className={styles.toast}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
