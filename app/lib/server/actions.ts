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
  instructions: RecipeStep[]
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

Your task is to analyze the steps and associate each ingredient with the relevant step, the amount of that ingredient used in the step (if available), and the exact text from the step that mentions this ingredient. Return the result as a JSON list of associations.

Input:
Ingredients: ${JSON.stringify(ingredientsData, null, 2)}
Steps: ${JSON.stringify(stepsData, null, 2)}

Return a JSON object with a single "associations" array containing objects with these properties:
- ingredient: the ingredient name as listed in the ingredients list
- amount: the amount of the ingredient (if specified in the ingredients list)
- step: the step number where the ingredient is used (1-based)
- text: the exact text from the step that mentions this ingredient

Make sure that:
- The ingredient name matches exactly with the names in the Ingredients List
- Include the amount field only if it's available in the Ingredients List
- The step field reflects the correct step number
- The text field contains the EXACT text from the step that mentions the ingredient - this will be used for highlighting
- The text should be as minimal as possible while still being clear (e.g., "steak" instead of "sliced steak and the cornstarch")
- If an ingredient appears multiple times in a step, create separate associations for each occurrence
- The text should be a complete word or phrase that makes sense when highlighted
- Do not paraphrase or describe how the ingredient is used - just copy the exact text from the step
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
