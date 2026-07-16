import { collection, getDocs, doc, deleteDoc, updateDoc, writeBatch, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { ShoppingListItem } from '@/types';

const SHOPPING_LIST_COLLECTION = 'shoppingList';

export async function getShoppingListItems(): Promise<ShoppingListItem[]> {
  const q = query(collection(db, SHOPPING_LIST_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as ShoppingListItem));
}

export async function addItemsToShoppingList(items: Omit<ShoppingListItem, 'id' | 'createdAt' | 'checked'>[]): Promise<void> {
  const currentItems = await getShoppingListItems();
  const batch = writeBatch(db);
  const collRef = collection(db, SHOPPING_LIST_COLLECTION);

  for (const item of items) {
    const nameLower = item.name.trim().toLowerCase();
    const unitLower = item.unit.trim().toLowerCase();

    // Find if item already exists (case-insensitive match on name and unit)
    const existing = currentItems.find(
      i => i.name.trim().toLowerCase() === nameLower && i.unit.trim().toLowerCase() === unitLower
    );

    if (existing) {
      const docRef = doc(db, SHOPPING_LIST_COLLECTION, existing.id!);
      batch.update(docRef, {
        quantity: Math.round((existing.quantity + item.quantity) * 100) / 100,
        checked: false,
        recipeId: item.recipeId || existing.recipeId || null,
        recipeTitle: item.recipeTitle || existing.recipeTitle || null
      });
    } else {
      const newDocRef = doc(collRef);
      batch.set(newDocRef, {
        name: item.name.trim(),
        quantity: item.quantity,
        unit: item.unit.trim(),
        checked: false,
        recipeId: item.recipeId || null,
        recipeTitle: item.recipeTitle || null,
        createdAt: serverTimestamp(),
      });
    }
  }

  await batch.commit();
}

export async function updateShoppingListItem(id: string, updates: Partial<ShoppingListItem>): Promise<void> {
  const docRef = doc(db, SHOPPING_LIST_COLLECTION, id);
  await updateDoc(docRef, updates);
}

export async function deleteShoppingListItem(id: string): Promise<void> {
  await deleteDoc(doc(db, SHOPPING_LIST_COLLECTION, id));
}

export async function clearShoppingList(onlyChecked: boolean = false): Promise<void> {
  const items = await getShoppingListItems();
  const batch = writeBatch(db);

  for (const item of items) {
    if (!onlyChecked || item.checked) {
      const docRef = doc(db, SHOPPING_LIST_COLLECTION, item.id!);
      batch.delete(docRef);
    }
  }

  await batch.commit();
}
