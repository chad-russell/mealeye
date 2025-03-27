import { sql } from "drizzle-orm";
import { text, integer, sqliteTable } from "drizzle-orm/sqlite-core";

// Define the tables for recipe and ingredient associations
export const recipeAssociations = sqliteTable("recipe_associations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeId: text("recipe_id").notNull(),
  recipeHash: text("recipe_hash").notNull(),
  description: text("description"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const ingredientAssociations = sqliteTable("ingredient_associations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  recipeAssociationId: integer("recipe_association_id")
    .notNull()
    .references(() => recipeAssociations.id),
  ingredient: text("ingredient").notNull(),
  amount: text("amount"),
  step: integer("step").notNull(),
  text: text("text").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

// Create indexes
export const recipeAssociationsRecipeIdIdx = sql`
  CREATE INDEX IF NOT EXISTS recipe_associations_recipe_id_idx ON recipe_associations(recipe_id)
`;

export const ingredientAssociationsRecipeAssociationIdIdx = sql`
  CREATE INDEX IF NOT EXISTS ingredient_associations_recipe_association_id_idx ON ingredient_associations(recipe_association_id)
`;

// Types
export type RecipeAssociation = typeof recipeAssociations.$inferSelect;
export type NewRecipeAssociation = typeof recipeAssociations.$inferInsert;
export type IngredientAssociation = typeof ingredientAssociations.$inferSelect;
export type NewIngredientAssociation =
  typeof ingredientAssociations.$inferInsert;

// Export the table configs for use in queries
export const recipeAssociationsConfig = {
  table: recipeAssociations,
  columns: recipeAssociations,
  name: "recipe_associations",
} as const;

export const ingredientAssociationsConfig = {
  table: ingredientAssociations,
  columns: ingredientAssociations,
  name: "ingredient_associations",
} as const;
