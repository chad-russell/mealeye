import { Clock, Users, ChefHat, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { client } from "@/app/lib/server/api";
import { recipeImageUrl } from "@/app/lib/utils/url";
import { components } from "@/app/lib/types/openapi-generated";
import HeroImage from "@/app/components/recipe/HeroImage";
import RecipeMetadata from "@/app/components/recipe/RecipeMetadata";
import IngredientsList from "@/app/components/recipe/IngredientsList";
import InstructionsSection from "@/app/components/recipe/InstructionsSection";
import NotesSection from "@/app/components/recipe/NotesSection";

type RecipeNote = components["schemas"]["RecipeNote"];
type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"];

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const recipeResponse = await client.GET("/api/recipes/{slug}", {
    params: {
      path: {
        slug,
      },
    },
  });

  // Handle recipe not found
  if (!recipeResponse.data) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Recipe Not Found
          </h1>
          <p className="text-gray-500">
            The recipe you&apos;re looking for doesn&apos;t exist or was
            removed.
          </p>
        </div>
      </div>
    );
  }

  const recipe = recipeResponse.data;

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
        <RecipeMetadata recipe={recipe} />

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Ingredients */}
          <div className="lg:col-span-1">
            <IngredientsList ingredients={recipe.recipeIngredient || []} />
          </div>

          {/* Right Column - Instructions and Notes */}
          <div className="lg:col-span-2 space-y-8">
            {recipe.recipeInstructions && (
              <InstructionsSection instructions={recipe.recipeInstructions} />
            )}
            {recipe.notes && recipe.notes.length > 0 && (
              <NotesSection notes={recipe.notes} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
