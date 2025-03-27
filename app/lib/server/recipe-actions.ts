"use server";

import { client } from "@/lib/server/api";
import { components } from "@/lib/types/openapi-generated";

type RecipeSummary = components["schemas"]["RecipeSummary"];

export async function getRecipes(): Promise<RecipeSummary[]> {
  const response = await client.GET("/api/recipes", {
    query: {
      page: 1,
      per_page: 100,
      order_by: "created_at",
      order_direction: "desc",
      cookbook_only: false,
      include_recipes: true,
    },
  });

  if (!response.data) {
    throw new Error("Failed to fetch recipes");
  }

  return response.data.items;
}
