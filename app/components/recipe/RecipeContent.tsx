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
        const newAssociations = await findIngredientAssociations(
          ingredients,
          instructions
        );
        if (newAssociations) {
          console.log(
            "[RecipeContent] Received associations:",
            newAssociations.map((a) => ({
              ingredient: a.ingredient,
              step: a.step,
            }))
          );
          setAssociations(newAssociations);
        }
      } catch (error) {
        console.error("[RecipeContent] Error fetching associations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAssociations();
  }, [ingredients, instructions]);

  // Update used ingredients when instructions are completed
  useEffect(() => {
    const newUsedIngredients = new Set<string>();

    completedInstructions.forEach((completed, index) => {
      if (completed) {
        const stepIngredients = getIngredientsForStep(index + 1, mapping);
        stepIngredients.forEach((id) => newUsedIngredients.add(id));
      }
    });

    setUsedIngredients(newUsedIngredients);
  }, [completedInstructions, mapping]);

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
