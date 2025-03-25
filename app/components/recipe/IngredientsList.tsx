"use client";

import { components } from "@/app/lib/types/openapi-generated";

type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"] & {
  referenceId: string;
};

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
  completedInstructions: boolean[];
  highlightedIngredientIds: Set<string>;
  onIngredientHover: (ingredientId: string | undefined) => void;
  usedIngredients: Set<string>;
}

export default function IngredientsList({
  ingredients = [],
  completedInstructions = [],
  highlightedIngredientIds,
  onIngredientHover,
  usedIngredients = new Set<string>(),
}: IngredientsListProps) {
  if (!ingredients || !usedIngredients) {
    return null;
  }

  return (
    <div className="sticky top-8 h-[calc(100vh-4rem)] overflow-hidden bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Ingredients</h2>
      </div>
      <div className="h-[calc(100%-4rem)] overflow-y-auto">
        <div className="p-6">
          <ul className="space-y-3">
            {ingredients.map((ingredient) => {
              if (!ingredient?.referenceId) return null;

              const isUsed = usedIngredients.has(ingredient.referenceId);
              const isHighlighted = highlightedIngredientIds.has(
                ingredient.referenceId
              );

              return (
                <li
                  key={ingredient.referenceId}
                  className={`flex items-start gap-2 p-2 rounded transition-all duration-200 ${
                    isHighlighted ? "bg-yellow-100" : "hover:bg-yellow-50"
                  } ${isUsed ? "opacity-50" : ""}`}
                  onMouseEnter={() => onIngredientHover(ingredient.referenceId)}
                  onMouseLeave={() => onIngredientHover(undefined)}
                >
                  <div
                    className={`w-1.5 h-1.5 mt-2 rounded-full flex-shrink-0 transition-colors duration-200 ${
                      isUsed ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <div
                    className={`text-gray-600 ${isUsed ? "line-through" : ""}`}
                  >
                    {ingredient.quantity &&
                    !ingredient.disableAmount &&
                    ingredient.unit ? (
                      <>
                        <span className="font-medium">
                          {ingredient.quantity}
                        </span>
                        <span className="text-gray-500 italic ml-1">
                          {ingredient.unit?.name || ""}
                        </span>{" "}
                        <span>{ingredient.note || ingredient.display}</span>
                      </>
                    ) : (
                      <span className="font-medium">
                        {ingredient.display || ingredient.note}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
