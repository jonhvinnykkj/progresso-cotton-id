import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginSchema,
  batchCreateBalesSchema,
  updateBaleStatusSchema,
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
      
      if (!user || user.password !== password) {
        return res.status(401).json({
          error: "Credenciais inválidas",
        });
      }

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
      const { id, safra, talhao, numero } = req.body;

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

      // Create single bale
      const userId = "campo-user";
      const bale = await storage.createSingleBale(id, safra, talhao, numero, userId);

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
      const data = batchCreateBalesSchema.parse(req.body);

      // For MVP, using a generic user ID - in production, get from session
      const userId = "campo-user";

      const bales = await storage.batchCreateBales(data, userId);

      res.status(201).json(bales);
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
      const { status } = updateBaleStatusSchema.parse(req.body);

      // For MVP, using a generic user ID
      const userId = `${status}-user`;

      const bale = await storage.updateBaleStatus(
        req.params.id,
        status,
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