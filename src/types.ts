export type Ingredient = {
  quantity: number | null;
  unit: string;
  name: string;
  preparation: string;
};
export type Nutrition = {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
};
export type RecipeData = {
  imageUrl?: string;
  title: string;
  description: string;
  category: string;
  servings: number;
  minutes: number;
  source: string;
  sourceUrl: string;
  originalText: string;
  notes: string;
  changeNote: string;
  ingredients: Ingredient[];
  steps: string[];
  allergens: string[];
  nutrition: Nutrition;
  favorite: boolean;
};
export type RecipeVersion = RecipeData & {
  id: string;
  revision: number;
  createdAt: string;
  updatedAt: string;
};
export type Recipe = RecipeVersion & { history: RecipeVersion[] };
export const emptyRecipe: RecipeData = {
  title: "",
  description: "",
  category: "Dinner",
  servings: 4,
  minutes: 30,
  source: "",
  sourceUrl: "",
  originalText: "",
  notes: "",
  changeNote: "",
  ingredients: [{ quantity: null, unit: "", name: "", preparation: "" }],
  steps: [""],
  allergens: [],
  nutrition: { calories: null, protein: null, carbs: null, fat: null },
  favorite: false,
};
