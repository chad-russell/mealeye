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

interface InstructionCardProps {
  instruction: RecipeStep;
  index: number;
  ingredients: RecipeIngredient[];
  onInstructionComplete: (index: number, completed: boolean) => void;
  highlightedIngredientIds: Set<string>;
  isHighlighted: boolean;
  onIngredientHover: (ingredientIds: string[] | undefined) => void;
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
  const [referencedIngredients, setReferencedIngredients] = useState<
    RecipeIngredient[]
  >([]);

  // Find ingredient references in the instruction text using our new matching system
  useEffect(() => {
    const fetchIngredients = async () => {
      if (!instruction.text || !associations?.length) return;

      const stepAssociations = associations.filter((a) => a.step === index + 1);
      const found = await findIngredientsInText(
        instruction.text,
        ingredients,
        stepAssociations
      );
      setReferencedIngredients(found);
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
    if (hovering && referencedIngredients.length > 0) {
      onIngredientHover(referencedIngredients.map((ing) => ing.referenceId));
    } else {
      onIngredientHover(undefined);
    }
  };

  const renderInstructionText = (text: string) => {
    let result = text;

    // Sort ingredients by length (longest first) to handle overlapping matches correctly
    const sortedIngredients = [...referencedIngredients].sort((a, b) => {
      const aText = (a.note || a.display || "").length;
      const bText = (b.note || b.display || "").length;
      return bText - aText;
    });

    sortedIngredients.forEach((ing) => {
      const ingText = ing.note || ing.display || "";
      // Create a regex that handles word boundaries and is case insensitive
      const regex = new RegExp(`\\b${ingText}\\b`, "gi");
      result = result.replace(
        regex,
        (match) => `<span 
          class="cursor-pointer rounded px-1 transition-colors duration-200 ${
            highlightedIngredientIds.has(ing.referenceId)
              ? "bg-yellow-100"
              : "hover:bg-yellow-50"
          }"
          data-ingredient-id="${ing.referenceId}"
        >${match}</span>`
      );
    });

    return (
      <div
        className="text-gray-600"
        dangerouslySetInnerHTML={{ __html: result }}
        onMouseOver={(e) => {
          const target = e.target as HTMLElement;
          if (target.hasAttribute("data-ingredient-id")) {
            const id = target.getAttribute("data-ingredient-id")!;
            onIngredientHover([id]);
          } else {
            // Check if we're hovering over a child of a highlighted ingredient
            const parent = target.closest(
              "[data-ingredient-id]"
            ) as HTMLElement;
            if (parent) {
              const id = parent.getAttribute("data-ingredient-id")!;
              onIngredientHover([id]);
            }
          }
        }}
        onMouseOut={(e) => {
          const target = e.target as HTMLElement;
          const relatedTarget = e.relatedTarget as HTMLElement;

          // Only clear highlight if we're not moving to another part of the same ingredient
          // and we're not hovering the step card
          if (
            !target.contains(relatedTarget) &&
            !relatedTarget?.closest("[data-ingredient-id]") &&
            !isStepHovered
          ) {
            onIngredientHover(undefined);
          }
        }}
      />
    );
  };

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
        {instruction.text && renderInstructionText(instruction.text)}
      </div>
    </div>
  );
};

interface InstructionsSectionProps {
  instructions: RecipeStep[];
  ingredients: RecipeIngredient[];
  onInstructionComplete: (completedSteps: boolean[]) => void;
  onIngredientHover: (ingredientIds: string[] | undefined) => void;
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
