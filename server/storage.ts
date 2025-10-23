import {
  type User,
  type InsertUser,
  type Bale,
  type InsertBale,
  type BaleStatus,
  type UpdateBaleStatus,
  type UserRole,
  type InitBale,
  type CompleteBale,
  type CreateBale,
  type Setting,
  type InsertSetting,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { users as usersTable, bales as balesTable, settings as settingsTable } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bale methods
  getAllBales(): Promise<Bale[]>;
  getBale(id: string): Promise<Bale | undefined>;
  getBaleByQRCode(qrCode: string): Promise<Bale | undefined>;
  initBale(data: InitBale): Promise<Bale>;
  completeBale(qrCode: string, data: CompleteBale, userId: string): Promise<Bale>;
  createCompleteBale(data: CreateBale, userId: string): Promise<Bale>;
  createBale(bale: InsertBale, userId: string): Promise<Bale>;
  updateBaleStatus(
    id: string,
    status: BaleStatus,
    latitude: string | undefined,
    longitude: string | undefined,
    userId: string
  ): Promise<Bale>;
  getBaleStats(): Promise<{
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }>;
  getBaleStatsByTalhao(): Promise<{
    talhao: string;
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }[]>;
  deleteAllBales(): Promise<{ deletedCount: number }>;

  // Settings methods
  getSetting(key: string): Promise<Setting | undefined>;
  updateSetting(key: string, value: string): Promise<Setting>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private bales: Map<string, Bale>;
  private settings: Map<string, Setting>;

  constructor() {
    this.users = new Map();
    this.bales = new Map();
    this.settings = new Map();
    
    // Create default users for MVP
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const defaultUsers = [
      { username: "admin", password: "admin123", role: "admin" as const },
      { username: "campo", password: "campo123", role: "campo" as const },
      { username: "transporte", password: "trans123", role: "transporte" as const },
      { username: "algodoeira", password: "algo123", role: "algodoeira" as const },
    ];

    for (const user of defaultUsers) {
      await this.createUser(user);
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      id, 
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role as UserRole,
    };
    this.users.set(id, user);
    return user;
  }

  // Bale methods
  async getAllBales(): Promise<Bale[]> {
    return Array.from(this.bales.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  async getBale(id: string): Promise<Bale | undefined> {
    return this.bales.get(id);
  }

  async getBaleByQRCode(qrCode: string): Promise<Bale | undefined> {
    return Array.from(this.bales.values()).find(
      (bale) => bale.qrCode === qrCode
    );
  }

  async initBale(data: InitBale): Promise<Bale> {
    const now = new Date();

    const bale: Bale = {
      id: data.id,
      qrCode: data.qrCode,
      safra: null,
      talhao: null,
      numero: null,
      status: "campo",
      createdAt: now,
      updatedAt: now,
      latitude: null,
      longitude: null,
      campoLatitude: null,
      campoLongitude: null,
      campoTimestamp: null,
      campoUserId: null,
      patioLatitude: null,
      patioLongitude: null,
      patioTimestamp: null,
      patioUserId: null,
      beneficiadoLatitude: null,
      beneficiadoLongitude: null,
      beneficiadoTimestamp: null,
      beneficiadoUserId: null,
    };

    this.bales.set(data.id, bale);
    return bale;
  }

  async completeBale(qrCode: string, data: CompleteBale, userId: string): Promise<Bale> {
    const bale = await this.getBaleByQRCode(qrCode);
    if (!bale) {
      throw new Error("Fardo não encontrado");
    }

    const now = new Date();
    
    bale.talhao = data.talhao;
    bale.numero = data.numero;
    bale.latitude = data.latitude || null;
    bale.longitude = data.longitude || null;
    bale.campoLatitude = data.latitude || null;
    bale.campoLongitude = data.longitude || null;
    bale.campoTimestamp = now;
    bale.campoUserId = userId;
    bale.updatedAt = now;

    this.bales.set(bale.id, bale);
    return bale;
  }

  async createCompleteBale(data: CreateBale, userId: string): Promise<Bale> {
    const now = new Date();

    const bale: Bale = {
      id: data.id,
      qrCode: data.qrCode,
      safra: data.safra || null,
      talhao: data.talhao,
      numero: data.numero,
      status: "campo",
      createdAt: now,
      updatedAt: now,

      // Current location
      latitude: data.latitude || null,
      longitude: data.longitude || null,

      // Campo phase
      campoLatitude: data.latitude || null,
      campoLongitude: data.longitude || null,
      campoTimestamp: now,
      campoUserId: userId,

      // Patio phase (not yet)
      patioLatitude: null,
      patioLongitude: null,
      patioTimestamp: null,
      patioUserId: null,

      // Beneficiado phase (not yet)
      beneficiadoLatitude: null,
      beneficiadoLongitude: null,
      beneficiadoTimestamp: null,
      beneficiadoUserId: null,
    };

    this.bales.set(data.id, bale);
    return bale;
  }

  async createBale(insertBale: InsertBale, userId: string): Promise<Bale> {
    const id = randomUUID();
    const now = new Date();

    const bale: Bale = {
      id,
      qrCode: insertBale.qrCode,
      safra: insertBale.safra || null,
      talhao: insertBale.talhao || null,
      numero: insertBale.numero || null,
      status: "campo",
      createdAt: now,
      updatedAt: now,

      // Current location
      latitude: insertBale.latitude || null,
      longitude: insertBale.longitude || null,

      // Campo phase
      campoLatitude: insertBale.latitude || null,
      campoLongitude: insertBale.longitude || null,
      campoTimestamp: now,
      campoUserId: userId,

      // Patio phase (not yet)
      patioLatitude: null,
      patioLongitude: null,
      patioTimestamp: null,
      patioUserId: null,

      // Beneficiado phase (not yet)
      beneficiadoLatitude: null,
      beneficiadoLongitude: null,
      beneficiadoTimestamp: null,
      beneficiadoUserId: null,
    };

    this.bales.set(id, bale);
    return bale;
  }

  async updateBaleStatus(
    id: string,
    newStatus: BaleStatus,
    latitude: string | undefined,
    longitude: string | undefined,
    userId: string
  ): Promise<Bale> {
    const bale = this.bales.get(id);
    if (!bale) {
      throw new Error("Fardo não encontrado");
    }

    // Validate status transition
    if (newStatus === "patio" && bale.status !== "campo") {
      throw new Error(
        "Apenas fardos no campo podem ser movidos para o pátio"
      );
    }

    if (newStatus === "beneficiado" && bale.status !== "patio") {
      throw new Error(
        "Apenas fardos no pátio podem ser beneficiados"
      );
    }

    const now = new Date();

    // Update based on new status
    if (newStatus === "patio") {
      bale.status = "patio";
      bale.patioLatitude = latitude || null;
      bale.patioLongitude = longitude || null;
      bale.patioTimestamp = now;
      bale.patioUserId = userId;
    } else if (newStatus === "beneficiado") {
      bale.status = "beneficiado";
      bale.beneficiadoLatitude = latitude || null;
      bale.beneficiadoLongitude = longitude || null;
      bale.beneficiadoTimestamp = now;
      bale.beneficiadoUserId = userId;
    }

    // Update current location
    bale.latitude = latitude || null;
    bale.longitude = longitude || null;
    bale.updatedAt = now;

    this.bales.set(id, bale);
    return bale;
  }

  async getBaleStats(): Promise<{
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }> {
    const allBales = Array.from(this.bales.values());

    return {
      campo: allBales.filter((b) => b.status === "campo").length,
      patio: allBales.filter((b) => b.status === "patio").length,
      beneficiado: allBales.filter((b) => b.status === "beneficiado").length,
      total: allBales.length,
    };
  }

  async getBaleStatsByTalhao(): Promise<{
    talhao: string;
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }[]> {
    const allBales = Array.from(this.bales.values());
    
    // Group bales by talhao
    const talhaoMap = new Map<string, Bale[]>();
    
    for (const bale of allBales) {
      if (bale.talhao) {
        const existing = talhaoMap.get(bale.talhao) || [];
        talhaoMap.set(bale.talhao, [...existing, bale]);
      }
    }
    
    // Calculate stats for each talhao
    const stats = Array.from(talhaoMap.entries()).map(([talhao, bales]) => ({
      talhao,
      campo: bales.filter(b => b.status === "campo").length,
      patio: bales.filter(b => b.status === "patio").length,
      beneficiado: bales.filter(b => b.status === "beneficiado").length,
      total: bales.length,
    }));
    
    // Sort by talhao name
    return stats.sort((a, b) => a.talhao.localeCompare(b.talhao));
  }

  async deleteAllBales(): Promise<{ deletedCount: number }> {
    const count = this.bales.size;
    this.bales.clear();
    return { deletedCount: count };
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    return this.settings.get(key);
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    const now = new Date();
    const existing = this.settings.get(key);
    
    if (existing) {
      existing.value = value;
      existing.updatedAt = now;
      this.settings.set(key, existing);
      return existing;
    }

    const id = randomUUID();
    const setting: Setting = {
      id,
      key,
      value,
      updatedAt: now,
    };
    this.settings.set(key, setting);
    return setting;
  }
}

export class PostgresStorage implements IStorage {
  constructor() {
    // Seed default users on initialization
    this.seedDefaultUsers();
  }

  private async seedDefaultUsers() {
    const defaultUsers = [
      { username: "admin", password: "admin123", role: "admin" as const },
      { username: "campo", password: "campo123", role: "campo" as const },
      { username: "transporte", password: "trans123", role: "transporte" as const },
      { username: "algodoeira", password: "algo123", role: "algodoeira" as const },
    ];

    for (const user of defaultUsers) {
      try {
        const existing = await this.getUserByUsername(user.username);
        if (!existing) {
          await this.createUser(user);
        }
      } catch (error) {
        console.error(`Error seeding user ${user.username}:`, error);
      }
    }
  }

  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(usersTable).where(eq(usersTable.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(usersTable).values({
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role as UserRole,
    }).returning();
    return result[0];
  }

  // Bale methods
  async getAllBales(): Promise<Bale[]> {
    const result = await db.select().from(balesTable).orderBy(sql`${balesTable.updatedAt} DESC`);
    return result;
  }

  async getBale(id: string): Promise<Bale | undefined> {
    const result = await db.select().from(balesTable).where(eq(balesTable.id, id)).limit(1);
    return result[0];
  }

  async getBaleByQRCode(qrCode: string): Promise<Bale | undefined> {
    const result = await db.select().from(balesTable).where(eq(balesTable.qrCode, qrCode)).limit(1);
    return result[0];
  }

  async initBale(data: InitBale): Promise<Bale> {
    const now = new Date();

    const result = await db.insert(balesTable).values({
      id: data.id,
      qrCode: data.qrCode,
      safra: null,
      talhao: null,
      numero: null,
      status: "campo",
      createdAt: now,
      updatedAt: now,
    }).returning();

    return result[0];
  }

  async completeBale(qrCode: string, data: CompleteBale, userId: string): Promise<Bale> {
    const now = new Date();

    const result = await db.update(balesTable)
      .set({
        talhao: data.talhao,
        numero: data.numero,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        campoLatitude: data.latitude || null,
        campoLongitude: data.longitude || null,
        campoTimestamp: now,
        campoUserId: userId,
        updatedAt: now,
      })
      .where(eq(balesTable.qrCode, qrCode))
      .returning();

    if (!result[0]) {
      throw new Error("Fardo não encontrado");
    }

    return result[0];
  }

  async createCompleteBale(data: CreateBale, userId: string): Promise<Bale> {
    const now = new Date();

    const result = await db.insert(balesTable).values({
      id: data.id,
      qrCode: data.qrCode,
      safra: data.safra || null,
      talhao: data.talhao,
      numero: data.numero,
      status: "campo",
      createdAt: now,
      updatedAt: now,
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      campoLatitude: data.latitude || null,
      campoLongitude: data.longitude || null,
      campoTimestamp: now,
      campoUserId: userId,
    }).returning();

    return result[0];
  }

  async createBale(insertBale: InsertBale, userId: string): Promise<Bale> {
    const now = new Date();

    const result = await db.insert(balesTable).values({
      qrCode: insertBale.qrCode,
      safra: insertBale.safra || null,
      talhao: insertBale.talhao,
      numero: insertBale.numero,
      status: "campo",
      createdAt: now,
      updatedAt: now,
      latitude: insertBale.latitude || null,
      longitude: insertBale.longitude || null,
      campoLatitude: insertBale.latitude || null,
      campoLongitude: insertBale.longitude || null,
      campoTimestamp: now,
      campoUserId: userId,
    }).returning();

    return result[0];
  }

  async updateBaleStatus(
    id: string,
    newStatus: BaleStatus,
    latitude: string | undefined,
    longitude: string | undefined,
    userId: string
  ): Promise<Bale> {
    const bale = await this.getBale(id);
    if (!bale) {
      throw new Error("Fardo não encontrado");
    }

    // Validate status transition
    if (newStatus === "patio" && bale.status !== "campo") {
      throw new Error("Apenas fardos no campo podem ser movidos para o pátio");
    }

    if (newStatus === "beneficiado" && bale.status !== "patio") {
      throw new Error("Apenas fardos no pátio podem ser beneficiados");
    }

    const now = new Date();
    const updates: Partial<Bale> = {
      status: newStatus,
      latitude: latitude || null,
      longitude: longitude || null,
      updatedAt: now,
    };

    if (newStatus === "patio") {
      updates.patioLatitude = latitude || null;
      updates.patioLongitude = longitude || null;
      updates.patioTimestamp = now;
      updates.patioUserId = userId;
    } else if (newStatus === "beneficiado") {
      updates.beneficiadoLatitude = latitude || null;
      updates.beneficiadoLongitude = longitude || null;
      updates.beneficiadoTimestamp = now;
      updates.beneficiadoUserId = userId;
    }

    const result = await db.update(balesTable).set(updates).where(eq(balesTable.id, id)).returning();
    return result[0];
  }

  async getBaleStats(): Promise<{
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }> {
    const allBales = await this.getAllBales();

    return {
      campo: allBales.filter((b) => b.status === "campo").length,
      patio: allBales.filter((b) => b.status === "patio").length,
      beneficiado: allBales.filter((b) => b.status === "beneficiado").length,
      total: allBales.length,
    };
  }

  async getBaleStatsByTalhao(): Promise<{
    talhao: string;
    campo: number;
    patio: number;
    beneficiado: number;
    total: number;
  }[]> {
    const allBales = await this.getAllBales();
    
    // Group bales by talhao
    const talhaoMap = new Map<string, Bale[]>();
    
    for (const bale of allBales) {
      if (bale.talhao) {
        const existing = talhaoMap.get(bale.talhao) || [];
        talhaoMap.set(bale.talhao, [...existing, bale]);
      }
    }
    
    // Calculate stats for each talhao
    const stats = Array.from(talhaoMap.entries()).map(([talhao, bales]) => ({
      talhao,
      campo: bales.filter(b => b.status === "campo").length,
      patio: bales.filter(b => b.status === "patio").length,
      beneficiado: bales.filter(b => b.status === "beneficiado").length,
      total: bales.length,
    }));
    
    // Sort by talhao name
    return stats.sort((a, b) => a.talhao.localeCompare(b.talhao));
  }

  async deleteAllBales(): Promise<{ deletedCount: number }> {
    const result = await db.delete(balesTable).returning({ id: balesTable.id });
    return { deletedCount: result.length };
  }

  // Settings methods
  async getSetting(key: string): Promise<Setting | undefined> {
    const result = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
    return result[0];
  }

  async updateSetting(key: string, value: string): Promise<Setting> {
    const now = new Date();
    const existing = await this.getSetting(key);

    if (existing) {
      const result = await db.update(settingsTable)
        .set({ value, updatedAt: now })
        .where(eq(settingsTable.key, key))
        .returning();
      return result[0];
    }

    const result = await db.insert(settingsTable).values({
      key,
      value,
      updatedAt: now,
    }).returning();
    return result[0];
  }
}

export const storage = new PostgresStorage();
