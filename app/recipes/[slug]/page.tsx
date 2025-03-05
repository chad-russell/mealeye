import { Clock, Users, ChefHat, UtensilsCrossed } from "lucide-react";
import Image from "next/image";
import { client } from "@/app/lib/server/api";
import { recipeImageUrl } from "@/app/lib/utils/url";

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
      {/* Hero Image Section */}
      <div className="relative h-[35vh] w-full">
        {recipe.id && (
          <Image
            src={recipeImageUrl(recipe.id)}
            alt={recipe.name || "Recipe"}
            fill
            className="object-cover"
            priority
          />
        )}
      </div>

      {/* Recipe Content */}
      <div className="max-w-4xl mx-auto px-4 py-8 bg-white -mt-8 rounded-t-3xl shadow-sm">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          {recipe.name || "Untitled Recipe"}
        </h1>

        {/* Recipe Meta Info */}
        <div className="flex flex-wrap gap-6 mb-8 text-gray-600">
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

        {/* Description */}
        {recipe.description && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-2 text-gray-700">
              Description
            </h2>
            <p className="text-gray-600">{recipe.description}</p>
          </div>
        )}

        {/* Ingredients Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Ingredients
          </h2>
          <ul className="space-y-2">
            {recipe.recipeIngredient &&
              recipe.recipeIngredient.map((ingredient) => (
                <li
                  key={ingredient.referenceId}
                  className="flex items-start text-gray-600"
                >
                  <span className="block w-20 font-medium text-gray-900">
                    {ingredient.quantity && !ingredient.disableAmount
                      ? `${ingredient.quantity} ${ingredient.unit?.name || ""}`
                      : ""}
                  </span>
                  <span>
                    {ingredient.food?.name ||
                      ingredient.title ||
                      ingredient.display ||
                      ""}
                    {ingredient.note && (
                      <span className="text-gray-500 italic">
                        {" "}
                        ({ingredient.note})
                      </span>
                    )}
                  </span>
                </li>
              ))}
          </ul>
        </div>

        {/* Instructions Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-700">
            Instructions
          </h2>
          <ol className="space-y-4 list-decimal list-inside">
            {recipe.recipeInstructions &&
              recipe.recipeInstructions.map((instruction, index) => (
                <li key={index} className="text-gray-600 pl-2">
                  {instruction.title && (
                    <h3 className="font-medium text-gray-800 inline">
                      {instruction.title}:{" "}
                    </h3>
                  )}
                  {instruction.text}
                </li>
              ))}
          </ol>
        </div>

        {/* Notes Section */}
        {recipe.notes && recipe.notes.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-700">Notes</h2>
            <ul className="space-y-2">
              {recipe.notes.map((note, index) => (
                <li
                  key={index}
                  className="bg-yellow-50 p-4 rounded-lg border border-yellow-100"
                >
                  {note.title && (
                    <h3 className="font-medium mb-1">{note.title}</h3>
                  )}
                  <p className="text-gray-600">{note.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
