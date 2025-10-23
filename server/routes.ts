import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginSchema,
  insertBaleSchema,
  updateBaleStatusSchema,
  initBaleSchema,
  completeBaleSchema,
  createBaleSchema,
  updateDefaultSafraSchema,
} from "@shared/schema";
import { z } from "zod";
import { generatePDF, generateExcel } from "./reports";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      
      // Simple auth for MVP - in production, use proper password hashing
      if (!user || user.password !== password) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

      // Don't send password to client
      const { password: _, ...userWithoutPassword } = user;

      res.json(userWithoutPassword);
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

  // Bale routes
  
  // Get bale statistics (MUST be before :id route)
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

  // Initialize bale (generate label - only ID + QR)
  app.post("/api/bales/init", async (req, res) => {
    try {
      const data = initBaleSchema.parse(req.body);

      // Check if QR code already exists
      const existingBale = await storage.getBaleByQRCode(data.qrCode);
      if (existingBale) {
        return res.status(409).json({
          error: "QR Code já cadastrado no sistema",
          bale: existingBale,
        });
      }

      const bale = await storage.initBale(data);

      res.status(201).json(bale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      console.error("Error initializing bale:", error);
      res.status(500).json({
        error: "Erro ao inicializar fardo",
      });
    }
  });

  // Complete bale registration (campo phase - scan and add details)
  app.patch("/api/bales/:qrCode/complete", async (req, res) => {
    try {
      const data = completeBaleSchema.parse(req.body);
      const { qrCode } = req.params;

      // Check if bale exists
      const existingBale = await storage.getBaleByQRCode(qrCode);
      if (!existingBale) {
        return res.status(404).json({
          error: "Fardo não encontrado",
        });
      }

      // Check if already completed
      if (existingBale.talhao && existingBale.numero) {
        return res.status(409).json({
          error: "Fardo já cadastrado completamente",
          bale: existingBale,
        });
      }

      // For MVP, using a generic user ID - in production, get from session
      const userId = "campo-user";

      const bale = await storage.completeBale(qrCode, data, userId);

      res.json(bale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      console.error("Error completing bale:", error);
      res.status(500).json({
        error: "Erro ao completar cadastro do fardo",
      });
    }
  });

  // Create complete bale (Campo - with all data including talhao and numero)
  app.post("/api/bales", async (req, res) => {
    try {
      const data = createBaleSchema.parse(req.body);

      // Check if QR code already exists
      const existingBale = await storage.getBaleByQRCode(data.qrCode);
      if (existingBale) {
        return res.status(409).json({
          error: "QR Code já cadastrado no sistema",
          bale: existingBale,
        });
      }

      // SECURITY: Always get safra from admin settings, ignore client-sent value
      const safraConfig = await storage.getSetting("default_safra");
      const safraValue = safraConfig?.value;

      // Override safra with server-side value (security measure)
      const secureData = {
        ...data,
        safra: safraValue,
      };

      // For MVP, using a generic user ID - in production, get from session
      const userId = "campo-user";

      const bale = await storage.createCompleteBale(secureData, userId);

      res.status(201).json(bale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }
      console.error("Error creating bale:", error);
      res.status(500).json({
        error: "Erro ao cadastrar fardo",
      });
    }
  });

  // Update bale status
  app.patch("/api/bales/:id/status", async (req, res) => {
    try {
      const { status, latitude, longitude } = updateBaleStatusSchema.parse(req.body);

      // For MVP, using a generic user ID - in production, get from session
      const userId = `${status}-user`;

      const bale = await storage.updateBaleStatus(
        req.params.id,
        status,
        latitude,
        longitude,
        userId
      );

      res.json(bale);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: "Dados inválidos",
          details: error.errors,
        });
      }

      // Check if it's a business logic error from storage
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

  // Delete all bales (admin only)
  app.delete("/api/bales/all", async (req, res) => {
    try {
      // TODO: Add proper session-based auth check when implementing full auth system
      // For now, require explicit confirmation parameter to prevent accidental deletion
      const { confirm } = req.body;
      
      if (confirm !== "DELETE_ALL_BALES") {
        return res.status(400).json({
          error: "Confirmação inválida. Operação bloqueada.",
        });
      }

      const result = await storage.deleteAllBales();
      
      res.json({
        message: `${result.deletedCount} fardo(s) deletado(s) com sucesso`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting all bales:", error);
      res.status(500).json({
        error: "Erro ao deletar fardos",
      });
    }
  });


  // Settings endpoints
  // Get default safra setting
  app.get("/api/settings/default-safra", async (req, res) => {
    try {
      const setting = await storage.getSetting("default_safra");
      
      if (!setting) {
        return res.json({ value: "" }); // Return empty if not set
      }

      res.json({ value: setting.value });
    } catch (error) {
      console.error("Error fetching default safra:", error);
      res.status(500).json({
        error: "Erro ao buscar safra padrão",
      });
    }
  });

  // Update default safra setting (admin only)
  app.put("/api/settings/default-safra", async (req, res) => {
    try {
      // TODO: Add proper auth check - should only allow admin role
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
        status: req.query.status as string | undefined,
        talhao: req.query.talhao as string | undefined,
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
        status: req.query.status as string | undefined,
        talhao: req.query.talhao as string | undefined,
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
