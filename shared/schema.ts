import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp } from "drizzle-orm/pg-core";
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

// Bales table
export const bales = pgTable("bales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  qrCode: text("qr_code").notNull().unique(),
  safra: text("safra"), // Safra (harvest season) - e.g., "2024/2025"
  talhao: text("talhao"),
  numero: text("numero"),
  status: text("status").notNull().$type<BaleStatus>().default("campo"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // Current location (last update)
  latitude: text("latitude"),
  longitude: text("longitude"),
  
  // Campo phase
  campoLatitude: text("campo_latitude"),
  campoLongitude: text("campo_longitude"),
  campoTimestamp: timestamp("campo_timestamp"),
  campoUserId: varchar("campo_user_id"),
  
  // Patio phase
  patioLatitude: text("patio_latitude"),
  patioLongitude: text("patio_longitude"),
  patioTimestamp: timestamp("patio_timestamp"),
  patioUserId: varchar("patio_user_id"),
  
  // Beneficiado phase
  beneficiadoLatitude: text("beneficiado_latitude"),
  beneficiadoLongitude: text("beneficiado_longitude"),
  beneficiadoTimestamp: timestamp("beneficiado_timestamp"),
  beneficiadoUserId: varchar("beneficiado_user_id"),
});

// Settings table (global configuration)
export const settings = pgTable("settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(), // e.g., "default_safra"
  value: text("value").notNull(), // JSON or plain text value
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Insert schemas with validation
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
});

// Schema for initial bale creation (label generation - only QR code) - LEGACY
export const initBaleSchema = z.object({
  id: z.string(),
  qrCode: z.string(),
});

// Schema for completing bale registration (campo phase) - LEGACY
export const completeBaleSchema = z.object({
  talhao: z.string().min(1, "Talhão é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

// Schema for creating complete bale (NEW - campo phase with all data)
export const createBaleSchema = z.object({
  id: z.string(),
  qrCode: z.string(),
  safra: z.string().optional(),
  talhao: z.string().min(1, "Talhão é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const insertBaleSchema = createInsertSchema(bales).pick({
  qrCode: true,
  safra: true,
  talhao: true,
  numero: true,
}).extend({
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

export const updateBaleStatusSchema = z.object({
  status: z.enum(["patio", "beneficiado"]),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InitBale = z.infer<typeof initBaleSchema>;
export type CompleteBale = z.infer<typeof completeBaleSchema>;
export type CreateBale = z.infer<typeof createBaleSchema>;
export type InsertBale = z.infer<typeof insertBaleSchema>;
export type Bale = typeof bales.$inferSelect;

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
