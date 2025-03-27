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

type Recipe = components["schemas"]["Recipe-Output"];

interface RecipeMetadataProps {
  recipe: Recipe;
  associationStatus: "valid" | "outdated" | "none";
  isLoading: boolean;
  onGenerateAssociations: () => Promise<void>;
  onClearAssociations: () => Promise<void>;
}

export default function RecipeMetadata({
  recipe,
  associationStatus,
  isLoading: externalIsLoading,
  onGenerateAssociations,
  onClearAssociations,
}: RecipeMetadataProps) {
  const [internalIsLoading, setInternalIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isLoading = internalIsLoading || externalIsLoading;
  const { toast } = useToast();

  const handleGenerateClick = async () => {
    try {
      setInternalIsLoading(true);
      await onGenerateAssociations();

      toast({
        title: "Associations Generated",
        description:
          "Successfully analyzed recipe and generated ingredient associations.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description:
          "There was an error generating ingredient associations. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      console.error("[RecipeMetadata] Error generating associations:", error);
    } finally {
      setInternalIsLoading(false);
    }
  };

  const handleClearClick = async () => {
    try {
      setInternalIsLoading(true);
      await onClearAssociations();

      toast({
        title: "Associations Cleared",
        description: "Successfully cleared ingredient associations.",
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: "Clear Failed",
        description:
          "There was an error clearing ingredient associations. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
      console.error("[RecipeMetadata] Error clearing associations:", error);
    } finally {
      setInternalIsLoading(false);
    }
  };

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
              <DialogTitle>Recipe Settings</DialogTitle>
              <DialogDescription>
                Configure settings and actions for {recipe.name}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Ingredient Associations</h3>
                <p className="text-sm text-muted-foreground">
                  {associationStatus === "valid"
                    ? "Ingredient associations are up to date"
                    : associationStatus === "outdated"
                    ? "Ingredient associations need to be updated"
                    : "No ingredient associations generated yet"}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleGenerateClick}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        {associationStatus === "valid"
                          ? "Clear & Regenerate"
                          : "Generate Associations"}
                      </>
                    )}
                  </Button>
                  {associationStatus === "valid" && (
                    <Button
                      onClick={handleClearClick}
                      disabled={isLoading}
                      variant="outline"
                      className="flex-1"
                    >
                      Clear Only
                    </Button>
                  )}
                </div>
              </div>

              {/* Add more settings sections here */}
            </div>
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
