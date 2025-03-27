import type { components, paths } from "./openapi-generated";

// Export types from the generated API types
export type Recipe =
  paths["/api/recipes/{slug}"]["get"]["responses"]["200"]["content"]["application/json"];
export type RecipeSummary = components["schemas"]["RecipeSummary"];

// Define a generic pagination response type
export interface PaginationResponse<T> {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
  items: T[];
  next: string | null;
  previous: string | null;
}

// Define the recipes response type using the generic pagination type
export type RecipesResponse = PaginationResponse<RecipeSummary>;
