import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles for authentication
export type UserRole = "admin" | "campo" | "transporte" | "algodoeira";

// Bale status flow: campo -> patio -> beneficiado
export type BaleStatus = "campo" | "patio" | "beneficiado";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().$type<UserRole>(),
});

// Bales table (SEM campos de GPS)
export const bales = pgTable("bales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  qrCode: text("qr_code").notNull().unique(),
  safra: text("safra"),
  talhao: text("talhao").notNull(),
  numero: text("numero").notNull(), // Formato: 00001, 00002, etc
  status: text("status").notNull().$type<BaleStatus>().default("campo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Timestamps de cada fase (sem GPS)
  campoTimestamp: timestamp("campo_timestamp"),
  campoUserId: varchar("campo_user_id"),
  
  patioTimestamp: timestamp("patio_timestamp"),
  patioUserId: varchar("patio_user_id"),
  
  beneficiadoTimestamp: timestamp("beneficiado_timestamp"),
  beneficiadoUserId: varchar("beneficiado_user_id"),
});

// Contador de numeração por safra + talhão
export const talhaoCounters = pgTable("talhao_counters", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  safra: text("safra").notNull(),
  talhao: text("talhao").notNull(),
  lastNumber: integer("last_number").notNull().default(0),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Settings table (global configuration)
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Talhões table (field information)
export const talhoesInfo = pgTable("talhoes_info", {
  id: varchar("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  hectares: text("hectares").notNull(), // Armazenado como texto para preservar decimais
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Schema para criação em lote de fardos
export const batchCreateBalesSchema = z.object({
  safra: z.string().min(1, "Safra é obrigatória"),
  talhao: z.string().min(1, "Talhão é obrigatório"),
  quantidade: z.number().min(1, "Quantidade deve ser maior que 0").max(1000, "Máximo 1000 fardos por vez"),
});

// Schema para criação de fardo individual (usado internamente)
export const createBaleSchema = z.object({
  id: z.string(),
  qrCode: z.string(),
  safra: z.string().optional(),
  talhao: z.string().min(1, "Talhão é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
});

export const insertBaleSchema = createInsertSchema(bales).pick({
  qrCode: true,
  safra: true,
  talhao: true,
  numero: true,
});

export const updateBaleStatusSchema = z.object({
  status: z.enum(["patio", "beneficiado"]),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type BatchCreateBales = z.infer<typeof batchCreateBalesSchema>;
export type CreateBale = z.infer<typeof createBaleSchema>;
export type InsertBale = z.infer<typeof insertBaleSchema>;
export type Bale = typeof bales.$inferSelect;
export type TalhaoCounter = typeof talhaoCounters.$inferSelect;

export type UpdateBaleStatus = z.infer<typeof updateBaleStatusSchema>;

// Login schema
export const loginSchema = z.object({
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Settings schemas
export const insertSettingSchema = createInsertSchema(settings).pick({
  key: true,
  value: true,
});

export const updateDefaultSafraSchema = z.object({
  value: z.string().min(1, "Safra é obrigatória"),
});

export type InsertSetting = z.infer<typeof insertSettingSchema>;
export type Setting = typeof settings.$inferSelect;
export type UpdateDefaultSafra = z.infer<typeof updateDefaultSafraSchema>;
// Talh�o info type
export type TalhaoInfo = typeof talhoesInfo.$inferSelect;
