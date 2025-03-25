"use client";

import { useState, useEffect, useMemo } from "react";
import { components } from "@/app/lib/types/openapi-generated";
import InstructionsSection from "./InstructionsSection";
import IngredientsList from "./IngredientsList";

type RecipeStep = components["schemas"]["RecipeStep"];
type ApiIngredient = components["schemas"]["RecipeIngredient-Output"];
type RecipeIngredient = ApiIngredient & {
  referenceId: string;
};

interface RecipeContentProps {
  instructions: RecipeStep[];
  ingredients: ApiIngredient[];
}

export default function RecipeContent({
  instructions = [],
  ingredients: rawIngredients = [],
}: RecipeContentProps) {
  // Process ingredients to ensure they all have referenceIds
  const ingredients = useMemo(
    () =>
      rawIngredients.map((ing, index) => ({
        ...ing,
        referenceId: ing.referenceId || `ingredient-${index}`,
      })),
    [rawIngredients]
  );

  const [highlightedIngredientIds, setHighlightedIngredientIds] = useState<
    Set<string>
  >(new Set());
  const [completedInstructions, setCompletedInstructions] = useState<boolean[]>(
    new Array(instructions.length).fill(false)
  );
  const [usedIngredients, setUsedIngredients] = useState<Set<string>>(
    new Set()
  );

  // Update used ingredients when instructions are completed
  useEffect(() => {
    const newUsedIngredients = new Set<string>();

    instructions.forEach((instruction, index) => {
      if (completedInstructions[index] && instruction?.text) {
        ingredients.forEach((ing) => {
          const ingredientText = ing?.note || ing?.display || "";
          if (
            instruction.text
              ?.toLowerCase()
              .includes(ingredientText.toLowerCase()) &&
            ing.referenceId
          ) {
            newUsedIngredients.add(ing.referenceId);
          }
        });
      }
    });

    setUsedIngredients(newUsedIngredients);
  }, [completedInstructions, instructions, ingredients]);

  // Guard against undefined props
  if (!instructions?.length || !ingredients?.length) {
    return null;
  }

  const handleIngredientHover = (ingredientIds: string[] | undefined) => {
    if (!ingredientIds) {
      setHighlightedIngredientIds(new Set());
    } else {
      setHighlightedIngredientIds(new Set(ingredientIds));
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div>
        <IngredientsList
          ingredients={ingredients}
          completedInstructions={completedInstructions}
          highlightedIngredientIds={highlightedIngredientIds}
          onIngredientHover={(id) =>
            handleIngredientHover(id ? [id] : undefined)
          }
          usedIngredients={usedIngredients}
        />
      </div>
      <div>
        <InstructionsSection
          instructions={instructions}
          ingredients={ingredients}
          onInstructionComplete={setCompletedInstructions}
          onIngredientHover={handleIngredientHover}
          highlightedIngredientIds={highlightedIngredientIds}
        />
      </div>
    </div>
  );
}
