"use client";

import { useState } from "react";
import { components } from "@/lib/types/openapi-generated";
import HeroImage from "@/app/components/recipe/HeroImage";
import RecipeMetadata from "@/app/components/recipe/RecipeMetadata";
import RecipeContent from "@/app/components/recipe/RecipeContent";
import NotesSection from "@/app/components/recipe/NotesSection";
import { findIngredientAssociations } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";

interface RecipePageContentProps {
  recipe: components["schemas"]["Recipe-Output"];
}

export default function RecipePageContent({ recipe }: RecipePageContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [associationStatus, setAssociationStatus] = useState<
    "valid" | "outdated" | "none"
  >("none");
  const { toast } = useToast();

  const handleGenerateAssociations = async () => {
    if (!recipe.id) return;

    setIsLoading(true);
    try {
      const result = await findIngredientAssociations(
        recipe.id,
        recipe.recipeIngredient || [],
        recipe.recipeInstructions || [],
        true
      );
      setAssociationStatus(result.status);
      toast({
        title: "Success",
        description: "Successfully generated ingredient associations",
      });
    } catch (error) {
      console.error("Error generating associations:", error);
      toast({
        title: "Error",
        description: "Failed to generate ingredient associations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Hero Section */}
      {recipe.id && (
        <HeroImage
          recipeId={recipe.id}
          recipeName={recipe.name || "Untitled Recipe"}
        />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Metadata Section */}
        <RecipeMetadata
          recipe={recipe}
          associationStatus={associationStatus}
          isLoading={isLoading}
          onGenerateAssociations={handleGenerateAssociations}
        />

        {/* Recipe Content */}
        <div className="mt-8">
          <RecipeContent
            recipeId={recipe.id || ""}
            instructions={recipe.recipeInstructions || []}
            ingredients={recipe.recipeIngredient || []}
            associationStatus={associationStatus}
            setAssociationStatus={setAssociationStatus}
          />
        </div>

        {/* Notes Section */}
        {recipe.notes && recipe.notes.length > 0 && (
          <div className="mt-8">
            <NotesSection notes={recipe.notes} />
          </div>
        )}
      </div>
    </div>
  );
}
