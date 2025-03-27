import type { Config } from "drizzle-kit";

export default {
  schema: "./app/lib/server/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "data/recipes.db",
  },
} satisfies Config;
