import { Clock, Users, ChefHat, UtensilsCrossed } from "lucide-react";
import { components } from "@/lib/types/openapi-generated";

type Recipe = components["schemas"]["Recipe-Output"];

interface RecipeMetadataProps {
  recipe: Recipe;
}

export default function RecipeMetadata({ recipe }: RecipeMetadataProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex flex-wrap gap-6 text-gray-600">
        {recipe.totalTime && (
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <span>{recipe.totalTime}</span>
          </div>
        )}
        {recipe.recipeServings && (
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            <span>{recipe.recipeServings} servings</span>
          </div>
        )}
        {recipe.recipeCategory && recipe.recipeCategory.length > 0 && (
          <div className="flex items-center gap-2">
            <ChefHat className="w-5 h-5" />
            <span>{recipe.recipeCategory.join(", ")}</span>
          </div>
        )}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5" />
            <span>{recipe.tags.join(", ")}</span>
          </div>
        )}
      </div>
      {recipe.description && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-gray-600">{recipe.description}</p>
        </div>
      )}
    </div>
  );
}
