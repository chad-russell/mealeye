"use client";

import { useState, useEffect, useMemo } from "react";
import { components } from "@/lib/types/openapi-generated";
import InstructionsSection from "./InstructionsSection";
import IngredientsList from "./IngredientsList";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { findIngredientAssociations } from "@/lib/server/actions";
import {
  createIngredientStepMapping,
  getIngredientsForStep,
  getStepsForIngredient,
} from "@/lib/utils/ingredient-mapping";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";

type RecipeStep = components["schemas"]["RecipeStep"];
type ApiIngredient = components["schemas"]["RecipeIngredient-Output"];
type RecipeIngredient = ApiIngredient & {
  referenceId: string;
};

interface RecipeContentProps {
  recipeId: string;
  instructions: RecipeStep[];
  ingredients: ApiIngredient[];
}

export default function RecipeContent({
  recipeId,
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
  const [associationStatus, setAssociationStatus] = useState<
    "valid" | "outdated" | "none"
  >("none");

  // Create the ingredient-step mapping when associations change
  const mapping = useMemo(() => {
    return createIngredientStepMapping(ingredients, associations);
  }, [ingredients, associations]);

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

  const handleGenerateAssociations = async () => {
    setIsLoading(true);
    try {
      const result = await findIngredientAssociations(
        recipeId,
        ingredients,
        instructions
      );
      setAssociations(result.associations);
      setAssociationStatus(result.status);
    } catch (error) {
      console.error("[RecipeContent] Error generating associations:", error);
      setAssociationStatus("none");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {associationStatus === "none" && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Ingredient Associations</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              This recipe doesn't have any ingredient associations yet.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAssociations}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Generate Associations"
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {associationStatus === "outdated" && (
        <Alert variant="warning">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Outdated Associations</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>
              The recipe has been modified since the associations were last
              generated.
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateAssociations}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                "Regenerate Associations"
              )}
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <IngredientsList
          ingredients={ingredients}
          completedInstructions={completedInstructions}
          highlightedIngredientIds={highlightedIngredientIds}
          onIngredientHover={(id) =>
            handleIngredientHover(id ? [id] : undefined)
          }
          usedIngredients={usedIngredients}
        />
        <InstructionsSection
          instructions={instructions}
          ingredients={ingredients}
          onInstructionComplete={setCompletedInstructions}
          onIngredientHover={handleIngredientHover}
          highlightedIngredientIds={highlightedIngredientIds}
          highlightedStepNumbers={highlightedStepNumbers}
          associations={associations}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
