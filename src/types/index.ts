export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  prepTime: number; // en minutes
  cookTime: number; // en minutes
  origin: string;
  category: 'Déjeuner' | 'Dîner' | 'Souper' | 'Dessert' | 'Autre';
  ingredients: Ingredient[];
  instructions: string[];
  imageUrl?: string;
  createdAt?: unknown; // Firestore Timestamp
}

export interface PantryItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'Épicerie' | 'Frais' | 'Surgelés' | 'Boissons' | 'Autre';
  alertThreshold: number; // Niveau d'alerte pour liste de courses
  createdAt?: unknown;
}
