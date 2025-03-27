"use client";

import { useState, useEffect } from "react";
import { components } from "@/lib/types/openapi-generated";
import HeroImage from "@/app/components/recipe/HeroImage";
import RecipeMetadata from "@/app/components/recipe/RecipeMetadata";
import RecipeContent from "@/app/components/recipe/RecipeContent";
import NotesSection from "@/app/components/recipe/NotesSection";
import {
  findIngredientAssociations,
  clearIngredientAssociations,
} from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import { type IngredientAssociation } from "@/lib/utils/ingredient-matching";
import { saveAssociations } from "@/app/lib/server/db";
import { hashRecipe } from "@/lib/utils/recipe-hashing";

interface RecipePageContentProps {
  recipe: components["schemas"]["Recipe-Output"];
  initialAssociationStatus?: "valid" | "outdated" | "none";
}

export default function RecipePageContent({
  recipe,
  initialAssociationStatus = "none",
}: RecipePageContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [associationStatus, setAssociationStatus] = useState<
    "valid" | "outdated" | "none"
  >(initialAssociationStatus);
  const [currentAssociations, setCurrentAssociations] = useState<
    IngredientAssociation[]
  >([]);
  const { toast } = useToast();

  // Load initial associations when the component mounts
  useEffect(() => {
    const loadInitialAssociations = async () => {
      if (!recipe.id) return;

      try {
        const result = await findIngredientAssociations(
          recipe.id,
          recipe.recipeIngredient || [],
          recipe.recipeInstructions || [],
          false // Don't force regenerate
        );
        setAssociationStatus(result.status);
        setCurrentAssociations(result.associations);
      } catch (error) {
        console.error("Error loading initial associations:", error);
        setAssociationStatus("none");
      }
    };

    loadInitialAssociations();
  }, [recipe.id, recipe.recipeIngredient, recipe.recipeInstructions]);

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
      setCurrentAssociations(result.associations);
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

  const handleClearAssociations = async () => {
    if (!recipe.id) return;

    setIsLoading(true);
    try {
      await clearIngredientAssociations(recipe.id);
      setAssociationStatus("none");
      setCurrentAssociations([]);
      toast({
        title: "Success",
        description: "Successfully cleared ingredient associations",
      });
    } catch (error) {
      console.error("Error clearing associations:", error);
      toast({
        title: "Error",
        description: "Failed to clear ingredient associations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAssociations = async (
    associations: IngredientAssociation[]
  ) => {
    if (!recipe.id) return;

    setIsLoading(true);
    try {
      // Save the associations to the database
      await saveAssociations(
        recipe.id,
        hashRecipe(
          recipe.recipeIngredient || [],
          recipe.recipeInstructions || []
        ),
        associations.map((assoc) => ({
          ingredient: assoc.ingredient,
          text: assoc.text,
          step: assoc.step,
          amount: assoc.amount || null,
        }))
      );

      setCurrentAssociations(associations);
      toast({
        title: "Success",
        description: "Successfully saved ingredient associations",
      });
    } catch (error) {
      console.error("Error saving associations:", error);
      toast({
        title: "Error",
        description: "Failed to save ingredient associations",
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
          onClearAssociations={handleClearAssociations}
          onSaveAssociations={handleSaveAssociations}
          currentAssociations={currentAssociations}
        />

        {/* Recipe Content */}
        <div className="mt-8">
          <RecipeContent
            recipeId={recipe.id || ""}
            instructions={recipe.recipeInstructions || []}
            ingredients={recipe.recipeIngredient || []}
            associationStatus={associationStatus}
            setAssociationStatus={setAssociationStatus}
            currentAssociations={currentAssociations}
            setCurrentAssociations={setCurrentAssociations}
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
