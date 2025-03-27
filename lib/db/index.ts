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
  const db = await getDb();
  const result = await db
    .select()
    .from(schema.recipeAssociationsConfig.table)
    .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId))
    .limit(1);

  if (!result || result.length === 0) {
    return null;
  }

  const association = result[0];
  if (association.recipeHash !== recipeHash) {
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

  return {
    status: "valid" as const,
    associations: ingredientAssociations,
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
  const db = await getDb();
  await db.transaction(async (tx) => {
    // Delete existing associations
    await tx
      .delete(schema.recipeAssociationsConfig.table)
      .where(eq(schema.recipeAssociationsConfig.columns.recipeId, recipeId));

    // Insert new recipe association
    const [newAssociation] = await tx
      .insert(schema.recipeAssociationsConfig.table)
      .values({
        recipeId,
        recipeHash,
      })
      .returning();

    // Delete existing ingredient associations
    await tx
      .delete(schema.ingredientAssociationsConfig.table)
      .where(
        eq(
          schema.ingredientAssociationsConfig.columns.recipeAssociationId,
          newAssociation.id
        )
      );

    // Insert new ingredient associations
    if (associations.length > 0) {
      await tx.insert(schema.ingredientAssociationsConfig.table).values(
        associations.map((assoc) => ({
          ...assoc,
          recipeAssociationId: newAssociation.id,
        }))
      );
    }
  });
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
