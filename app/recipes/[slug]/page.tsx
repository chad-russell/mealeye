import RecipePageContent from "@/app/recipes/[slug]/RecipePageContent";
import { getRecipe, findIngredientAssociations } from "@/app/actions";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const recipe = await getRecipe(slug);

  // Handle recipe not found
  if (!recipe) {
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

  // Get initial associations status
  const initialAssociations = await findIngredientAssociations(
    recipe.id || "",
    recipe.recipeIngredient || [],
    recipe.recipeInstructions || []
  );

  return (
    <RecipePageContent
      recipe={recipe}
      initialAssociationStatus={initialAssociations.status}
    />
  );
}
