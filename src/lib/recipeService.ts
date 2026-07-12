import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { Recipe } from '@/types';

const RECIPES_COLLECTION = 'recipes';

export async function addRecipe(recipe: Omit<Recipe, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, RECIPES_COLLECTION), {
    ...recipe,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function getRecipes(): Promise<Recipe[]> {
  const q = query(collection(db, RECIPES_COLLECTION), orderBy('createdAt', 'desc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Recipe));
}

export async function updateRecipe(id: string, updates: Partial<Recipe>): Promise<void> {
  const docRef = doc(db, RECIPES_COLLECTION, id);
  await updateDoc(docRef, updates);
}

export async function deleteRecipe(id: string): Promise<void> {
  await deleteDoc(doc(db, RECIPES_COLLECTION, id));
}
