import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import type { User as SchemaUser } from "@shared/schema";
import {
  loginSchema,
  createUserSchema,
  batchCreateBalesSchema,
  updateBaleStatusSchema,
  updateDefaultSafraSchema,
} from "@shared/schema";

// Estender Request do Express com métodos do Passport
declare global {
  namespace Express {
    // Usar o tipo User do schema
    type User = SchemaUser;
  }
}

declare module "express-serve-static-core" {
  interface Request {
    isAuthenticated(): boolean;
    user?: Express.User;
  }
}
import { z } from "zod";
import { generatePDF, generateExcel } from "./reports";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      const { password: _, ...userWithoutPassword } = user;

      // Parse roles do JSON
      const availableRoles: string[] = user.roles ? JSON.parse(user.roles) : [];

      res.json({
        ...userWithoutPassword,
        availableRoles, // Adiciona array de papéis disponíveis
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      res.status(500).json({
        error: "Erro ao fazer login",
      });
    }
  });

  // User management routes (superadmin only)
  app.get("/api/users", async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({
        error: "Erro ao buscar usuários",
      });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const userData = createUserSchema.parse(req.body);
      const creatorId = req.body.createdBy; // ID do super admin que está criando

      const newUser = await storage.createUser({
        username: userData.username,
        displayName: userData.displayName,
        password: userData.password,
        roles: userData.roles, // Array será convertido para JSON no storage
        createdBy: creatorId,
      });

      const { password: _, ...userWithoutPassword } = newUser;
      res.json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      console.error("Error creating user:", error);
      res.status(500).json({
        error: "Erro ao criar usuário",
      });
    }
  });

  app.patch("/api/users/:id/roles", async (req, res) => {
    try {
      const { id } = req.params;
      const { roles } = req.body;

      if (!roles || !Array.isArray(roles) || roles.length === 0) {
        return res.status(400).json({
          error: "Roles inválidos. Deve ser um array com pelo menos um papel.",
        });
      }

      await storage.updateUserRoles(id, roles);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating user roles:", error);
      res.status(500).json({
        error: "Erro ao atualizar papéis do usuário",
      });
    }
  });

  // Delete user (superadmin only)
  app.delete("/api/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      console.log(`Deleting user: ${id}`);
      await storage.deleteUser(id);
      
      res.json({ success: true, message: "Usuário excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({
        error: "Erro ao deletar usuário",
      });
    }
  });

  // Bale routes
  
  // Get bale statistics
  app.get("/api/bales/stats", async (req, res) => {
    try {
      const stats = await storage.getBaleStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({
        error: "Erro ao buscar estatísticas",
      });
    }
  });

  // Get bale stats by talhao
  app.get("/api/bales/stats-by-talhao", async (req, res) => {
    try {
      const stats = await storage.getBaleStatsByTalhao();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats by talhao:", error);
      res.status(500).json({
        error: "Erro ao buscar estatísticas por talhão",
      });
    }
  });

  // Get bale stats by safra
  app.get("/api/bales/stats-by-safra", async (req, res) => {
    try {
      const stats = await storage.getStatsBySafra();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats by safra:", error);
      res.status(500).json({
        error: "Erro ao buscar estatísticas por safra",
      });
    }
  });

  // Get all bales
  app.get("/api/bales", async (req, res) => {
    try {
      const bales = await storage.getAllBales();
      res.json(bales);
    } catch (error) {
      console.error("Error fetching bales:", error);
      res.status(500).json({
        error: "Erro ao buscar fardos",
      });
    }
  });

  // Get bale by ID
  app.get("/api/bales/:id", async (req, res) => {
    try {
      const bale = await storage.getBale(req.params.id);
      
      if (!bale) {
        return res.status(404).json({
          error: "Fardo não encontrado",
        });
      }

      res.json(bale);
    } catch (error) {
      console.error("Error fetching bale:", error);
      res.status(500).json({
        error: "Erro ao buscar fardo",
      });
    }
  });

  // Create single bale
  app.post("/api/bales", async (req, res) => {
    try {
      const { id, safra, talhao, numero, userId } = req.body;

      if (!id || !safra || !talhao || !numero) {
        return res.status(400).json({
          error: "Dados inválidos: id, safra, talhao e numero são obrigatórios",
        });
      }

      // Check if bale already exists
      const existing = await storage.getBale(id);
      if (existing) {
        return res.status(409).json({
          error: `Fardo ${id} já existe no sistema`,
        });
      }

      // Create single bale with userId from request or fallback
      const finalUserId = userId || "campo-user";
      const bale = await storage.createSingleBale(id, safra, talhao, numero, finalUserId);

      res.status(201).json(bale);
    } catch (error) {
      console.error("Error creating bale:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : "Erro ao criar fardo",
      });
    }
  });

  // Create bales in batch (NEW)
  app.post("/api/bales/batch", async (req, res) => {
    try {
      const { userId, ...data } = req.body;
      const validatedData = batchCreateBalesSchema.parse(data);

      // Use userId from request or fallback to generic user
      const finalUserId = userId || "campo-user";

      const bales = await storage.batchCreateBales(validatedData, finalUserId);

      // Retornar informações sobre quantos foram criados vs quantos foram solicitados
      const response = {
        created: bales.length,
        requested: validatedData.quantidade,
        skipped: validatedData.quantidade - bales.length,
        bales: bales,
      };

      res.status(201).json(response);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      console.error("Error creating bales:", error);
      res.status(500).json({
        error: "Erro ao cadastrar fardos",
      });
    }
  });

  // Update bale status (SEM GPS)
  app.patch("/api/bales/:id/status", async (req, res) => {
    try {
      const { status, userId } = updateBaleStatusSchema.parse(req.body);

      // Use userId from request or fallback to status-user
      const finalUserId = userId || `${status}-user`;

      const bale = await storage.updateBaleStatus(
        req.params.id,
        status,
        finalUserId
      );

      res.json(bale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      if (error instanceof Error) {
        return res.status(400).json({
          error: error.message,
        });
      }

      console.error("Error updating bale status:", error);
      res.status(500).json({
        error: "Erro ao atualizar status do fardo",
      });
    }
  });

  // Delete all bales (superadmin only) - DEVE VIR ANTES DO DELETE BY ID
  app.delete("/api/bales/all", async (req, res) => {
    try {
      console.log("=== DELETE /api/bales/all ===");
      console.log("Body:", req.body);
      
      // Aceita confirmação via body
      const confirm = req.body?.confirm;
      
      console.log("Confirm value:", confirm);
      
      if (confirm !== "DELETE_ALL_BALES") {
        console.log("❌ Invalid confirmation. Expected 'DELETE_ALL_BALES', got:", confirm);
        return res.status(400).json({
          error: `Confirmação inválida. Operação bloqueada. Recebido: ${confirm}`,
        });
      }

      console.log("✅ Confirmation valid. Deleting all bales...");
      const result = await storage.deleteAllBales();
      
      console.log(`✅ Deleted ${result.deletedCount} bales`);
      
      res.json({
        message: `${result.deletedCount} fardo(s) deletado(s) com sucesso`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("❌ Error deleting all bales:", error);
      res.status(500).json({
        error: "Erro ao deletar todos os fardos",
      });
    }
  });

  // Delete single bale (admin or superadmin only)
  app.delete("/api/bales/:id", async (req, res) => {
    try {
      const { id } = req.params;
      console.log(`Deleting bale: ${id}`);
      
      await storage.deleteBale(decodeURIComponent(id));
      
      res.json({ success: true, message: "Fardo excluído com sucesso" });
    } catch (error) {
      console.error("Error deleting bale:", error);
      res.status(500).json({
        error: "Erro ao excluir fardo individual",
      });
    }
  });

  // Settings endpoints
  app.get("/api/settings/default-safra", async (req, res) => {
    try {
      const setting = await storage.getSetting("default_safra");
      
      if (!setting) {
        return res.json({ value: "" });
      }

      res.json({ value: setting.value });
    } catch (error) {
      console.error("Error fetching default safra:", error);
      res.status(500).json({
        error: "Erro ao buscar safra padrão",
      });
    }
  });

  app.put("/api/settings/default-safra", async (req, res) => {
    try {
      const { value } = updateDefaultSafraSchema.parse(req.body);

      const setting = await storage.updateSetting("default_safra", value);

      res.json({ value: setting.value });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      console.error("Error updating default safra:", error);
      res.status(500).json({
        error: "Erro ao atualizar safra padrão",
      });
    }
  });

  // Reports endpoints
  app.get("/api/reports/pdf", async (req, res) => {
    try {
      const bales = await storage.getAllBales();
      
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        talhao: req.query.talhao ? (req.query.talhao as string).split(',') : undefined,
      };
      
      const pdfBuffer = generatePDF(bales, filters);
      
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename=relatorio-${Date.now()}.pdf`);
      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).json({
        error: "Erro ao gerar relatório PDF",
      });
    }
  });

  app.get("/api/reports/excel", async (req, res) => {
    try {
      const bales = await storage.getAllBales();
      
      const filters = {
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        status: req.query.status ? (req.query.status as string).split(',') : undefined,
        talhao: req.query.talhao ? (req.query.talhao as string).split(',') : undefined,
      };
      
      const excelBuffer = generateExcel(bales, filters);
      
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename=relatorio-${Date.now()}.xlsx`);
      res.send(excelBuffer);
    } catch (error) {
      console.error("Error generating Excel:", error);
      res.status(500).json({
        error: "Erro ao gerar relatório Excel",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}