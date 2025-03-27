import { Button } from "@/components/ui/button";
import { RefreshCw, Settings2 } from "lucide-react";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { components } from "@/lib/types/openapi-generated";
import AssociationEditorDialog from "./AssociationEditorDialog";

type RecipeStep = components["schemas"]["RecipeStep"];
type ApiIngredient =
  components["schemas"]["Recipe-Output"]["recipeIngredient"][number];

interface RecipeSettingsDialogProps {
  associationStatus: "valid" | "outdated" | "none";
  onClearAndRegenerate: () => void;
  onClearOnly: () => void;
  ingredients: ApiIngredient[];
  instructions: RecipeStep[];
  associations: IngredientAssociation[];
  onSaveAssociations: (associations: IngredientAssociation[]) => Promise<void>;
}

export default function RecipeSettingsDialog({
  associationStatus,
  onClearAndRegenerate,
  onClearOnly,
  ingredients,
  instructions,
  associations,
  onSaveAssociations,
}: RecipeSettingsDialogProps) {
  return (
    <div className="space-y-6">
      {/* Ingredient Associations Section */}
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Ingredient Associations</h3>
          <p className="text-sm text-muted-foreground">
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
          >
            <RefreshCw className="mr-2 h-4 w-4" />
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
