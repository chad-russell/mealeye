import { Button } from "@/components/ui/button";
import { RefreshCw, Settings2 } from "lucide-react";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { RecipeStep, ApiIngredient } from "@/lib/types/recipe";
import AssociationEditorDialog from "./AssociationEditorDialog";
import { cn } from "@/lib/utils";

interface RecipeSettingsDialogProps {
  associationStatus: "valid" | "outdated" | "none";
  onClearAndRegenerate: () => void;
  onClearOnly: () => void;
  ingredients: ApiIngredient[];
  instructions: RecipeStep[];
  associations: IngredientAssociation[];
  onSaveAssociations: (associations: IngredientAssociation[]) => Promise<void>;
  isLoading?: boolean;
}

export default function RecipeSettingsDialog({
  associationStatus,
  onClearAndRegenerate,
  onClearOnly,
  ingredients,
  instructions,
  associations,
  onSaveAssociations,
  isLoading = false,
}: RecipeSettingsDialogProps) {
  return (
    <div className="space-y-6">
      {/* Ingredient Associations Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Ingredient Associations</h3>
          <p className="text-sm text-muted-foreground">
            Associations help track which ingredients are used in each step of
            the recipe. This enables interactive features like highlighting
            connected ingredients and steps, and marking ingredients as used
            when their steps are completed.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            {associationStatus === "valid"
              ? "Ingredient associations are up to date"
              : associationStatus === "outdated"
              ? "Ingredient associations need to be updated"
              : "No ingredient associations found"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="default"
            className="w-full"
            onClick={onClearAndRegenerate}
            disabled={isLoading}
          >
            <RefreshCw
              className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
            />
            Clear & Regenerate
          </Button>
          {associationStatus === "valid" && (
            <AssociationEditorDialog
              ingredients={ingredients}
              instructions={instructions}
              associations={associations}
              onSave={onSaveAssociations}
            />
          )}
        </div>
      </div>
    </div>
  );
}
