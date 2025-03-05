import { API_BASE } from "../server/api";

/**
 * Get the URL for a recipe image
 * @param recipeId The ID of the recipe
 * @returns The URL for the recipe image
 */
export function recipeImageUrl(recipeId: string): string {
  return `${API_BASE}/api/media/recipes/${recipeId}/images/min-original.webp`;
}
