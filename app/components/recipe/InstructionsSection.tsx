"use client";

import { useState, useEffect, useMemo } from "react";
import { ChevronDown, ChevronUp, CheckCircle2 } from "lucide-react";
import { components } from "@/app/lib/types/openapi-generated";
import {
  findIngredientsInText,
  type IngredientAssociation,
} from "@/app/lib/utils/ingredient-matching";

type RecipeStep = components["schemas"]["RecipeStep"];
type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"] & {
  referenceId: string;
};

type TextToken = { type: "text"; text: string };
type IngredientToken = { type: "ingredient"; text: string; ingredient: string };
type Token = TextToken | IngredientToken;

interface HighlightedTextProps {
  text: string;
  highlights: Array<{
    text: string;
    ingredient: string;
  }>;
  highlightedIngredientIds: Set<string>;
  isHighlighted: boolean;
  onIngredientHover: (ids: string[] | undefined, isStepHover?: boolean) => void;
  isStepHovered: boolean;
}

const HighlightedText = ({
  text,
  highlights,
  highlightedIngredientIds,
  isHighlighted,
  onIngredientHover,
  isStepHovered,
}: HighlightedTextProps) => {
  // Sort highlights by start position (longest first to handle overlapping matches)
  const sortedHighlights = [...highlights].sort((a, b) => {
    const aIndex = text.indexOf(a.text);
    const bIndex = text.indexOf(b.text);
    if (aIndex === bIndex) {
      return b.text.length - a.text.length;
    }
    return aIndex - bIndex;
  });

  // Create tokens array
  const tokens: Token[] = [];
  let currentIndex = 0;

  sortedHighlights.forEach((highlight) => {
    const index = text.indexOf(highlight.text, currentIndex);
    if (index === -1) return;

    // Add text before the highlight
    if (index > currentIndex) {
      tokens.push({
        type: "text",
        text: text.slice(currentIndex, index),
      });
    }

    // Add the highlighted text
    tokens.push({
      type: "ingredient",
      text: highlight.text,
      ingredient: highlight.ingredient,
    });

    currentIndex = index + highlight.text.length;
  });

  // Add remaining text after last highlight
  if (currentIndex < text.length) {
    tokens.push({
      type: "text",
      text: text.slice(currentIndex),
    });
  }

  return (
    <div className={`text-gray-600 ${isHighlighted ? "bg-yellow-50" : ""}`}>
      {tokens.map((token, i) =>
        token.type === "ingredient" ? (
          <span
            key={i}
            className={`cursor-pointer transition-colors duration-200 ${
              highlightedIngredientIds.has(token.ingredient)
                ? "bg-orange-300 text-orange-900 font-semibold"
                : isHighlighted
                ? "bg-yellow-200 text-yellow-900"
                : "hover:bg-yellow-50"
            }`}
            data-ingredient-id={token.ingredient}
            onMouseEnter={() => onIngredientHover([token.ingredient])}
            onMouseLeave={(e) => {
              const relatedTarget = e.relatedTarget as HTMLElement;
              if (
                !relatedTarget?.closest("[data-ingredient-id]") &&
                !isStepHovered
              ) {
                onIngredientHover(undefined);
              }
            }}
          >
            {token.text}
          </span>
        ) : (
          <span key={i}>{token.text}</span>
        )
      )}
    </div>
  );
};

interface InstructionCardProps {
  instruction: RecipeStep;
  index: number;
  ingredients: RecipeIngredient[];
  onInstructionComplete: (index: number, completed: boolean) => void;
  highlightedIngredientIds: Set<string>;
  isHighlighted: boolean;
  onIngredientHover: (ids: string[] | undefined, isStepHover?: boolean) => void;
  associations: IngredientAssociation[];
}

