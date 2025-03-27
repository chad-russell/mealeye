import { useState, useRef, type ReactNode } from "react";
import { RecipeStep, ApiIngredient } from "@/lib/types/recipe";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AssociationEditorProps {
  ingredients: ApiIngredient[];
  instructions: RecipeStep[];
  initialAssociations: IngredientAssociation[];
  onSave: (associations: IngredientAssociation[]) => void;
}

export default function AssociationEditor({
  ingredients,
  instructions,
  initialAssociations,
  onSave,
}: AssociationEditorProps) {
  // State for the currently selected ingredient
  const [selectedIngredient, setSelectedIngredient] =
    useState<ApiIngredient | null>(null);

  // State for the current text selection
  const [textSelection, setTextSelection] = useState<{
    stepIndex: number;
    text: string;
    start: number;
    end: number;
  } | null>(null);

  // State for all associations
  const [associations, setAssociations] =
    useState<IngredientAssociation[]>(initialAssociations);

  // Add hover state
  const [hoveredAssociation, setHoveredAssociation] =
    useState<IngredientAssociation | null>(null);

  // Handle text selection in steps
  const handleStepSelect = (e: MouseEvent, stepIndex: number) => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setTextSelection(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const text = range.toString().trim();
    if (!text) {
      setTextSelection(null);
      return;
    }

    setTextSelection({
      stepIndex,
      text,
      start: range.startOffset,
      end: range.endOffset,
    });
  };

  // Create a new association from current selection
  const handleCreateAssociation = () => {
    if (!selectedIngredient || !textSelection) return;

    const newAssociation: IngredientAssociation = {
      ingredient: selectedIngredient.note || selectedIngredient.display || "",
      text: textSelection.text,
      step: textSelection.stepIndex + 1,
    };

    setAssociations([...associations, newAssociation]);
    setSelectedIngredient(null);
    setTextSelection(null);
  };

  // Remove an association
  const handleRemoveAssociation = (index: number) => {
    const newAssociations = [...associations];
    newAssociations.splice(index, 1);
    setAssociations(newAssociations);
  };

  // Save all changes
  const handleSave = () => {
    onSave(associations);
  };

  // Helper to check if an ingredient matches the hovered association
  const isIngredientHighlighted = (ingredient: ApiIngredient) => {
    if (!hoveredAssociation) return false;
    return (
      (ingredient.note || ingredient.display) === hoveredAssociation.ingredient
    );
  };

  // Helper to check if an instruction step matches the hovered association
  const isInstructionHighlighted = (index: number) => {
    if (!hoveredAssociation) return false;
    return index + 1 === hoveredAssociation.step;
  };

  // Helper to render instruction text with highlighted portions
  const renderInstructionText = (text: string, index: number) => {
    if (!hoveredAssociation || hoveredAssociation.step !== index + 1) {
      return text;
    }

    const matchText = hoveredAssociation.text;

    // Find the first occurrence of the text
    const startIndex = text.toLowerCase().indexOf(matchText.toLowerCase());
    if (startIndex === -1) return text;

    const endIndex = startIndex + matchText.length;
    const parts: ReactNode[] = [];

    // Add text before the highlight
    if (startIndex > 0) {
      parts.push(<span key="pre">{text.slice(0, startIndex)}</span>);
    }

    // Add the highlighted text (preserve original casing)
    // Split the highlighted text into words and wrap each one
    const highlightedText = text.slice(startIndex, endIndex);
    const words = highlightedText.split(/(\s+)/);

    parts.push(
      <span key="highlight" className="inline">
        {words.map((word, i) => {
          // If it's a whitespace token, render it as-is
          if (word.trim() === "") {
            return <span key={i}>{word}</span>;
          }
          // Otherwise wrap it in our highlight styling
          return (
            <span key={i} className="relative inline-block">
              <span className="relative z-10">{word}</span>
              <span
                className="absolute inset-0 -mx-0.5 bg-yellow-100 dark:bg-yellow-900 rounded"
                style={{ zIndex: 1 }}
              />
            </span>
          );
        })}
      </span>
    );

    // Add text after the highlight
    if (endIndex < text.length) {
      parts.push(<span key="post">{text.slice(endIndex)}</span>);
    }

    return <>{parts}</>;
  };

  return (
    <div className="flex flex-col h-[70vh] max-h-[800px]">
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
        {/* Ingredients Column */}
        <div className="border rounded-lg p-4 flex flex-col min-h-0">
          <h3 className="font-medium mb-4">Ingredients</h3>
          <ScrollArea className="flex-1">
            <div className="space-y-2 pr-4">
              {ingredients.map((ingredient) => (
                <div
                  key={ingredient.referenceId}
                  className={cn(
                    "p-2 rounded cursor-pointer transition-colors border border-border",
                    selectedIngredient?.referenceId === ingredient.referenceId
                      ? "bg-primary text-primary-foreground"
                      : isIngredientHighlighted(ingredient)
                      ? "bg-yellow-100 dark:bg-yellow-900"
                      : "hover:bg-accent"
                  )}
                  onClick={() => setSelectedIngredient(ingredient)}
                >
                  {ingredient.note || ingredient.display}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Instructions Column */}
        <div className="border rounded-lg p-4 flex flex-col min-h-0">
          <h3 className="font-medium mb-4">Instructions</h3>
          <ScrollArea className="flex-1">
            <div className="space-y-4 pr-4">
              {instructions.map((instruction, index) => (
                <div
                  key={index}
                  className={cn(
                    "p-2 rounded transition-colors",
                    "hover:bg-accent border border-border"
                  )}
                  onMouseUp={(e) => handleStepSelect(e as any, index)}
                >
                  <div className="font-medium mb-1">Step {index + 1}</div>
                  <div>{renderInstructionText(instruction.text, index)}</div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Current Selection Info */}
      {selectedIngredient && textSelection && (
        <div className="border-t mt-4 pt-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-medium">Selected: </span>
              <Badge variant="outline" className="mr-2">
                {selectedIngredient.note || selectedIngredient.display}
              </Badge>
              <span className="font-medium">Text: </span>
              <Badge variant="outline">"{textSelection.text}"</Badge>
            </div>
            <Button onClick={handleCreateAssociation}>
              Create Association
            </Button>
          </div>
        </div>
      )}

      {/* Existing Associations */}
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Current Associations</h3>
        <ScrollArea className="h-[200px] rounded-md border">
          <div className="p-4">
            {associations.map((association, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-center justify-between py-2 px-2 first:pt-0 last:pb-0 border border-border rounded mb-2",
                  "hover:bg-accent/50 transition-colors"
                )}
                onMouseEnter={() => setHoveredAssociation(association)}
                onMouseLeave={() => setHoveredAssociation(null)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{association.ingredient}</span>
                  <span className="text-gray-500">→</span>
                  <span>Step {association.step}</span>
                  <span className="text-gray-500">"{association.text}"</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveAssociation(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </div>

      {/* Save Button */}
      <div className="border-t mt-4 pt-4 flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
