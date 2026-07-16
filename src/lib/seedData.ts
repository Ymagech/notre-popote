import { addRecipe } from './recipeService';
import { getPantryItems, deletePantryItem } from './pantryService';
import { getSettings } from './settingsService';
import { findOrCreateArticleByName } from './articleService';

const BASIC_ARTICLES = [
  { name: "Pâtes", defaultUnit: "g", category: "Épicerie" },
  { name: "Riz", defaultUnit: "g", category: "Épicerie" },
  { name: "Farine", defaultUnit: "g", category: "Épicerie" },
  { name: "Sucre", defaultUnit: "g", category: "Épicerie" },
  { name: "Sel", defaultUnit: "g", category: "Épicerie" },
  { name: "Poivre", defaultUnit: "pincée", category: "Épicerie" },
  { name: "Huile d'olive", defaultUnit: "ml", category: "Épicerie" },
  { name: "Beurre", defaultUnit: "g", category: "Frais" },
  { name: "Lait", defaultUnit: "L", category: "Frais" },
  { name: "Oeufs", defaultUnit: "pièce", category: "Frais" },
  { name: "Blanc de poulet", defaultUnit: "pièce", category: "Frais" },
  { name: "Steak haché", defaultUnit: "pièce", category: "Frais" },
  { name: "Tomates", defaultUnit: "pièce", category: "Frais" },
  { name: "Oignons", defaultUnit: "pièce", category: "Frais" },
  { name: "Ail", defaultUnit: "gousse", category: "Frais" },
  { name: "Pommes de terre", defaultUnit: "kg", category: "Frais" },
  { name: "Carottes", defaultUnit: "pièce", category: "Frais" },
  { name: "Pain", defaultUnit: "pièce", category: "Épicerie" },
  { name: "Fromage râpé", defaultUnit: "g", category: "Frais" },
  { name: "Crème fraîche", defaultUnit: "g", category: "Frais" }
];

