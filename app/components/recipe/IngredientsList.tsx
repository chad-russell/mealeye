import { components } from "@/app/lib/types/openapi-generated";

type RecipeIngredient = components["schemas"]["RecipeIngredient-Output"];

interface IngredientsListProps {
  ingredients: RecipeIngredient[];
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  return (
    <div className="sticky top-8 h-[calc(100vh-4rem)] overflow-hidden bg-white rounded-lg shadow-sm">
      <div className="h-full overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Ingredients
          </h2>
          <ul className="space-y-3">
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.referenceId}
                className="flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="text-gray-600">
                  {ingredient.quantity &&
                  !ingredient.disableAmount &&
                  ingredient.unit ? (
                    <>
                      <span className="font-medium">{ingredient.quantity}</span>
                      <span className="text-gray-500 italic ml-1">
                        {ingredient.unit?.name || ""}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {ingredient.display || ingredient.note}
                    </span>
                  )}
                </div>
              </li>
            ))}
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.referenceId}
                className="flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="text-gray-600">
                  {ingredient.quantity &&
                  !ingredient.disableAmount &&
                  ingredient.unit ? (
                    <>
                      <span className="font-medium">{ingredient.quantity}</span>
                      <span className="text-gray-500 italic ml-1">
                        {ingredient.unit?.name || ""}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {ingredient.display || ingredient.note}
                    </span>
                  )}
                </div>
              </li>
            ))}
            {ingredients.map((ingredient) => (
              <li
                key={ingredient.referenceId}
                className="flex items-start gap-2"
              >
                <div className="w-1.5 h-1.5 mt-2 rounded-full bg-gray-300 flex-shrink-0" />
                <div className="text-gray-600">
                  {ingredient.quantity &&
                  !ingredient.disableAmount &&
                  ingredient.unit ? (
                    <>
                      <span className="font-medium">{ingredient.quantity}</span>
                      <span className="text-gray-500 italic ml-1">
                        {ingredient.unit?.name || ""}
                      </span>
                    </>
                  ) : (
                    <span className="font-medium">
                      {ingredient.display || ingredient.note}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
