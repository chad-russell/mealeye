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
  text: string;
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
            content: `Analyze these recipe ingredients and steps to create ingredient associations. For each ingredient, find the exact text from the steps that mentions it.

Ingredients:
${JSON.stringify(
  ingredients.map((ing) => ({
    name: ing.note || ing.display || "",
    amount: ing.quantity
      ? `${ing.quantity} ${ing.unit?.name || ""}`.trim()
      : undefined,
    description: ing.display || ing.note || "",
  })),
  null,
  2
)}

Steps:
${JSON.stringify(
  steps.map((step) => ({
    description: step.text || "",
  })),
  null,
  2
)}

Return a JSON object with an "associations" array containing objects with:
- ingredient: The ingredient name
- amount: The amount (if available)
- step: The step number (1-based)
- text: The minimal text from the step that mentions this ingredient

For example:
{
  "associations": [
    {
      "ingredient": "steak",
      "amount": "1 pound",
      "step": 1,
      "text": "steak"
    }
  ]
}

Important:
- The text field should contain ONLY the minimal text that references the ingredient
- For example, if the step says "mix the sliced steak and cornstarch", use just "steak" or "the sliced steak"
- If the step says "combine water, sugar, and salt", use just "water" or "the water"
- Do not include other ingredients or actions in the text field
- If an ingredient appears multiple times in a step, create separate associations
- The text should be a complete word or phrase that makes sense when highlighted
- Do not paraphrase or describe how the ingredient is used, just return the exact text`,
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
    text.toLowerCase().includes(assoc.text?.toLowerCase() || "")
  );
  return association?.step || 0;
}

// Helper function to escape special characters in regex
function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Export the types for use in other files
export type { IngredientAssociation, LLMProvider };
