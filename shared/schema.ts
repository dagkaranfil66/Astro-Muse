import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, bigint } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  verified: boolean("verified").notNull().default(false),
  verifyToken: text("verify_token").notNull().default(""),
  resetCode: text("reset_code"),
  resetCodeExpiry: bigint("reset_code_expiry", { mode: "number" }),
  provider: text("provider").notNull().default("email"),
  providerId: text("provider_id"),
  createdAt: text("created_at").notNull().default(sql`now()`),
});

export const insertUserSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  passwordHash: true,
  verifyToken: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
