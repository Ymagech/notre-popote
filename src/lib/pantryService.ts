import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { PantryItem } from '@/types';

const PANTRY_COLLECTION = 'pantry';

export async function addPantryItem(item: Omit<PantryItem, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, PANTRY_COLLECTION), {
    ...item,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getPantryItems(): Promise<PantryItem[]> {
  const q = query(collection(db, PANTRY_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as PantryItem));
}

export async function updatePantryItem(id: string, updates: Partial<PantryItem>): Promise<void> {
  const docRef = doc(db, PANTRY_COLLECTION, id);
  await updateDoc(docRef, updates);
}

export async function deletePantryItem(id: string): Promise<void> {
  await deleteDoc(doc(db, PANTRY_COLLECTION, id));
}
