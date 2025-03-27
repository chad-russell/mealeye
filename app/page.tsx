import RecipesList from "./components/RecipesList";
import { client } from "@/lib/server/api";

export default async function Home() {
  const recipes = await client.GET("/api/recipes", {
    query: {
      page: 1,
      per_page: 20,
    },
  });

  return (
    <div className="min-h-screen bg-[#fafafa] p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-700">Recipes</h1>
        <RecipesList recipes={recipes.data?.items || []} />
      </div>
    </div>
  );
}
