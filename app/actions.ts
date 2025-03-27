"use server";

import { client } from "@/lib/server/api";
import { components } from "@/lib/types/openapi-generated";
import {
  findIngredientAssociations as findAssociations,
  clearIngredientAssociations as clearAssociations,
  checkIngredientAssociations as checkAssociations,
} from "@/lib/server/actions";

type RecipeStep = components["schemas"]["RecipeStep"];
type ApiIngredient = components["schemas"]["RecipeIngredient-Output"];

export async function getRecipe(slug: string) {
  const response = await client.GET("/api/recipes/{slug}", {
    params: {
      path: {
        slug,
      },
    },
  });
  return response.data;
}

export async function findIngredientAssociations(
  recipeId: string,
  ingredients: ApiIngredient[],
  instructions: RecipeStep[],
  forceRegenerate: boolean = false
) {
  return findAssociations(recipeId, ingredients, instructions, forceRegenerate);
}

export async function clearIngredientAssociations(recipeId: string) {
  return clearAssociations(recipeId);
}

export async function checkIngredientAssociations(
  recipeId: string,
  ingredients: ApiIngredient[],
  instructions: RecipeStep[]
) {
  return checkAssociations(recipeId, ingredients, instructions);
}
