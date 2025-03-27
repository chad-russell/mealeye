import { useState, useRef } from "react";
import { components } from "@/lib/types/openapi-generated";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

type RecipeStep = components["schemas"]["RecipeStep"];
type ApiIngredient = components["schemas"]["RecipeIngredient-Output"];

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
                  className={`p-2 rounded cursor-pointer transition-colors ${
                    selectedIngredient?.referenceId === ingredient.referenceId
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
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
                  className="p-2 rounded hover:bg-accent"
                  onMouseUp={(e) => handleStepSelect(e as any, index)}
                >
                  <div className="font-medium mb-1">Step {index + 1}</div>
                  <div>{instruction.text}</div>
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
      <div className="border-t mt-4 pt-4">
        <h3 className="font-medium mb-4">Current Associations</h3>
        <ScrollArea className="max-h-[200px]">
          <div className="space-y-2 pr-4">
            {associations.map((assoc, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <Badge variant="outline" className="mr-2">
                    {assoc.ingredient}
                  </Badge>
                  <span className="mr-2">→</span>
                  <Badge variant="outline" className="mr-2">
                    Step {assoc.step}
                  </Badge>
                  <span>"{assoc.text}"</span>
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
        </ScrollArea>
      </div>

      {/* Save Button */}
      <div className="border-t mt-4 pt-4 flex justify-end">
        <Button onClick={handleSave}>Save Changes</Button>
      </div>
    </div>
  );
}
