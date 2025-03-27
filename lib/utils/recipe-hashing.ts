import { RecipeIngredient, RecipeStep } from "@/lib/types/recipe";
import { createHash } from "crypto";

export function hashRecipe(
  ingredients: RecipeIngredient[],
  steps: RecipeStep[]
): string {
  // Create a string representation of the recipe that includes all relevant data
  const recipeString = JSON.stringify({
    ingredients: ingredients.map((ing) => ({
      name: ing.note || ing.display || "",
      amount: ing.quantity,
      unit: ing.unit?.name,
      description: ing.display || ing.note || "",
    })),
    steps: steps.map((step) => ({
      text: step.text || "",
    })),
  });

  // Create a SHA-256 hash of the recipe string
  return createHash("sha256").update(recipeString).digest("hex");
}
