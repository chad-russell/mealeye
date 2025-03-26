"use client";

import { useState, useEffect, useMemo } from "react";
import { components } from "@/app/lib/types/openapi-generated";
import InstructionsSection from "./InstructionsSection";
import IngredientsList from "./IngredientsList";
import { type IngredientAssociation } from "@/app/lib/utils/ingredient-matching";
import { findIngredientAssociations } from "@/app/lib/server/actions";

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
        const stepAssociations = associations.filter(
          (assoc) => assoc.step === index + 1
        );
        stepAssociations.forEach((assoc) => {
          const ingredient = ingredients.find(
            (ing) =>
              (ing.note || ing.display || "").toLowerCase() ===
              assoc.ingredient.toLowerCase()
          );
          if (ingredient?.referenceId) {
            newUsedIngredients.add(ingredient.referenceId);
          }
        });
      }
    });

    setUsedIngredients(newUsedIngredients);
  }, [completedInstructions, associations, ingredients]);

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

    // Find all steps that use any of the hovered ingredients
    const hoveredIngredients = ingredients.filter((ing) =>
      ingredientIds.includes(ing.referenceId)
    );

    // Get the ingredient names for matching against associations
    const hoveredIngredientNames = hoveredIngredients.map((ing) =>
      (ing.note || ing.display || "").toLowerCase()
    );

    // Find all steps that use these ingredients
    const relevantStepNumbers = associations
      .filter((assoc) => {
        const assocIngredient = assoc.ingredient.toLowerCase();
        return hoveredIngredientNames.some(
          (name) =>
            // Check if either contains the other
            name.includes(assocIngredient) || assocIngredient.includes(name)
        );
      })
      .map((assoc) => assoc.step);

    console.log("[RecipeContent] Hover debug:", {
      isStepHover,
      hoveredIngredients: hoveredIngredients.map((ing) => ({
        id: ing.referenceId,
        name: ing.note || ing.display,
      })),
      hoveredNames: hoveredIngredientNames,
      relevantSteps: relevantStepNumbers,
    });

    // For ingredient hover, only highlight the hovered ingredient and its steps
    if (!isStepHover) {
      setHighlightedIngredientIds(new Set(ingredientIds));
      setHighlightedStepNumbers(new Set(relevantStepNumbers));
      return;
    }

    // For step hover, highlight all ingredients used in the step
    const allIngredientIds = new Set<string>();

    // Add all ingredients used in the hovered step
    associations
      .filter((assoc) => relevantStepNumbers.includes(assoc.step))
      .forEach((assoc) => {
        const ingredient = ingredients.find((ing) => {
          const ingName = (ing.note || ing.display || "").toLowerCase();
          const assocName = assoc.ingredient.toLowerCase();
          return ingName.includes(assocName) || assocName.includes(ingName);
        });
        if (ingredient?.referenceId) {
          allIngredientIds.add(ingredient.referenceId);
        }
      });

    setHighlightedIngredientIds(allIngredientIds);
    setHighlightedStepNumbers(new Set(relevantStepNumbers));
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
          onIngredientHover={(ids) => handleIngredientHover(ids, true)}
          highlightedIngredientIds={highlightedIngredientIds}
          highlightedStepNumbers={highlightedStepNumbers}
          associations={associations}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
