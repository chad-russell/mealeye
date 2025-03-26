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
    className?: string;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
  }>;
}

const HighlightedText = ({ text, highlights }: HighlightedTextProps) => {
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
  const tokens: Array<{
    text: string;
    highlight?: (typeof highlights)[number];
  }> = [];
  let currentIndex = 0;

  sortedHighlights.forEach((highlight) => {
    const index = text.indexOf(highlight.text, currentIndex);
    if (index === -1) return;

    // Add text before the highlight
    if (index > currentIndex) {
      tokens.push({
        text: text.slice(currentIndex, index),
      });
    }

    // Add the highlighted text
    tokens.push({
      text: highlight.text,
      highlight,
    });

    currentIndex = index + highlight.text.length;
  });

  // Add remaining text after last highlight
  if (currentIndex < text.length) {
    tokens.push({
      text: text.slice(currentIndex),
    });
  }

  return (
    <div className="text-gray-600">
      {tokens.map((token, i) =>
        token.highlight ? (
          <span
            key={i}
            className={token.highlight.className}
            onClick={token.highlight.onClick}
            onMouseEnter={token.highlight.onMouseEnter}
            onMouseLeave={token.highlight.onMouseLeave}
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
  onStepHover: (stepNumber: number | null) => void;
  hoveredStepNumber: number | null;
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
  onStepHover,
  hoveredStepNumber,
  associations = [],
}: InstructionCardProps) => {
  const [isCompleted, setIsCompleted] = useState(false);
  const [hoveredIngredient, setHoveredIngredient] = useState<string | null>(
    null
  );
  const stepNumber = index + 1;

  const toggleCompleted = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newCompleted = !isCompleted;
    setIsCompleted(newCompleted);
    onInstructionComplete(index, newCompleted);
  };

  // Get highlights for this step
  const stepHighlights = useMemo(() => {
    // First get associations for this specific step
    const stepAssociations = associations.filter(
      (assoc) => assoc.step === stepNumber
    );

    return stepAssociations
      .map((assoc) => {
        // Find the matching ingredient
        const matchingIngredient = ingredients.find((ing) => {
          const ingText = (ing.note || ing.display || "").toLowerCase().trim();
          const assocText = assoc.ingredient.toLowerCase().trim();
          return (
            ingText === assocText ||
            ingText.includes(assocText) ||
            assocText.includes(ingText)
          );
        });

        if (!matchingIngredient) return null;

        return {
          text: assoc.text,
          ingredient: matchingIngredient.referenceId,
        };
      })
      .filter((h): h is NonNullable<typeof h> => h !== null);
  }, [associations, stepNumber, ingredients]);

  // Convert step highlights to highlighted text format based on current state
  const activeHighlights = useMemo(() => {
    // If there's a hovered step and it's not this one, don't show any highlights
    if (hoveredStepNumber !== null && hoveredStepNumber !== stepNumber) {
      return [];
    }

    return stepHighlights
      .filter((h) => {
        // If we're hovering an ingredient, only show that ingredient's highlights
        if (hoveredIngredient) {
          return h.ingredient === hoveredIngredient;
        }

        // If we're hovering a step (or no hover), show all highlighted ingredients for this step
        return highlightedIngredientIds.has(h.ingredient);
      })
      .map((h) => ({
        text: h.text,
        className:
          "cursor-pointer transition-colors duration-200 bg-amber-100 text-amber-900",
        onMouseEnter: () => {
          setHoveredIngredient(h.ingredient);
          onIngredientHover([h.ingredient], false);
        },
        onMouseLeave: (e: React.MouseEvent) => {
          const relatedTarget = e.relatedTarget as Element | null;
          if (!relatedTarget?.closest) {
            setHoveredIngredient(null);
            onIngredientHover(undefined);
            return;
          }

          if (!relatedTarget.closest("[data-ingredient-id]")) {
            setHoveredIngredient(null);
            // If we're still within the instruction card, trigger the step hover
            if (relatedTarget.closest(".instruction-card")) {
              onIngredientHover([String(stepNumber)], true);
            } else {
              onIngredientHover(undefined);
            }
          }
        },
      }));
  }, [
    stepHighlights,
    highlightedIngredientIds,
    hoveredIngredient,
    hoveredStepNumber,
    stepNumber,
    onIngredientHover,
  ]);

  isHighlighted =
    isHighlighted &&
    (hoveredStepNumber !== null ? hoveredStepNumber === stepNumber : true);

  return (
    <div
      className={`mb-4 rounded-lg border shadow-sm overflow-hidden bg-white transition-all duration-200 instruction-card ${
        isHighlighted
          ? "border-yellow-200 bg-yellow-50 shadow-md"
          : "border-gray-100"
      }`}
      onMouseEnter={() => onStepHover(stepNumber)}
      onMouseLeave={() => {
        onStepHover(null);
        setHoveredIngredient(null);
      }}
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
            highlights={activeHighlights}
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
  const [hoveredStepNumber, setHoveredStepNumber] = useState<number | null>(
    null
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

  const handleStepHover = (stepNumber: number | null) => {
    setHoveredStepNumber(stepNumber);
    if (stepNumber !== null) {
      onIngredientHover([String(stepNumber)], true);
    } else {
      onIngredientHover(undefined);
    }
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
            onStepHover={handleStepHover}
            hoveredStepNumber={hoveredStepNumber}
            associations={associations}
          />
        ))}
      </div>
    </div>
  );
}
