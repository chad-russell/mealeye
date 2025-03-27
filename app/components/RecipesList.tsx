import Link from "next/link";
import Image from "next/image";
import { RecipeSummary } from "@/lib/types/api";
import { recipeImageUrl } from "@/lib/utils/url";

interface RecipesListProps {
  recipes: RecipeSummary[];
  className?: string;
}

export default function RecipesList({
  recipes,
  className = "",
}: RecipesListProps) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No recipes found.</div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      {recipes.map((recipe) => (
        <Link
          key={recipe.id}
          href={`/recipes/${recipe.slug}`}
          className="block bg-white rounded-lg border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow"
        >
          {recipe.id && (
            <div className="w-full h-48 relative">
              <Image
                src={recipeImageUrl(recipe.id)}
                alt={recipe.name || "Recipe"}
                fill
                className="object-cover"
              />
            </div>
          )}
          <div className="p-4">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">
              {recipe.name || "Untitled Recipe"}
            </h2>
            <div className="flex items-center gap-4 text-gray-600 text-sm">
              {recipe.totalTime && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">{recipe.totalTime}</span>
                </div>
              )}
              {recipe.recipeServings && (
                <div className="flex items-center gap-1">
                  <span className="text-sm">
                    {recipe.recipeServings} servings
                  </span>
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
