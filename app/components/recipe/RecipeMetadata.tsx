"use client";

import { useState } from "react";
import {
  Clock,
  Users,
  ChefHat,
  UtensilsCrossed,
  Settings2,
  RefreshCw,
  MoreVertical,
} from "lucide-react";
import { components } from "@/lib/types/openapi-generated";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import RecipeSettingsDialog from "./RecipeSettingsDialog";

type Recipe = components["schemas"]["Recipe-Output"];

interface RecipeMetadataProps {
  recipe: Recipe;
  associationStatus: "valid" | "outdated" | "none";
  isLoading: boolean;
  onGenerateAssociations: () => Promise<void>;
  onClearAssociations: () => Promise<void>;
  onSaveAssociations: (associations: IngredientAssociation[]) => Promise<void>;
  currentAssociations: IngredientAssociation[];
}

export default function RecipeMetadata({
  recipe,
  associationStatus,
  isLoading: externalIsLoading,
  onGenerateAssociations,
  onClearAssociations,
  onSaveAssociations,
  currentAssociations,
}: RecipeMetadataProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{recipe.name}</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon">
              <Settings2 className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="text-xl">Recipe Settings</DialogTitle>
              <DialogDescription>
                Configure settings and actions for <em>{recipe.name}</em>
              </DialogDescription>
            </DialogHeader>

            <RecipeSettingsDialog
              associationStatus={associationStatus}
              onClearAndRegenerate={onGenerateAssociations}
              onClearOnly={onClearAssociations}
              ingredients={recipe.recipeIngredient || []}
              instructions={recipe.recipeInstructions || []}
              associations={currentAssociations}
              onSaveAssociations={onSaveAssociations}
            />
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex gap-4 text-sm text-gray-600">
          <div>
            <span className="font-semibold">Prep Time:</span>{" "}
            {recipe.prepTime || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Cook Time:</span>{" "}
            {recipe.cookTime || "N/A"}
          </div>
          <div>
            <span className="font-semibold">Total Time:</span>{" "}
            {recipe.totalTime || "N/A"}
          </div>
        </div>
        {recipe.description && (
          <p className="text-sm text-gray-600">{recipe.description}</p>
        )}
      </div>
    </div>
  );
}
