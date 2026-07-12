import { addRecipe } from './recipeService';
import { addPantryItem } from './pantryService';

export const seedDatabase = async () => {
  const recipes = [
    {
      title: "Pâtes Carbonara",
      description: "La vraie recette italienne, sans crème fraîche !",
      prepTime: 10,
      cookTime: 15,
      origin: "Italie",
      category: "Dîner" as const,
      ingredients: [
        { name: "Spaghetti", quantity: 400, unit: "g" },
        { name: "Guanciale", quantity: 150, unit: "g" },
        { name: "Pecorino Romano", quantity: 100, unit: "g" },
        { name: "Oeufs", quantity: 4, unit: "pièces" },
        { name: "Poivre noir", quantity: 1, unit: "pincée" }
      ],
      instructions: [
        "Faire bouillir une grande casserole d'eau salée.",
        "Couper le guanciale en petits lardons et le faire revenir dans une poêle sans matière grasse.",
        "Dans un bol, battre les oeufs avec le pecorino râpé et beaucoup de poivre.",
        "Cuire les pâtes al dente. Garder une louche d'eau de cuisson.",
        "Mélanger les pâtes avec le guanciale hors du feu, puis ajouter le mélange d'oeufs et un peu d'eau de cuisson pour créer une crème."
      ],
      imageUrl: "https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Poulet Basquaise",
      description: "Un plat mijoté traditionnel du Pays Basque.",
      prepTime: 20,
      cookTime: 45,
      origin: "France",
      category: "Dîner" as const,
      ingredients: [
        { name: "Poulet coupé en morceaux", quantity: 1, unit: "kg" },
        { name: "Poivrons (rouges et verts)", quantity: 4, unit: "pièces" },
        { name: "Tomates", quantity: 4, unit: "pièces" },
        { name: "Oignons", quantity: 2, unit: "pièces" },
        { name: "Ail", quantity: 2, unit: "gousses" },
        { name: "Vin blanc", quantity: 1, unit: "verre" }
      ],
      instructions: [
        "Faire dorer les morceaux de poulet dans une cocotte avec de l'huile d'olive. Réserver.",
        "Dans la même cocotte, faire revenir les oignons émincés et l'ail écrasé.",
        "Ajouter les poivrons coupés en lanières et les tomates en dés. Laisser compoter 15 min.",
        "Remettre le poulet, verser le vin blanc, saler, poivrer et ajouter du piment d'Espelette.",
        "Couvrir et laisser mijoter à feu doux pendant 30 minutes."
      ],
      imageUrl: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Salade César",
      description: "Une salade fraîche avec sa fameuse sauce maison.",
      prepTime: 15,
      cookTime: 10,
      origin: "États-Unis",
      category: "Déjeuner" as const,
      ingredients: [
        { name: "Salade Romaine", quantity: 1, unit: "pièce" },
        { name: "Blanc de poulet", quantity: 2, unit: "pièces" },
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
      imageUrl: "https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=1000&auto=format&fit=crop"
    },
    {
      title: "Tarte aux pommes",
      description: "La recette classique et indémodable du dimanche.",
      prepTime: 20,
      cookTime: 40,
      origin: "France",
      category: "Dessert" as const,
      ingredients: [
        { name: "Pâte brisée", quantity: 1, unit: "rouleau" },
        { name: "Pommes", quantity: 5, unit: "pièces" },
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
      imageUrl: "https://images.unsplash.com/photo-1568571780765-9276ac8b75a2?q=80&w=1000&auto=format&fit=crop"
    }
  ];

  const pantryItems = [
    { name: "Farine de blé", quantity: 1, unit: "kg", category: "Épicerie" as const, alertThreshold: 0.5 },
    { name: "Oeufs", quantity: 12, unit: "pièces", category: "Frais" as const, alertThreshold: 4 },
    { name: "Lait demi-écrémé", quantity: 2, unit: "L", category: "Frais" as const, alertThreshold: 1 },
    { name: "Huile d'olive", quantity: 1, unit: "L", category: "Épicerie" as const, alertThreshold: 0.2 }
  ];

  console.log("Seeding database...");
  
  for (const recipe of recipes) {
    await addRecipe(recipe);
  }
  
  for (const item of pantryItems) {
    await addPantryItem(item);
  }
  
  console.log("Database seeded successfully!");
};
