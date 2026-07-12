import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { AppSettings } from '@/types';

const SETTINGS_DOC = 'categories';
const SETTINGS_COLLECTION = 'settings';

const DEFAULT_SETTINGS: AppSettings = {
  mealCategories: ['Déjeuner', 'Dîner', 'Souper', 'Dessert', 'Apéritif'],
  originCategories: ['France', 'Italie', 'États-Unis', 'Thaï', 'Japon', 'Maroc', 'Inde', 'Mexique'],
};

export async function getSettings(): Promise<AppSettings> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    return docSnap.data() as AppSettings;
  }

  // First time: seed default settings
  await setDoc(docRef, DEFAULT_SETTINGS);
  return DEFAULT_SETTINGS;
}

export async function updateSettings(settings: Partial<AppSettings>): Promise<void> {
  const docRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);
  const current = await getSettings();
  await setDoc(docRef, { ...current, ...settings });
}

export async function addMealCategory(category: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.mealCategories.includes(category)) {
    settings.mealCategories.push(category);
    await updateSettings({ mealCategories: settings.mealCategories });
  }
}

export async function removeMealCategory(category: string): Promise<void> {
  const settings = await getSettings();
  settings.mealCategories = settings.mealCategories.filter(c => c !== category);
  await updateSettings({ mealCategories: settings.mealCategories });
}

export async function renameMealCategory(oldName: string, newName: string): Promise<void> {
  const settings = await getSettings();
  settings.mealCategories = settings.mealCategories.map(c => c === oldName ? newName : c);
  await updateSettings({ mealCategories: settings.mealCategories });
}

export async function addOriginCategory(category: string): Promise<void> {
  const settings = await getSettings();
  if (!settings.originCategories.includes(category)) {
    settings.originCategories.push(category);
    await updateSettings({ originCategories: settings.originCategories });
  }
}

export async function removeOriginCategory(category: string): Promise<void> {
  const settings = await getSettings();
  settings.originCategories = settings.originCategories.filter(c => c !== category);
  await updateSettings({ originCategories: settings.originCategories });
}

export async function renameOriginCategory(oldName: string, newName: string): Promise<void> {
  const settings = await getSettings();
  settings.originCategories = settings.originCategories.map(c => c === oldName ? newName : c);
  await updateSettings({ originCategories: settings.originCategories });
}
