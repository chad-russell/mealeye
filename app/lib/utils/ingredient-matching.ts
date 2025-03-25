import { components } from "@/app/lib/types/openapi-generated";

type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"] & {
  referenceId: string;
};

// Common measurement words to remove
const measurementWords = [
  "cup",
  "cups",
  "tablespoon",
  "tablespoons",
  "tbsp",
  "teaspoon",
  "teaspoons",
  "tsp",
  "pound",
  "pounds",
  "lb",
  "lbs",
  "ounce",
  "ounces",
  "oz",
  "gram",
  "grams",
  "g",
  "kilogram",
  "kg",
  "ml",
  "milliliter",
  "milliliters",
  "liter",
  "liters",
  "inch",
  "inches",
  "piece",
  "pieces",
];

// Common preparation words to remove
const prepWords = [
  "diced",
  "chopped",
  "sliced",
  "minced",
  "crushed",
  "ground",
  "grated",
  "shredded",
  "peeled",
  "seeded",
  "cut",
  "cooked",
  "frozen",
  "fresh",
  "dried",
  "canned",
];

// Words to ignore in matching
const ignoreWords = [
  "and",
  "or",
  "with",
  "without",
  "for",
  "the",
  "a",
  "an",
  "into",
  "in",
  "such",
  "as",
  "another",
  "optional",
  "to",
];

function removeMeasurements(text: string): string {
  // Remove numeric measurements (including fractions)
  text = text.replace(/[\d¼½¾⅓⅔⅛⅜⅝⅞]+\s*/g, "");

  // Remove measurement words
  const measurementRegex = new RegExp(
    `\\b(${measurementWords.join("|")})\\b`,
    "gi"
  );
  return text.replace(measurementRegex, "");
}

function normalizeText(text: string): string {
  // Convert to lowercase and remove parentheses and their contents
  let normalized = text.toLowerCase().replace(/\([^)]*\)/g, "");

  // Remove preparation words
  const prepRegex = new RegExp(`\\b(${prepWords.join("|")})\\b`, "gi");
  normalized = normalized.replace(prepRegex, "");

  // Remove ignore words
  const ignoreRegex = new RegExp(`\\b(${ignoreWords.join("|")})\\b`, "gi");
  normalized = normalized.replace(ignoreRegex, "");

  // Remove punctuation and extra spaces
  normalized = normalized.replace(/[.,]/g, "");
  normalized = normalized.replace(/\s+/g, " ").trim();

  return normalized;
}

function getIngredientVariations(text: string): string[] {
  const variations: string[] = [];

  // Add the base normalized form
  variations.push(text);

  // Add singular/plural variations
  if (text.endsWith("s")) {
    variations.push(text.slice(0, -1)); // Remove 's' for singular
  } else {
    variations.push(text + "s"); // Add 's' for plural
  }

  // Handle special cases like "tomato" -> "tomatoes"
  if (text.endsWith("o")) {
    variations.push(text + "es");
  }

  // Handle compound ingredients (e.g., "red onion" -> ["red onion", "onion"])
  const words = text.split(" ");
  if (words.length > 1) {
    variations.push(words[words.length - 1]); // Add last word
  }

  return [...new Set(variations)]; // Remove duplicates
}

export function normalizeIngredient(ingredient: RecipeIngredient): string[] {
  const text = ingredient.note || ingredient.display || "";
  const withoutMeasurements = removeMeasurements(text);
  const normalized = normalizeText(withoutMeasurements);
  return getIngredientVariations(normalized);
}

export function findIngredientsInText(
  text: string,
  ingredients: RecipeIngredient[]
): RecipeIngredient[] {
  const normalizedText = text.toLowerCase();

  return ingredients.filter((ingredient) => {
    const variations = normalizeIngredient(ingredient);
    return variations.some((variation) => normalizedText.includes(variation));
  });
}
