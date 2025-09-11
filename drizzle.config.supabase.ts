import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./shared/schema.ts",
  out: "./migrations-supabase",
  dbCredentials: {
    url: process.env.SUPABASE_DATABASE_URL!,
  },
});