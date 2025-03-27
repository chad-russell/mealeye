"use server";

import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { join } from "path";
import { mkdir } from "fs/promises";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

const DB_PATH = join(process.cwd(), "data", "recipes.db");

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export async function getDb() {
  if (!db) {
    await mkdir(join(process.cwd(), "data"), { recursive: true });
    const sqlite = new Database(DB_PATH);
    db = drizzle(sqlite, { schema });
  }
  return db;
}

export async function getAssociations(recipeId: string, recipeHash: string) {
  console.log("[getAssociations] Fetching associations for:", {
    recipeId,
    recipeHash,
  });
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.recipeAssociationsConfig.table)
    .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId))
    .limit(1);

  console.log("[getAssociations] Found recipe association:", result);

  if (!result || result.length === 0) {
    console.log("[getAssociations] No recipe association found");
    return null;
  }

  const association = result[0];
  if (association.recipeHash !== recipeHash) {
    console.log("[getAssociations] Recipe hash mismatch:", {
      stored: association.recipeHash,
      current: recipeHash,
    });
    return { status: "outdated" as const, associations: [] };
  }

  const ingredientAssociations = await db
    .select()
    .from(schema.ingredientAssociationsConfig.table)
    .where(
      eq(
        schema.ingredientAssociationsConfig.columns.recipeAssociationId,
        association.id
      )
    );

  console.log(
    "[getAssociations] Found ingredient associations:",
    ingredientAssociations
  );

  // Transform the associations to match the UI format
  const formattedAssociations = ingredientAssociations.map((assoc) => ({
    ingredient: assoc.ingredient,
    text: assoc.text,
    step: assoc.step,
    amount: assoc.amount || undefined, // Convert null to undefined
  }));

  return {
    status: "valid" as const,
    associations: formattedAssociations,
  };
}

export async function saveAssociations(
  recipeId: string,
  recipeHash: string,
  associations: Omit<
    typeof schema.ingredientAssociationsConfig.table.$inferInsert,
    "recipeAssociationId" | "createdAt" | "updatedAt"
  >[]
) {
  console.log("[saveAssociations] Saving associations:", {
    recipeId,
    recipeHash,
    associations,
  });

  const db = await getDb();
  await db.transaction(async (tx) => {
    // First, delete existing ingredient associations for this recipe
    const existingRecipeAssoc = await tx
      .select()
      .from(schema.recipeAssociationsConfig.table)
      .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId))
      .limit(1);

    console.log(
      "[saveAssociations] Found existing recipe association:",
      existingRecipeAssoc
    );

    if (existingRecipeAssoc.length > 0) {
      // Delete ingredient associations first (due to foreign key constraint)
      await tx
        .delete(schema.ingredientAssociationsConfig.table)
        .where(
          eq(
            schema.ingredientAssociationsConfig.columns.recipeAssociationId,
            existingRecipeAssoc[0].id
          )
        );

      // Then delete the recipe association
      await tx
        .delete(schema.recipeAssociationsConfig.table)
        .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId));

      console.log("[saveAssociations] Deleted existing associations");
    }

    // Insert new recipe association
    const [newAssociation] = await tx
      .insert(schema.recipeAssociationsConfig.table)
      .values({
        recipeId,
        recipeHash,
      })
      .returning();

    console.log(
      "[saveAssociations] Created new recipe association:",
      newAssociation
    );

    if (!newAssociation?.id) {
      throw new Error("Failed to create recipe association");
    }

    // Insert new ingredient associations
    if (associations.length > 0) {
      const insertedAssociations = await tx
        .insert(schema.ingredientAssociationsConfig.table)
        .values(
          associations.map((assoc) => ({
            ...assoc,
            recipeAssociationId: newAssociation.id,
          }))
        )
        .returning();
      console.log(
        "[saveAssociations] Inserted ingredient associations:",
        insertedAssociations
      );
    }
  });

  console.log("[saveAssociations] Transaction completed successfully");
}

export async function clearAssociations(recipeId: string) {
  const db = await getDb();
  await db.transaction(async (tx) => {
    // First, get the recipe association ID
    const recipeAssociation = await tx
      .select()
      .from(schema.recipeAssociationsConfig.table)
      .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId))
      .limit(1);

    if (recipeAssociation.length > 0) {
      // Delete ingredient associations first
      await tx
        .delete(schema.ingredientAssociationsConfig.table)
        .where(
          eq(
            schema.ingredientAssociationsConfig.columns.recipeAssociationId,
            recipeAssociation[0].id
          )
        );

      // Then delete the recipe association
      await tx
        .delete(schema.recipeAssociationsConfig.table)
        .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId));
    }
  });
}
