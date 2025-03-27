"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Clock, Users } from "lucide-react";
import { RecipeSummary } from "@/lib/types/recipe";
import { recipeImageUrl } from "@/lib/utils/url";

interface RecipeCardProps {
  recipe: RecipeSummary;
  index: number;
}

function RecipeCard({ recipe, index }: RecipeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="group relative overflow-hidden rounded-xl bg-white shadow-md transition-all hover:shadow-xl"
    >
      <Link href={`/recipes/${recipe.slug}`} className="block">
        {recipe.id && (
          <div className="relative aspect-[4/3] overflow-hidden">
            <Image
              src={recipeImageUrl(recipe.id)}
              alt={recipe.name || "Recipe"}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <div className="p-4">
          <h2 className="line-clamp-1 text-lg font-semibold text-gray-800">
            {recipe.name}
          </h2>
          {(recipe.totalTime || recipe.recipeServings) && (
            <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
              {recipe.totalTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>{recipe.totalTime}</span>
                </div>
              )}
              {recipe.recipeServings && (
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{recipe.recipeServings} servings</span>
                </div>
              )}
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

interface RecipeGridProps {
  recipes: RecipeSummary[];
}

export default function RecipeGrid({ recipes }: RecipeGridProps) {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe, index) => (
        <RecipeCard key={recipe.id} recipe={recipe} index={index} />
      ))}
    </div>
  );
}
