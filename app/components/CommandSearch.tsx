"use client";

import { useState, useEffect } from "react";
import { Command } from "cmdk";
import { Search, Timer, Users } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { searchRecipes } from "@/app/lib/server/recipe-actions";
import { type RecipeSummary } from "@/lib/types/api";
import { useRouter } from "next/navigation";

export function CommandSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // Toggle the menu when ⌘K is pressed
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search for recipes when query changes
  useEffect(() => {
    const searchForRecipes = async () => {
      if (!query.trim()) {
        setRecipes([]);
        return;
      }

      setIsLoading(true);
      try {
        const results = await searchRecipes(query);
        setRecipes(results);
      } catch (error) {
        console.error("Failed to search recipes:", error);
        setRecipes([]);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(searchForRecipes, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (recipeSlug: string) => {
    router.push(`/recipes/${recipeSlug}`);
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="group mx-auto flex items-center gap-2 rounded-lg border bg-background px-4 py-2 text-sm text-muted-foreground shadow-sm transition-colors hover:bg-accent"
      >
        <Search className="h-4 w-4" />
        <span>Search recipes...</span>
        <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0">
          <DialogTitle className="sr-only">Search Recipes</DialogTitle>
          <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
            <div
              className="flex items-center border-b px-3"
              cmdk-input-wrapper=""
            >
              <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                placeholder="Search recipes..."
                className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
            <Command.List>
              <Command.Empty>No recipes found.</Command.Empty>
              {recipes.map((recipe) => (
                <Command.Item
                  key={recipe.id}
                  value={recipe.slug}
                  onSelect={handleSelect}
                  className="flex flex-col gap-1 px-4 py-3 cursor-pointer hover:bg-accent hover:text-accent-foreground [&_svg]:hover:text-accent-foreground [&_span]:hover:text-accent-foreground transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-medium flex-1 mr-8">
                      {recipe.name}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground shrink-0">
                      {recipe.totalTime && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4" />
                          <span>{recipe.totalTime}</span>
                        </div>
                      )}
                      {recipe.recipeServings && (
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{recipe.recipeServings}</span>
                          <span className="text-muted-foreground/50">
                            servings
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  {recipe.description && (
                    <div className="text-sm text-muted-foreground/75 line-clamp-1">
                      {recipe.description}
                    </div>
                  )}
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
