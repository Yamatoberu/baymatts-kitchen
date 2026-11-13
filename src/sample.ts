import type { RecipeData } from "./types";
export const sampleRecipe: RecipeData = {
  title: "Sunday lemon & herb chicken",
  description:
    "Golden edges, a generous squeeze of lemon, and a pan full of good things. An easy recipe to make your own.",
  category: "Dinner",
  servings: 4,
  minutes: 55,
  source: "BayMatt’s Kitchen · example recipe",
  sourceUrl: "",
  originalText: "",
  notes:
    "Rest the chicken for 10 minutes before serving. Nutrition values are illustrative estimates.",
  changeNote: "Example recipe",
  favorite: false,
  ingredients: [
    {
      quantity: 4,
      unit: "",
      name: "chicken thighs",
      preparation: "bone-in, skin-on",
    },
    { quantity: 2, unit: "tbsp", name: "olive oil", preparation: "" },
    { quantity: 1, unit: "", name: "lemon", preparation: "sliced" },
    { quantity: 4, unit: "cloves", name: "garlic", preparation: "crushed" },
    { quantity: 2, unit: "tsp", name: "rosemary", preparation: "chopped" },
    { quantity: 0.5, unit: "tsp", name: "salt", preparation: "" },
  ],
  steps: [
    "Heat the oven to 425°F (220°C). Pat the chicken dry and place in a roasting pan.",
    "Rub with olive oil and salt. Tuck the lemon and garlic around the chicken, then scatter over the rosemary.",
    "Roast for 35–45 minutes, until a thermometer inserted into the thickest part of each thigh, away from the bone, reads at least 165°F (74°C).",
    "Rest for 10 minutes. Spoon the pan juices over the chicken and serve.",
  ],
  allergens: [],
  nutrition: { calories: 380, protein: 28, carbs: 3, fat: 28 },
};
