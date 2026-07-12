import { db } from './firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';

export interface PantryItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  maxQuantity: number;
}

export const getPantryStatus = (quantity: number, maxQuantity: number): 'EN STOCK' | 'BAS' | 'ÉPUISÉ' => {
  if (quantity === 0) return 'ÉPUISÉ';
  if (quantity < maxQuantity * 0.25) return 'BAS';
  return 'EN STOCK';
};

const pantryCollection = collection(db, 'pantry');

export const fetchPantryItems = async (): Promise<PantryItem[]> => {
  const snapshot = await getDocs(pantryCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PantryItem));
};

export const addPantryItem = async (item: Omit<PantryItem, 'id'>) => {
  const docRef = await addDoc(pantryCollection, item);
  return { id: docRef.id, ...item };
};

export const updatePantryItem = async (id: string, updates: Partial<PantryItem>) => {
  const docRef = doc(db, 'pantry', id);
  await updateDoc(docRef, updates);
};

export const deletePantryItem = async (id: string) => {
  const docRef = doc(db, 'pantry', id);
  await deleteDoc(docRef);
};
