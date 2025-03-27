import { ExtendedRecipeIngredient } from "@/lib/types/recipe";
import { IngredientAssociation } from "./ingredient-matching";

interface IngredientStepMapping {
  // Map from step number to ingredient IDs used in that step
  stepToIngredients: Map<number, Set<string>>;
  // Map from ingredient ID to step numbers where it's used
  ingredientToSteps: Map<string, Set<number>>;
}

export function createIngredientStepMapping(
  ingredients: ExtendedRecipeIngredient[],
  associations: IngredientAssociation[]
): IngredientStepMapping {
  const mapping: IngredientStepMapping = {
    stepToIngredients: new Map(),
    ingredientToSteps: new Map(),
  };

  // Helper function to clean ingredient names for matching
  const cleanIngredientName = (name: string) =>
    name
      .toLowerCase()
      .split(",")[0]
      .trim()
      .replace(/^\d+(\.\d+)?\s*(tablespoons?|teaspoons?|cups?|lb)\s+/, "")
      .replace(/^more\s+/, "");

  // Process each association
  associations.forEach((assoc) => {
    const step = assoc.step;
    const assocIngredient = cleanIngredientName(assoc.ingredient);

    // Find the matching ingredient
    const ingredient = ingredients.find((ing) => {
      const ingName = cleanIngredientName(ing.note || ing.display || "");
      return (
        ingName.includes(assocIngredient) || assocIngredient.includes(ingName)
      );
    });

    if (ingredient?.referenceId) {
      // Add to step -> ingredients mapping
      if (!mapping.stepToIngredients.has(step)) {
        mapping.stepToIngredients.set(step, new Set());
      }
      mapping.stepToIngredients.get(step)?.add(ingredient.referenceId);

      // Add to ingredient -> steps mapping
      if (!mapping.ingredientToSteps.has(ingredient.referenceId)) {
        mapping.ingredientToSteps.set(ingredient.referenceId, new Set());
      }
      mapping.ingredientToSteps.get(ingredient.referenceId)?.add(step);
    }
  });

  return mapping;
}

export function getIngredientsForStep(
  stepNumber: number,
  mapping: IngredientStepMapping
): string[] {
  return Array.from(mapping.stepToIngredients.get(stepNumber) || new Set());
}

export function getStepsForIngredient(
  ingredientId: string,
  mapping: IngredientStepMapping
): number[] {
  return Array.from(mapping.ingredientToSteps.get(ingredientId) || new Set());
}
