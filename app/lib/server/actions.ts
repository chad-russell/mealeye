"use server";

import OpenAI from "openai";
import { components } from "@/app/lib/types/openapi-generated";
import { IngredientAssociation } from "../utils/ingredient-matching";

type RecipeStep = components["schemas"]["RecipeStep"];
type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"] & {
  referenceId: string;
};

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function findIngredientAssociations(
  ingredients: RecipeIngredient[],
  steps: RecipeStep[]
): Promise<IngredientAssociation[]> {
  try {
    // Log API key securely (first/last 4 chars only)
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error("OPENAI_API_KEY is not set!");
      return [];
    }
    console.log(
      "Using OpenAI API Key:",
      `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`
    );

    // Prepare the input data
    const ingredientsData = ingredients.map((ing) => ({
      name: ing.note || ing.display || "",
      amount: ing.quantity
        ? `${ing.quantity} ${ing.unit?.name || ""}`.trim()
        : undefined,
      description: ing.display || ing.note || "",
    }));

    const stepsData = steps.map((step) => ({
      description: step.text || "",
    }));

    const prompt = `
Instructions:

You will be given two JSON objects and must return a JSON object containing an array of ingredient associations.

Ingredients List: A list of ingredients, where each ingredient has the following fields:
name: The name of the ingredient (e.g., "canola oil" or "salt and pepper").
amount: The optional amount of the ingredient (e.g., "1/4 cup"). Some ingredients may not have amounts.
description: An optional description (e.g., "oil").

Steps List: A list of steps, where each step has the following fields:
description: A description of the step that may contain the ingredients listed in the Ingredients List.

Input:
Ingredients: ${JSON.stringify(ingredientsData, null, 2)}
Steps: ${JSON.stringify(stepsData, null, 2)}

Required Output Format:
You MUST return a JSON object with an "associations" field containing an array of objects. Each object must have:
- ingredient: The exact name from the Ingredients List
- amount: The amount from the Ingredients List (omit if not available)
- step: The step number (1-based)
- usage: A brief description of how the ingredient is used in that step

Example response format:
{
  "associations": [
    {
      "ingredient": "canola oil",
      "amount": "1/4 cup",
      "step": 1,
      "usage": "used for frying"
    },
    {
      "ingredient": "salt",
      "step": 2,
      "usage": "seasoning"
    }
  ]
}

Critical Requirements:
1. Response MUST be a JSON object with an "associations" array
2. Each ingredient name MUST match exactly with the names in the Ingredients List
3. Include the amount field only if it's available in the Ingredients List
4. The step field must be a number (1-based)
5. Keep usage descriptions brief and focused
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

    console.log("OpenAI Response:", response.choices[0]?.message?.content);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("No content in OpenAI response");
      return [];
    }

    try {
      const result = JSON.parse(content);

      // Check for associations array in the response
      if (result && result.associations && Array.isArray(result.associations)) {
        console.log(
          "Found associations array with length:",
          result.associations.length
        );
        return result.associations;
      }

      console.error(
        "Invalid response format - missing associations array:",
        result
      );
      return [];
    } catch (parseError) {
      console.error("Error parsing OpenAI response:", parseError);
      console.error("Raw content:", content);
      return [];
    }
  } catch (error) {
    console.error("Error in findIngredientAssociations:", error);
    return [];
  }
}
