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

    const prompt = `Given these recipe ingredients and instructions, create an array of associations between ingredients and the steps they are used in. Include ALL mentions of ingredients, including when they are referenced as "more [ingredient]" or "additional [ingredient]" for garnish/serving.

Ingredients:
${ingredients.map((ing) => `- ${ing.note || ing.display}`).join("\n")}

Instructions:
${instructions.map((step, i) => `${i + 1}. ${step.text}`).join("\n")}

Return a JSON object with a single "associations" array containing objects with these properties:
- ingredient: the ingredient name as listed in the ingredients list
- amount: the amount of the ingredient (if specified in the ingredients list)
- step: the step number where the ingredient is used (1-based)
- usage: brief description of how the ingredient is used in that step

Include ALL ingredient mentions, even if they reference "more" of an ingredient that was already used.
Format the response as a JSON object only, no other text.`;

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
