import type { Express, Request, Response } from "express";
import type { Server } from "http";
import { z, ZodError } from "zod";
import {
  createPgrPayloadSchema,
  documentPdfPayloadSchema,
  insertCompanySchema,
  insertTrainingSchema,
  settingsSchema,
  updateCompanySchema,
  updatePgrPayloadSchema,
  updateTrainingSchema,
} from "@shared/schema";
import { registerAuthRoutes, requireAuth } from "./auth";
import { generateDocumentPdf, generatePgrPdf } from "./services/pdf";
import { GOV_SST_SOURCE_URL, getLatestGovSstNews } from "./services/govSstNews";
import {
  DEFAULT_EXPIRING_WINDOW_DAYS,
  listExpiringTrainingsByDate,
  parseWindowDays,
} from "./services/trainingDue";
import { validateTrainingNormRules } from "./services/trainingNormValidation";
import { storage } from "./storage";

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

function omitUndefined<T extends Record<string, unknown>>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
  ) as Partial<T>;
}

function isTruthyQueryValue(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((entry) => isTruthyQueryValue(entry));
  }

  if (typeof value !== "string") {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function getTenantIdOr401(req: Request, res: Response): string | undefined {
  const tenantId = req.authTenantId;
  if (!tenantId) {
    res.status(401).json({ message: "Tenant scope missing in token" });
    return undefined;
  }
  return tenantId;
}

export async function registerRoutes(app: Express, httpServer: Server): Promise<Server> {
  await registerAuthRoutes(app);

  app.use("/api", (req, res, next) => {
    if (req.path.startsWith("/auth")) {
      return next();
    }

    requireAuth(req, res, () => {
      if (req.path.startsWith("/settings") && req.authRole !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }

      return next();
    });
  });

  // ==================== SETTINGS ====================

  app.get("/api/settings", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    try {
      const settings = await storage.getSettings(tenantId);
      res.json(settings);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get settings" });
    }
  });

  app.put("/api/settings", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const v = validateBody(settingsSchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }

    try {
      const updated = await storage.updateSettings(tenantId, v.data);
      res.json(updated);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  // ==================== SST NEWS ====================

  app.get("/api/sst-news", async (_req: Request, res: Response) => {
    try {
      const items = await getLatestGovSstNews(3);
      res.json({
        sourceUrl: GOV_SST_SOURCE_URL,
        items,
      });
    } catch (err) {
      console.error(err);
      res.status(502).json({
        message: "Failed to get SST news",
        sourceUrl: GOV_SST_SOURCE_URL,
        items: [],
      });
    }
  });

  // ==================== COMPANIES ====================

  app.get("/api/companies", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    try {
      const data = await storage.listCompanies(tenantId);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list companies" });
    }
  });

  app.get("/api/companies/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    try {
      const company = await storage.getCompany(tenantId, id);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get company" });
    }
  });

  app.post("/api/companies", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const v = validateBody(insertCompanySchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }

    try {
      const company = await storage.createCompany(tenantId, v.data);
      res.status(201).json(company);
    } catch (err) {
      const maybeDbError = err as { code?: string };
      if (maybeDbError?.code === "23505") {
        return res.status(409).json({ message: "CNPJ already exists for this tenant" });
      }

      console.error(err);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.put("/api/companies/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const v = validateBody(updateCompanySchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }

    try {
      const company = await storage.updateCompany(tenantId, id, v.data);
      if (!company) return res.status(404).json({ message: "Company not found" });
      res.json(company);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update company" });
    }
  });

  app.delete("/api/companies/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    try {
      const deleted = await storage.deleteCompany(tenantId, id);
      if (!deleted) return res.status(404).json({ message: "Company not found" });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete company" });
    }
  });

  // ==================== PGRS ====================

  app.get("/api/pgrs", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    try {
      const data = await storage.listPgrs(tenantId);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list PGRs" });
    }
  });

  app.get("/api/pgrs/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    try {
      const detail = await storage.getPgrDetail(tenantId, id);
      if (!detail) return res.status(404).json({ message: "PGR not found" });
      res.json(detail);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get PGR" });
    }
  });

  app.get("/api/pgrs/:id/pdf", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    try {
      const detail = await storage.getPgrDetail(tenantId, id);
      if (!detail) return res.status(404).json({ message: "PGR not found" });

      const generatedAt = new Date();
      const pdfBuffer = generatePgrPdf(detail, {
        documentId: id,
        tenantId,
        userId: req.authUserId,
        generatedAt,
      });

      const safeId = id.replace(/[^a-zA-Z0-9_-]/g, "");
      const filename = `pgr-${safeId || "documento"}.pdf`;

      console.info(
        `[AUDIT] PDF generated pgr=${id} tenant=${tenantId} user=${req.authUserId ?? "unknown"} at=${generatedAt.toISOString()} bytes=${pdfBuffer.length}`,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdfBuffer.length));
      return res.status(200).send(pdfBuffer);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to generate PGR PDF" });
    }
  });

  app.post("/api/documents/pdf", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const v = validateBody(documentPdfPayloadSchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }

    try {
      const generatedAt = new Date();
      const pdfBuffer = generateDocumentPdf(v.data, {
        templateId: v.data.template_id,
        tenantId,
        userId: req.authUserId,
        generatedAt,
      });

      const safeId = v.data.template_id.replace(/[^a-zA-Z0-9_-]/g, "");
      const dateToken = generatedAt.toISOString().slice(0, 10);
      const filename = `documento-${safeId || "sst"}-${dateToken}.pdf`;

      console.info(
        `[AUDIT] Document PDF generated template=${v.data.template_id} tenant=${tenantId} user=${req.authUserId ?? "unknown"} at=${generatedAt.toISOString()} bytes=${pdfBuffer.length}`,
      );

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.setHeader("Content-Length", String(pdfBuffer.length));
      return res.status(200).send(pdfBuffer);
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Failed to generate document PDF" });
    }
  });

  app.post("/api/pgrs", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const v = validateBody(createPgrPayloadSchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }

    try {
      const pgrId = await storage.createPgr(tenantId, v.data);
      res.status(201).json({ id: pgrId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create PGR" });
    }
  });

  app.put("/api/pgrs/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const v = validateBody(updatePgrPayloadSchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }
    if (v.data.pgrId !== id) {
      return res.status(400).json({ message: "URL id does not match payload pgrId" });
    }

    try {
      const pgrId = await storage.updatePgr(tenantId, v.data);
      res.json({ id: pgrId });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update PGR" });
    }
  });

  app.delete("/api/pgrs/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });
    const deleteOrphanCompany = isTruthyQueryValue(req.query.delete_orphan_company);

    try {
      const deleted = await storage.deletePgr(tenantId, id, { deleteOrphanCompany });
      if (!deleted) return res.status(404).json({ message: "PGR not found" });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete PGR" });
    }
  });

  // ==================== TRAININGS ====================

  app.get("/api/trainings", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    try {
      const data = await storage.listTrainings(tenantId);
      res.json(data);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list trainings" });
    }
  });

  app.get("/api/trainings/expiring", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const windowDays = parseWindowDays(
      Array.isArray(req.query.window_days) ? req.query.window_days[0] : req.query.window_days,
      DEFAULT_EXPIRING_WINDOW_DAYS,
    );

    try {
      const trainings = await storage.listTrainings(tenantId);
      const now = new Date();
      const items = listExpiringTrainingsByDate(trainings, now, windowDays);
      const totalParticipants = items.reduce(
        (total, training) => total + (training.participants_count ?? 0),
        0,
      );

      res.json({
        windowDays,
        generatedAt: now.toISOString(),
        totalTrainings: items.length,
        totalParticipants,
        items,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to list expiring trainings" });
    }
  });

  app.get("/api/trainings/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    try {
      const training = await storage.getTraining(tenantId, id);
      if (!training) return res.status(404).json({ message: "Training not found" });
      res.json(training);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to get training" });
    }
  });

  app.post("/api/trainings", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const v = validateBody(insertTrainingSchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }
    const trainingNormError = validateTrainingNormRules(v.data);
    if (trainingNormError) {
      return res.status(400).json({ message: trainingNormError });
    }

    try {
      const training = await storage.createTraining(tenantId, v.data);
      res.status(201).json(training);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to create training" });
    }
  });

  app.put("/api/trainings/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    const v = validateBody(updateTrainingSchema, req.body);
    if (!v.success) {
      return res.status(400).json({ message: "Validation failed", errors: v.error.flatten() });
    }
    const updatePayload = omitUndefined(v.data);
    const touchedNormFields = [
      "title",
      "training_date",
      "notes",
      "participants_count",
      "participants_label",
    ].some((field) => field in updatePayload);

    try {
      if (touchedNormFields) {
        const existing = await storage.getTraining(tenantId, id);
        if (!existing) {
          return res.status(404).json({ message: "Training not found" });
        }

        const mergedForValidation = {
          ...existing,
          ...updatePayload,
        };
        const trainingNormError = validateTrainingNormRules(mergedForValidation);
        if (trainingNormError) {
          return res.status(400).json({ message: trainingNormError });
        }
      }

      const training = await storage.updateTraining(tenantId, id, updatePayload);
      if (!training) return res.status(404).json({ message: "Training not found" });
      res.json(training);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to update training" });
    }
  });

  app.delete("/api/trainings/:id", async (req: Request, res: Response) => {
    const tenantId = getTenantIdOr401(req, res);
    if (!tenantId) return;

    const id = getIdParam(req);
    if (!id) return res.status(400).json({ message: "Invalid id" });

    try {
      const deleted = await storage.deleteTraining(tenantId, id);
      if (!deleted) return res.status(404).json({ message: "Training not found" });
      res.status(204).send();
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Failed to delete training" });
    }
  });

  return httpServer;
}
