import { z } from "zod";
const text = z.string().trim().max(20000);
const number = z.number().finite().min(0).max(1000000);
export const recipeSchema = z.object({
  title: text.min(1).max(160),
  imageUrl: z
    .union([
      z.literal(""),
      z
        .url()
        .refine(
          (value) => /^https?:\/\//.test(value),
          "Use an http or https image URL",
        ),
    ])
    .default(""),
  description: text.default(""),
  category: text
    .min(1)
    .max(60)
    .refine(
      (value) => !["All recipes", "Favorites"].includes(value),
      "Choose a category other than All recipes or Favorites",
    )
    .default("Dinner"),
  servings: z.number().finite().positive().max(10000),
  minutes: number.default(0),
  source: text.default(""),
  sourceUrl: z
    .union([
      z.literal(""),
      z
        .url()
        .refine(
          (value) => /^https?:\/\//.test(value),
          "Use an http or https URL",
        ),
    ])
    .default(""),
  originalText: text.default(""),
  notes: text.default(""),
  changeNote: text.max(500).default(""),
  ingredients: z
    .array(
      z.object({
        quantity: number.nullable(),
        unit: text.max(50),
        name: text.min(1).max(200),
        preparation: text.max(200),
      }),
    )
    .min(1)
    .max(200),
  steps: z.array(text.min(1)).min(1).max(100),
  allergens: z.array(text.min(1).max(80)).max(30).default([]),
  nutrition: z.object({
    calories: number.nullable(),
    protein: number.nullable(),
    carbs: number.nullable(),
    fat: number.nullable(),
  }),
  favorite: z.boolean().default(false),
});
export function snapshot(recipe) {
  const { history, ...version } = recipe;
  return version;
}
