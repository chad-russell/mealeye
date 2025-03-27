import type { components, paths } from "./openapi-generated";

// Recipe types
export type Recipe = components["schemas"]["Recipe-Output"];
export type RecipeSummary = components["schemas"]["RecipeSummary"];
export type RecipeStep = components["schemas"]["RecipeStep"];
export type RecipeNote = components["schemas"]["RecipeNote"];

// Ingredient types
export type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"];
export type ApiIngredient = components["schemas"]["RecipeIngredient-Output"];

// Extended types with additional properties
export type ExtendedRecipeIngredient = RecipeIngredient & {
  referenceId: string;
};

// API response types
export type RecipeResponse =
  paths["/api/recipes/{slug}"]["get"]["responses"]["200"]["content"]["application/json"];

// Pagination types
export interface PaginationResponse<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: T[];
  next: string | null;
  previous: string | null;
}

export type RecipesResponse = PaginationResponse<RecipeSummary>;

// Re-export the entire components schema for edge cases
export { components };
