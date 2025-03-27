"use server";

import OpenAI from "openai";
import { components } from "@/lib/types/openapi-generated";
import { IngredientAssociation } from "../utils/ingredient-matching";
import { getAssociations, saveAssociations } from "../db";
import { hashRecipe } from "../utils/recipe-hashing";

type RecipeStep = components["schemas"]["RecipeStep"];
type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"] & {
  referenceId: string;
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateAssociationsWithOpenAI(
  ingredients: RecipeIngredient[],
  instructions: RecipeStep[]
): Promise<IngredientAssociation[]> {
  // Prepare the input data
  const ingredientsData = ingredients.map((ing) => ({
    name: ing.note || ing.display || "",
    amount: ing.quantity
      ? `${ing.quantity} ${ing.unit?.name || ""}`.trim()
      : undefined,
    description: ing.display || ing.note || "",
  }));

  const stepsData = instructions.map((step) => ({
    description: step.text || "",
  }));

  const prompt = `
Instructions:

You will be given two JSON objects:

Ingredients List: A list of ingredients, where each ingredient has the following fields:
name: The name of the ingredient (e.g., "canola oil" or "salt and pepper").
amount: The optional amount of the ingredient (e.g., "1/4 cup"). Some ingredients may not have amounts.
description: An optional description (e.g., "oil").

Steps List: A list of steps, where each step has the following fields:
description: A description of the step that may contain the ingredients listed in the Ingredients List.

Your task is to analyze the steps and associate each ingredient with the relevant step, the amount of that ingredient used in the step (if available), and the minimal text from the step that mentions this ingredient. Return the result as a JSON list of associations.

Input:
Ingredients: ${JSON.stringify(ingredientsData, null, 2)}
Steps: ${JSON.stringify(stepsData, null, 2)}

Return a JSON object with a single "associations" array containing objects with these properties:
- ingredient: the ingredient name as listed in the ingredients list
- amount: the amount of the ingredient (if specified in the ingredients list)
- step: the step number where the ingredient is used (1-based)
- text: the minimal text from the step that mentions this ingredient

Make sure that:
- The ingredient name matches exactly with the names in the Ingredients List
- Include the amount field only if it's available in the Ingredients List
- The step field reflects the correct step number
- The text field should contain ONLY the minimal text that references the ingredient
- For example:
  * If the step says "mix the sliced steak and cornstarch", use just "steak" or "the sliced steak"
  * If the step says "combine water, sugar, and salt", use just "water" or "the water"
- Do not include other ingredients or actions in the text field
- If an ingredient appears multiple times in a step, create separate associations for each occurrence
- The text should be a complete word or phrase that makes sense when highlighted
- Do not paraphrase or describe how the ingredient is used - just return the exact text from the step
`;

  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo-1106", // Using the JSON-capable model
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that analyzes recipe ingredients and steps to create ingredient associations. You MUST return a JSON object with an 'associations' array.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  console.log(
    `***** OpenAI response: ${response.choices[0]?.message?.content}`
  );

  const result = JSON.parse(response.choices[0]?.message?.content || "[]") as {
    associations: IngredientAssociation[];
  };

  return result.associations;
}

export async function findIngredientAssociations(
  recipeId: string,
  ingredients: RecipeIngredient[],
  instructions: RecipeStep[]
): Promise<{
  associations: IngredientAssociation[];
  status: "valid" | "outdated" | "none";
}> {
  try {
    // Calculate recipe hash
    const recipeHash = hashRecipe(ingredients, instructions);

    // Check if we have cached associations
    const cachedResult = await getAssociations(recipeId, recipeHash);

    // If we have associations, check if they're valid
    if (cachedResult && cachedResult.status === "valid") {
      // Convert the database associations to the expected format
      const formattedAssociations: IngredientAssociation[] =
        cachedResult.associations.map((assoc) => ({
          ingredient: assoc.ingredient,
          amount: assoc.amount || undefined,
          step: assoc.step,
          text: assoc.text,
        }));

      return {
        associations: formattedAssociations,
        status: "valid",
      };
    }

    // If no cached associations or they're outdated, generate new ones
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set!");
      return { associations: [], status: "none" };
    }

    // Generate new associations using OpenAI
    const newAssociations = await generateAssociationsWithOpenAI(
      ingredients,
      instructions
    );

    // Save the associations to the database
    await saveAssociations(recipeId, recipeHash, newAssociations);

    return {
      associations: newAssociations,
      status: "valid",
    };
  } catch (error) {
    console.error("Error in findIngredientAssociations:", error);
    return { associations: [], status: "none" };
  }
}
