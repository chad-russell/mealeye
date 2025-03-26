"use client";

import { useState, useEffect, useMemo } from "react";
import { components } from "@/app/lib/types/openapi-generated";
import InstructionsSection from "./InstructionsSection";
import IngredientsList from "./IngredientsList";
import { type IngredientAssociation } from "@/app/lib/utils/ingredient-matching";
import { findIngredientAssociations } from "@/app/lib/server/actions";
import {
  createIngredientStepMapping,
  getIngredientsForStep,
  getStepsForIngredient,
} from "@/app/lib/utils/ingredient-mapping";

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
  const [highlightedStepNumbers, setHighlightedStepNumbers] = useState<
    Set<number>
  >(new Set());
  const [completedInstructions, setCompletedInstructions] = useState<boolean[]>(
    new Array(instructions.length).fill(false)
  );
  const [usedIngredients, setUsedIngredients] = useState<Set<string>>(
    new Set()
  );
  const [associations, setAssociations] = useState<IngredientAssociation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Create the ingredient-step mapping when associations change
  const mapping = useMemo(() => {
    return createIngredientStepMapping(ingredients, associations);
  }, [ingredients, associations]);

  // Fetch ingredient associations using server action when ingredients or instructions change
  useEffect(() => {
    const fetchAssociations = async () => {
      if (ingredients.length === 0 || instructions.length === 0) return;

      setIsLoading(true);
      try {
        // Comment out the API call for development
        // const newAssociations = await findIngredientAssociations(
        //   ingredients,
        //   instructions
        // );
        // if (newAssociations) {
        //   setAssociations(newAssociations);
        // }

        // Hardcoded associations for development
        const hardcodedAssociations = [
          {
            ingredient: "flank steak or flap steak",
            amount: "1.5 lb",
            step: 1,
            text: "the sliced steak",
          },
          {
            ingredient: "cornstarch",
            amount: "¼ cup",
            step: 1,
            text: "cornstarch",
          },
          {
            ingredient: "water",
            amount: "½ cup",
            step: 2,
            text: "the water",
          },
          {
            ingredient: "packed brown sugar",
            amount: "⅓ cup",
            step: 2,
            text: "brown sugar",
          },
          {
            ingredient: "low-sodium soy sauce",
            amount: "¼ cup and 2 tablespoons",
            step: 2,
            text: "soy sauce",
          },
          {
            ingredient: "sesame oil",
            amount: "1.5 tablespoons",
            step: 2,
            text: "sesame oil",
          },
          {
            ingredient: "minced garlic",
            amount: "1 tablespoon",
            step: 2,
            text: "garlic",
          },
          {
            ingredient: "minced ginger",
            amount: "2 teaspoons",
            step: 2,
            text: "ginger",
          },
          {
            ingredient: "red pepper flakes",
            amount: "1 teaspoon",
            step: 2,
            text: "red pepper flakes",
          },
          {
            ingredient: "black pepper",
            amount: "1 teaspoon",
            step: 2,
            text: "black pepper",
          },
          {
            ingredient: "scallions",
            amount: "2",
            step: 3,
            text: "sliced scallions",
          },
          {
            ingredient: "white sesame seeds",
            amount: "1 tablespoon",
            step: 3,
            text: "sesame seeds",
          },
          {
            ingredient: "cooked rice",
            amount: "unknown",
            step: 4,
            text: "rice",
          },
          {
            ingredient: "scallions",
            amount: "unknown",
            step: 4,
            text: "more scallions",
          },
        ];

        setAssociations(hardcodedAssociations);
      } catch (error) {
        console.error("[RecipeContent] Error setting associations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssociations();
  }, [ingredients, instructions]);

  // Update used ingredients when instructions are completed
  useEffect(() => {
    const newUsedIngredients = new Set<string>();
    const allIngredients = new Set(ingredients.map((ing) => ing.referenceId));

    // For each ingredient, check if all steps that use it are completed
    allIngredients.forEach((ingredientId) => {
      const stepsUsingIngredient = getStepsForIngredient(ingredientId, mapping);
      const allStepsCompleted = stepsUsingIngredient.every(
        (stepNum) => completedInstructions[stepNum - 1]
      );

      if (allStepsCompleted && stepsUsingIngredient.length > 0) {
        newUsedIngredients.add(ingredientId);
      }
    });

    setUsedIngredients(newUsedIngredients);
  }, [completedInstructions, mapping, ingredients]);

  // Guard against undefined props
  if (!instructions?.length || !ingredients?.length) {
    return null;
  }

  const handleIngredientHover = (
    ingredientIds: string[] | undefined,
    isStepHover: boolean = false
  ) => {
    if (!ingredientIds) {
      setHighlightedIngredientIds(new Set());
      setHighlightedStepNumbers(new Set());
      return;
    }

    if (isStepHover) {
      // For step hover, the first ID is actually the step number
      const stepNumber = parseInt(ingredientIds[0]);
      console.log("[RecipeContent] Step hover:", { stepNumber, mapping });
      const ingredientsInStep = getIngredientsForStep(stepNumber, mapping);
      console.log(
        "[RecipeContent] Found ingredients for step:",
        ingredientsInStep
      );
      setHighlightedIngredientIds(new Set(ingredientsInStep));
      setHighlightedStepNumbers(new Set([stepNumber]));
    } else {
      // For ingredient hover, get all steps that use the ingredient
      const steps = getStepsForIngredient(ingredientIds[0], mapping);
      setHighlightedIngredientIds(new Set(ingredientIds));
      setHighlightedStepNumbers(new Set(steps));
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
            handleIngredientHover(id ? [id] : undefined, false)
          }
          usedIngredients={usedIngredients}
        />
      </div>
      <div>
        <InstructionsSection
          instructions={instructions}
          ingredients={ingredients}
          onInstructionComplete={setCompletedInstructions}
          onIngredientHover={(ids, isStepHover) =>
            handleIngredientHover(ids, isStepHover)
          }
          highlightedIngredientIds={highlightedIngredientIds}
          highlightedStepNumbers={highlightedStepNumbers}
          associations={associations}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
