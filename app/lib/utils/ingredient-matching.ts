import { components } from "@/app/lib/types/openapi-generated";
import OpenAI from "openai";

type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"] & {
  referenceId: string;
};

type RecipeStep = components["schemas"]["RecipeStep"];

interface IngredientAssociation {
  ingredient: string;
  amount?: string;
  step: number;
  usage: string;
}

interface LLMProvider {
  findIngredientAssociations(
    ingredients: RecipeIngredient[],
    steps: RecipeStep[]
  ): Promise<IngredientAssociation[]>;
}

// OpenAI implementation
class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model = "gpt-3.5-turbo") {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async findIngredientAssociations(
    ingredients: RecipeIngredient[],
    steps: RecipeStep[]
  ): Promise<IngredientAssociation[]> {
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

You will be given two JSON objects:

Ingredients List: A list of ingredients, where each ingredient has the following fields:
name: The name of the ingredient (e.g., "canola oil" or "salt and pepper").
amount: The optional amount of the ingredient (e.g., "1/4 cup"). Some ingredients may not have amounts.
description: An optional description (e.g., "oil").

Steps List: A list of steps, where each step has the following fields:
description: A description of the step that may contain the ingredients listed in the Ingredients List.

Your task is to analyze the steps and associate each ingredient with the relevant step, the amount of that ingredient used in the step (if available), and a short description of how it's used. Return the result as a JSON list of associations.

Input:
Ingredients: ${JSON.stringify(ingredientsData, null, 2)}
Steps: ${JSON.stringify(stepsData, null, 2)}

Please provide the output in the following format:
[
  {
    "ingredient": "ingredient name",
    "amount": "amount from ingredients list (omit if not available)",
    "step": step number (1-based),
    "usage": "brief description of usage"
  }
]

Make sure that:
- The ingredient name matches exactly with the names in the Ingredients List
- Include the amount field only if it's available in the Ingredients List
- The step field reflects the correct step number
- The usage field reflects a brief description of how the ingredient is used in that step
`;

    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content:
              "You are a helpful assistant that analyzes recipe ingredients and steps to create ingredient associations.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        response_format: { type: "json_object" },
      });

      console.log(
        `***** OpenAI response: ${response.choices[0]?.message?.content}`
      );

      const result = JSON.parse(
        response.choices[0]?.message?.content || "[]"
      ) as { associations: IngredientAssociation[] };
      return result.associations;
    } catch (error) {
      console.error("Error calling OpenAI:", error);
      return [];
    }
  }
}

// Factory function to create the appropriate LLM provider
export function createLLMProvider(
  type: "openai" | "gemini" | "ollama" = "openai",
  config: { apiKey: string; model?: string }
): LLMProvider {
  switch (type) {
    case "openai":
      return new OpenAIProvider(config.apiKey, config.model);
    // Add other providers here as needed
    default:
      throw new Error(`Unsupported LLM provider: ${type}`);
  }
}

// Helper function to find ingredients in text using LLM associations
export async function findIngredientsInText(
  text: string,
  ingredients: RecipeIngredient[],
  associations: IngredientAssociation[]
): Promise<RecipeIngredient[]> {
  console.log("[findIngredientsInText] Input:", {
    text,
    numIngredients: ingredients.length,
    numAssociations: associations.length,
  });

  // Find all associations that match this step's text
  const stepAssociations = associations.filter((assoc) => {
    // Clean up the ingredient text for matching
    const cleanIngredient = escapeRegExp(assoc.ingredient.toLowerCase().trim());
    const cleanText = text.toLowerCase();

    // Try to match with and without word boundaries
    const regexStrict = new RegExp(`\\b${cleanIngredient}\\b`, "gi");
    const regexLoose = new RegExp(cleanIngredient, "gi");

    const matches = regexStrict.test(cleanText) || regexLoose.test(cleanText);
    console.log("[findIngredientsInText] Testing association:", {
      ingredient: assoc.ingredient,
      regexStrict: regexStrict.toString(),
      regexLoose: regexLoose.toString(),
      matches,
    });
    return matches;
  });

  console.log(
    "[findIngredientsInText] Matching associations:",
    stepAssociations
  );

  // Return the ingredients that are used in this step
  const matchedIngredients = ingredients.filter((ing) =>
    stepAssociations.some((assoc) => {
      const ingText = (ing.note || ing.display || "").toLowerCase().trim();
      const assocText = assoc.ingredient.toLowerCase().trim();

      // Try exact match first, then partial match
      const exactMatch = ingText === assocText;
      const partialMatch =
        ingText.includes(assocText) || assocText.includes(ingText);

      console.log("[findIngredientsInText] Testing ingredient match:", {
        ingredient: ing.note || ing.display,
        association: assoc.ingredient,
        exactMatch,
        partialMatch,
        matches: exactMatch || partialMatch,
      });

      return exactMatch || partialMatch;
    })
  );

  console.log(
    "[findIngredientsInText] Final matched ingredients:",
    matchedIngredients.map((ing) => ({
      id: ing.referenceId,
      text: ing.note || ing.display,
    }))
  );

  return matchedIngredients;
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Export the types for use in other files
export type { IngredientAssociation, LLMProvider };
