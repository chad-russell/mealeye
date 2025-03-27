import { CommandSearch } from "./components/CommandSearch";
import RecipeGrid from "./components/RecipeGrid";
import { getRecipes } from "./lib/server/recipe-actions";

export default async function Home() {
  const recipes = await getRecipes();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 space-y-4">
          <h1 className="text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Recipes
          </h1>
          <p className="text-center text-lg text-gray-600">
            Discover and organize your favorite recipes
          </p>
          <div className="flex justify-center">
            <CommandSearch />
          </div>
        </div>

        <RecipeGrid recipes={recipes} />
      </div>
    </main>
  );
}
