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
export function findIngredientsInText(
  text: string,
  ingredients: RecipeIngredient[],
  associations: IngredientAssociation[]
): string[] {
  const cleanText = text.toLowerCase().trim();
  const foundIngredientIds = new Set<string>();

  // Get associations for this specific text
  const relevantAssociations = associations.filter(
    (assoc) => assoc.step === findStepNumberFromText(text, associations)
  );

  // Helper function to clean ingredient names
  const cleanIngredientName = (name: string) =>
    name
      .toLowerCase()
      .split(",")[0]
      .trim()
      .replace(/^\d+(\.\d+)?\s*(tablespoons?|teaspoons?|cups?|lb)\s+/, "")
      .replace(/^more\s+/, ""); // Remove "more" prefix

  // Process each association
  relevantAssociations.forEach((assoc) => {
    const assocIngredient = cleanIngredientName(assoc.ingredient);

    // Find matching ingredient, handling both direct and "more" references
    const ingredient = ingredients.find((ing) => {
      const ingName = cleanIngredientName(ing.note || ing.display || "");
      const textToCheck = cleanText.replace(/more\s+/, ""); // Remove "more" from the text for matching

      return (
        ingName.includes(assocIngredient) ||
        assocIngredient.includes(ingName) ||
        textToCheck.includes(ingName)
      );
    });

    if (ingredient?.referenceId) {
      foundIngredientIds.add(ingredient.referenceId);
    }
  });

  return Array.from(foundIngredientIds);
}

// Helper function to find the step number from text
function findStepNumberFromText(
  text: string,
  associations: IngredientAssociation[]
): number {
  // Find the association that matches this text
  const association = associations.find((assoc) =>
    text.toLowerCase().includes(assoc.usage?.toLowerCase() || "")
  );
  return association?.step || 0;
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Export the types for use in other files
export type { IngredientAssociation, LLMProvider };
