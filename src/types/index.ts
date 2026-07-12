export interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

export interface NutritionalValues {
  calories?: number;  // kcal par portion
  proteins?: number;  // g
  carbs?: number;     // g
  fats?: number;      // g
}

export interface Recipe {
  id?: string;
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  origin: string;
  category: string;
  servings: number;
  ingredients: Ingredient[];
  instructions: string[];
  nutritionalValues?: NutritionalValues;
  imageUrl?: string;
  createdAt?: unknown;
}

export interface PantryItem {
  id?: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  alertThreshold: number;
  createdAt?: unknown;
}

export interface AppSettings {
  mealCategories: string[];
  originCategories: string[];
}
