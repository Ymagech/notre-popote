import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Article } from '@/types';

const ARTICLES_COLLECTION = 'articles';

export async function getArticles(): Promise<Article[]> {
  const q = query(collection(db, ARTICLES_COLLECTION), orderBy('name', 'asc'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Article));
}

export async function addArticle(article: Omit<Article, 'id' | 'createdAt'>): Promise<string> {
  const docRef = await addDoc(collection(db, ARTICLES_COLLECTION), {
    name: article.name.trim(),
    defaultUnit: article.defaultUnit,
    category: article.category,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateArticle(id: string, updates: Partial<Article>): Promise<void> {
  const docRef = doc(db, ARTICLES_COLLECTION, id);
  const data: Record<string, string> = {};
  if (updates.name !== undefined) data.name = updates.name.trim();
  if (updates.defaultUnit !== undefined) data.defaultUnit = updates.defaultUnit;
  if (updates.category !== undefined) data.category = updates.category;
  
  await updateDoc(docRef, data);
}

export async function deleteArticle(id: string): Promise<void> {
  await deleteDoc(doc(db, ARTICLES_COLLECTION, id));
}

export async function findOrCreateArticleByName(
  name: string, 
  defaultUnit: string = 'pièce', 
  category: string = 'Autre'
): Promise<Article> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error('Article name cannot be empty');
  }

  const articles = await getArticles();
  const lowerName = trimmedName.toLowerCase();
  
  const existing = articles.find(a => a.name.toLowerCase() === lowerName);
  if (existing) {
    return existing;
  }

  const newId = await addArticle({
    name: trimmedName,
    defaultUnit,
    category
  });

  return {
    id: newId,
    name: trimmedName,
    defaultUnit,
    category
  };
}