export const seedDatabase = async () => {
  // Ensure settings are initialized
  await getSettings();

  const recipes = [
    {
      title: "Pâtes Carbonara",
      description: "La vraie recette italienne, sans crème fraîche !",
      prepTime: 10,
      cookTime: 15,
      origin: "Italie",
      category: "Dîner",
      servings: 4,
      ingredients: [
        { name: "Spaghetti", quantity: 400, unit: "g" },
        { name: "Guanciale", quantity: 150, unit: "g" },
        { name: "Pecorino Romano", quantity: 100, unit: "g" },
        { name: "Oeufs", quantity: 4, unit: "pièce" },
        { name: "Poivre noir", quantity: 1, unit: "pincée" }
      ],
      instructions: [
        "Faire bouillir une grande casserole d'eau salée.",
        "Couper le guanciale en petits lardons et le faire revenir dans une poêle sans matière grasse.",
        "Dans un bol, battre les oeufs avec le pecorino râpé et beaucoup de poivre.",
        "Cuire les pâtes al dente. Garder une louche d'eau de cuisson.",
        "Mélanger les pâtes avec le guanciale hors du feu, puis ajouter le mélange d'oeufs et un peu d'eau de cuisson pour créer une crème."
      ],
      nutritionalValues: { calories: 650, proteins: 28, carbs: 72, fats: 26 },
      imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Poulet Basquaise",
      description: "Un plat mijoté traditionnel du Pays Basque, savoureux et coloré.",
      prepTime: 20,
      cookTime: 45,
      origin: "France",
      category: "Dîner",
      servings: 4,
      ingredients: [
        { name: "Poulet coupé en morceaux", quantity: 1, unit: "kg" },
        { name: "Poivrons (rouges et verts)", quantity: 4, unit: "pièce" },
        { name: "Tomates", quantity: 4, unit: "pièce" },
        { name: "Oignons", quantity: 2, unit: "pièce" },
        { name: "Ail", quantity: 2, unit: "gousse" },
        { name: "Vin blanc", quantity: 1, unit: "verre" }
      ],
      instructions: [
        "Faire dorer les morceaux de poulet dans une cocotte avec de l'huile d'olive. Réserver.",
        "Dans la même cocotte, faire revenir les oignons émincés et l'ail écrasé.",
        "Ajouter les poivrons coupés en lanières et les tomates en dés. Laisser compoter 15 min.",
        "Remettre le poulet, verser le vin blanc, saler, poivrer et ajouter du piment d'Espelette.",
        "Couvrir et laisser mijoter à feu doux pendant 30 minutes."
      ],
      nutritionalValues: { calories: 420, proteins: 35, carbs: 18, fats: 22 },
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Salade César",
      description: "Une salade fraîche avec sa fameuse sauce maison, idéale pour un déjeuner léger.",
      prepTime: 15,
      cookTime: 10,
      origin: "États-Unis",
      category: "Déjeuner",
      servings: 2,
      ingredients: [
        { name: "Salade Romaine", quantity: 1, unit: "pièce" },
        { name: "Blanc de poulet", quantity: 2, unit: "pièce" },
        { name: "Croûtons", quantity: 100, unit: "g" },
        { name: "Parmesan", quantity: 50, unit: "g" },
        { name: "Sauce César", quantity: 4, unit: "c.à.s" }
      ],
      instructions: [
        "Faire cuire les blancs de poulet à la poêle, puis les couper en tranches.",
        "Laver et couper la salade romaine.",
        "Disposer la salade dans des assiettes, ajouter le poulet, les croûtons et des copeaux de parmesan.",
        "Napper de sauce César juste avant de servir."
      ],
      nutritionalValues: { calories: 380, proteins: 32, carbs: 22, fats: 18 },
      imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Tarte aux pommes",
      description: "La recette classique et indémodable du dimanche, croustillante et fondante.",
      prepTime: 20,
      cookTime: 40,
      origin: "France",
      category: "Dessert",
      servings: 6,
      ingredients: [
        { name: "Pâte brisée", quantity: 1, unit: "rouleau" },
        { name: "Pommes", quantity: 5, unit: "pièce" },
        { name: "Compote de pommes", quantity: 200, unit: "g" },
        { name: "Sucre vanillé", quantity: 1, unit: "sachet" }
      ],
      instructions: [
        "Préchauffer le four à 180°C.",
        "Étaler la pâte dans un moule à tarte et la piquer avec une fourchette.",
        "Étaler la compote sur le fond de tarte.",
        "Éplucher et couper les pommes en fines lamelles, puis les disposer en rosace.",
        "Saupoudrer de sucre vanillé et enfourner 40 minutes."
      ],
      nutritionalValues: { calories: 280, proteins: 3, carbs: 42, fats: 12 },
      imageUrl: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  console.log("Seeding database (recipes and basic articles)...");
  
  for (const recipe of recipes) {
    await addRecipe(recipe);
  }

  for (const art of BASIC_ARTICLES) {
    await findOrCreateArticleByName(art.name, art.defaultUnit, art.category);
  }
  
  console.log("Database seeded successfully!");
};

export const autoCleanStaticPantryItems = async () => {
  console.log("Running auto clean of static pantry items and seeding basic articles...");
  try {
    const pantryItems = await getPantryItems();
    const itemsToDelete = ["Huile d'olive", "Lait demi-écrémé", "Oeufs", "Farine de blé"];
    for (const item of pantryItems) {
      if (itemsToDelete.includes(item.name)) {
        await deletePantryItem(item.id!);
      }
    }

    for (const art of BASIC_ARTICLES) {
      await findOrCreateArticleByName(art.name, art.defaultUnit, art.category);
    }
    console.log("Auto clean and seed finished successfully.");
  } catch (error) {
    console.error("Error during autoCleanStaticPantryItems:", error);
  }
};
