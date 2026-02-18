import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { z, ZodError } from "zod";
import { storage } from "./storage";
import { registerAuthRoutes, requireAuth } from "./auth";
import {
  insertCompanySchema,
  updateCompanySchema,
  createPgrPayloadSchema,
  updatePgrPayloadSchema,
  insertTrainingSchema,
  updateTrainingSchema,
} from "@shared/schema";

function validateBody<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
): { success: true; data: z.output<T> } | { success: false; error: ZodError } {
  const result = schema.safeParse(body);
  if (!result.success) return { success: false, error: result.error };
  return { success: true, data: result.data };
}

function getIdParam(req: Request): string | undefined {
  const id = req.params.id;
  if (Array.isArray(id)) {
    return id[0];
  }
  return id;
}

export async function registerRoutes(
    // ==================== SETTINGS ====================

    // Obter configurações
    app.get("/api/settings", async (_req: Request, res: Response) => {
      try {
        const settings = await storage.getSettings();
        res.json(settings);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to get settings" });
      }
    });

    // Atualizar configurações
    app.put("/api/settings", async (req: Request, res: Response) => {
      try {
        const v = settingsSchema.safeParse(req.body);
        if (!v.success) {
          return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
        }
        const updated = await storage.updateSettings(v.data);
        res.json(updated);
      } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Failed to update settings" });
      }
    });
  httpServer: Server,
  app: Express,
): Promise<Server> {
  await registerAuthRoutes(app);

  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) {
      return next();
    }
    // Permitir apenas admin para /api/settings
    if (req.path.startsWith("/settings")) {
      // Exemplo: req.user.role === 'admin'
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      return next();
    }
    return requireAuth(req, res, next);
  });

  // ==================== COMPANIES ====================

  app.get("/api/companies", async (_req: Request, res: Response) => {
    try {
      const data = await storage.listCompanies();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list companies" });
    }
  });

  app.get("/api/companies/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    try {
      const company = await storage.getCompany(id);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get company" });
    }
  });

  app.post("/api/companies", async (req: Request, res: Response) => {
    const v = validateBody(insertCompanySchema, req.body);
    if (!v.success)
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    try {
      const company = await storage.createCompany(v.data);
      res.status(201).json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const v = validateBody(updateCompanySchema, req.body);
    if (!v.success)
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    try {
      const company = await storage.updateCompany(id, v.data);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    try {
      const deleted = await storage.deleteCompany(id);
      if (!deleted) return res.status(404).json({ message: "Company not found" });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // ==================== PGRS ====================

  app.get("/api/pgrs", async (_req: Request, res: Response) => {
    try {
      const data = await storage.listPgrs();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list PGRs" });
    }
  });

  app.get("/api/pgrs/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    try {
      const detail = await storage.getPgrDetail(id);
      if (!detail) return res.status(404).json({ message: "PGR not found" });
      res.json(detail);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get PGR" });
    }
  });

  app.post("/api/pgrs", async (req: Request, res: Response) => {
    const v = validateBody(createPgrPayloadSchema, req.body);
    if (!v.success)
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    try {
      const pgrId = await storage.createPgr(v.data);
      res.status(201).json({ id: pgrId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create PGR" });
    }
  });

  app.put("/api/pgrs/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const v = validateBody(updatePgrPayloadSchema, req.body);
    if (!v.success)
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    if (v.data.pgrId !== id)
      return res.status(400).json({ message: "URL id does not match payload pgrId" });
    try {
      const pgrId = await storage.updatePgr(v.data);
      res.json({ id: pgrId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update PGR" });
    }
  });

  app.delete("/api/pgrs/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    try {
      const deleted = await storage.deletePgr(id);
      if (!deleted) return res.status(404).json({ message: "PGR not found" });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete PGR" });
    }
  });

  // ==================== TRAININGS ====================

  app.get("/api/trainings", async (_req: Request, res: Response) => {
    try {
      const data = await storage.listTrainings();
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list trainings" });
    }
  });

  app.get("/api/trainings/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    try {
      const training = await storage.getTraining(id);
      if (!training) return res.status(404).json({ message: "Training not found" });
      res.json(training);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get training" });
    }
  });

  app.post("/api/trainings", async (req: Request, res: Response) => {
    const v = validateBody(insertTrainingSchema, req.body);
    if (!v.success)
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    try {
      const training = await storage.createTraining(v.data);
      res.status(201).json(training);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create training" });
    }
  });

  app.put("/api/trainings/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const v = validateBody(updateTrainingSchema, req.body);
    if (!v.success)
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    try {
      const training = await storage.updateTraining(id, v.data);
      if (!training) return res.status(404).json({ message: "Training not found" });
      res.json(training);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update training" });
    }
  });

  app.delete("/api/trainings/:id", async (req: Request, res: Response) => {
    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    try {
      const deleted = await storage.deleteTraining(id);
      if (!deleted) return res.status(404).json({ message: "Training not found" });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete training" });
    }
  });

  return httpServer;
}