const InstructionCard = ({
  instruction,
  index,
  ingredients,
  onInstructionComplete,
  highlightedIngredientIds,
  isHighlighted,
  onIngredientHover,
  associations = [],
}: InstructionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [isStepHovered, setIsStepHovered] = useState(false);
  const [referencedIngredientIds, setReferencedIngredientIds] = useState<
    string[]
  >([]);

  // Find ingredient references in the instruction text using our new matching system
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!instruction.text || !associations?.length) {
        console.log("[InstructionsSection] No text or associations, skipping", {
          text: instruction.text,
          associationsLength: associations?.length,
        });
        return;
      }

      const stepAssociations = associations.filter((a) => a.step === index + 1);
      console.log("[InstructionsSection] Step associations:", {
        step: index + 1,
        associations: stepAssociations.map((a) => ({
          ingredient: a.ingredient,
          step: a.step,
        })),
      });

      // Get ingredient IDs from associations
      const ingredientIds = stepAssociations
        .map((assoc) => {
          // Find the ingredient that matches this association
          const matchingIngredient = ingredients.find((ing) => {
            const ingText = (ing.note || ing.display || "")
              .toLowerCase()
              .trim();
            const assocText = assoc.ingredient.toLowerCase().trim();
            return (
              ingText === assocText ||
              ingText.includes(assocText) ||
              assocText.includes(ingText)
            );
          });

          if (!matchingIngredient) {
            console.log("[InstructionsSection] Could not find ingredient:", {
              association: assoc.ingredient,
              availableIngredients: ingredients.map(
                (ing) => ing.note || ing.display
              ),
            });
          }

          return matchingIngredient?.referenceId;
        })
        .filter((id): id is string => id !== undefined);

      console.log("[InstructionsSection] Found ingredient IDs:", {
        step: index + 1,
        ingredientIds,
        matchedIngredients: ingredients
          .filter((ing) => ingredientIds.includes(ing.referenceId))
          .map((ing) => ing.note || ing.display),
      });

      setReferencedIngredientIds(ingredientIds);
    };
    fetchIngredients();
  }, [instruction.text, ingredients, associations, index]);

  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    onInstructionComplete(index, newCompleted);
  };

  const handleStepHover = (hovering: boolean) => {
    setIsStepHovered(hovering);
    if (hovering) {
      // Pass the step number (1-based) instead of ingredient IDs
      onIngredientHover([String(index + 1)], true);
    } else {
      onIngredientHover(undefined);
    }
  };

  // Get highlights for this step
  const highlights = associations
    .filter((assoc) => assoc.step === index + 1)
    .map((assoc) => ({
      text: assoc.text,
      ingredient: assoc.ingredient,
    }));

  return (
    <div
      className={`mb-4 rounded-lg border shadow-sm overflow-hidden bg-white transition-all duration-200 ${
        isHighlighted
          ? "border-yellow-200 bg-yellow-50 shadow-md"
          : "border-gray-100"
      }`}
      onMouseEnter={() => handleStepHover(true)}
      onMouseLeave={() => handleStepHover(false)}
    >
      <div
        className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${
          isCompleted ? "bg-green-50 border-b border-green-100" : ""
        }`}
        onClick={toggleCompleted}
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 flex items-center justify-center">
            <CheckCircle2
              size={24}
              className={`transition-all duration-300 ${
                isCompleted ? "text-green-500" : "text-gray-300"
              }`}
              fill={isCompleted ? "currentColor" : "none"}
            />
          </div>
          <h3
            className={`font-medium ${
              isCompleted ? "text-green-700 line-through" : "text-gray-800"
            }`}
          >
            {instruction.title ? instruction.title : `Step ${index + 1}`}
          </h3>
        </div>
        <div className="text-gray-400">
          {isCompleted ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      <div
        className={`transition-all duration-300 ease-in-out ${
          isCompleted ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100"
        }`}
        style={{
          padding: isCompleted ? "0 16px 0 56px" : "16px 16px 16px 56px",
          overflow: "hidden",
        }}
      >
        {instruction.text && (
          <HighlightedText
            text={instruction.text}
            highlights={highlights}
            highlightedIngredientIds={highlightedIngredientIds}
            isHighlighted={isHighlighted}
            onIngredientHover={onIngredientHover}
            isStepHovered={isStepHovered}
          />
        )}
      </div>
    </div>
  );
};

interface InstructionsSectionProps {
  instructions: RecipeStep[];
  ingredients: RecipeIngredient[];
  onInstructionComplete: (completedSteps: boolean[]) => void;
  onIngredientHover: (ids: string[] | undefined, isStepHover?: boolean) => void;
  highlightedIngredientIds: Set<string>;
  highlightedStepNumbers: Set<number>;
  associations: IngredientAssociation[];
  isLoading: boolean;
}

export default function InstructionsSection({
  instructions = [],
  ingredients = [],
  onInstructionComplete,
  onIngredientHover,
  highlightedIngredientIds,
  highlightedStepNumbers,
  associations = [],
  isLoading = false,
}: InstructionsSectionProps) {
  const [completedSteps, setCompletedSteps] = useState<boolean[]>(
    new Array(instructions.length).fill(false)
  );

  if (!instructions || !ingredients) {
    return null;
  }

  const handleStepComplete = (index: number, completed: boolean) => {
    const newCompletedSteps = [...completedSteps];
    newCompletedSteps[index] = completed;
    setCompletedSteps(newCompletedSteps);
    onInstructionComplete(newCompletedSteps);
  };

  // Find which steps should be highlighted based on highlighted ingredients
  const highlightedSteps = useMemo(() => {
    if (highlightedIngredientIds.size === 0) return new Set<number>();

    // Get the names of highlighted ingredients
    const highlightedIngredientNames = ingredients
      .filter((ing) => highlightedIngredientIds.has(ing.referenceId))
      .map((ing) => (ing.note || ing.display || "").toLowerCase());

    // Find all steps that use these ingredients
    const stepNumbers = associations
      .filter((assoc) =>
        highlightedIngredientNames.includes(assoc.ingredient.toLowerCase())
      )
      .map((assoc) => assoc.step);

    console.log("[InstructionsSection] Highlighting steps:", {
      highlightedIngredients: highlightedIngredientNames,
      stepNumbers,
    });

    return new Set(stepNumbers);
  }, [highlightedIngredientIds, ingredients, associations]);

  return (
    <div className="space-y-4">
      <div className="p-6 bg-white rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-semibold text-gray-800">Instructions</h2>
      </div>
      <div className="space-y-4">
        {instructions.map((instruction, index) => (
          <InstructionCard
            key={index}
            instruction={instruction}
            index={index}
            ingredients={ingredients}
            onInstructionComplete={handleStepComplete}
            highlightedIngredientIds={highlightedIngredientIds}
            isHighlighted={highlightedStepNumbers.has(index + 1)}
            onIngredientHover={onIngredientHover}
            associations={associations}
          />
        ))}
      </div>
    </div>
  );
}
