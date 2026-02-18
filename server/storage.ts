import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  companies,
  pgrs,
  pgrRisks,
  pgrActions,
  trainings,
} from "@shared/schema";
import type {
  User,
  InsertUser,
  Company,
  InsertCompany,
  UpdateCompany,
  Training,
  InsertTraining,
  UpdateTraining,
  PgrListItem,
  PgrDetail,
  CreatePgrPayload,
  UpdatePgrPayload,
} from "@shared/schema";

export interface IStorage {
    // Settings
    getSettings(): Promise<any>;
    updateSettings(data: any): Promise<any>;
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;

  // Companies
  listCompanies(): Promise<Company[]>;
  getCompany(id: string): Promise<Company | undefined>;
  createCompany(data: InsertCompany): Promise<Company>;
  updateCompany(id: string, data: UpdateCompany): Promise<Company | undefined>;
  deleteCompany(id: string): Promise<boolean>;

  // PGRs
  listPgrs(): Promise<PgrListItem[]>;
  getPgrDetail(id: string): Promise<PgrDetail | undefined>;
  createPgr(payload: CreatePgrPayload): Promise<string>;
  updatePgr(payload: UpdatePgrPayload): Promise<string>;
  deletePgr(id: string): Promise<boolean>;

  // Trainings
  listTrainings(): Promise<Training[]>;
  getTraining(id: string): Promise<Training | undefined>;
  createTraining(data: InsertTraining): Promise<Training>;
  updateTraining(
    id: string,
    data: UpdateTraining,
  ): Promise<Training | undefined>;
  deleteTraining(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
    // ── Settings ──────────────────────────────────────────
    async getSettings(): Promise<any> {
      // Exemplo: buscar da tabela settings, ou arquivo JSON
      const [row] = await db.select().from("settings");
      return row || {};
    }

    async updateSettings(data: any): Promise<any> {
      // Exemplo: atualizar tabela settings, ou arquivo JSON
      const [row] = await db
        .update("settings")
        .set(data)
        .returning();
      return row;
    }
  // ── Users ────────────────────────────────────────────────

  async getUser(id: string): Promise<User | undefined> {
    const [row] = await db.select().from(users).where(eq(users.id, id));
    return row;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return row;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [row] = await db.insert(users).values(data).returning();
    return row;
  }

  async updateUserPassword(id: string, password: string): Promise<User | undefined> {
    const [row] = await db
      .update(users)
      .set({ password })
      .where(eq(users.id, id))
      .returning();
    return row;
  }

  // ── Companies ────────────────────────────────────────────

  async listCompanies(): Promise<Company[]> {
    return db.select().from(companies).orderBy(desc(companies.created_at));
  }

  async getCompany(id: string): Promise<Company | undefined> {
    const [row] = await db
      .select()
      .from(companies)
      .where(eq(companies.id, id));
    return row;
  }

  async createCompany(data: InsertCompany): Promise<Company> {
    const [row] = await db.insert(companies).values(data).returning();
    return row;
  }

  async updateCompany(
    id: string,
    data: UpdateCompany,
  ): Promise<Company | undefined> {
    const [row] = await db
      .update(companies)
      .set(data)
      .where(eq(companies.id, id))
      .returning();
    return row;
  }

  async deleteCompany(id: string): Promise<boolean> {
    const result = await db
      .delete(companies)
      .where(eq(companies.id, id))
      .returning({ id: companies.id });
    return result.length > 0;
  }

  // ── PGRs ─────────────────────────────────────────────────

  async listPgrs(): Promise<PgrListItem[]> {
    const rows = await db
      .select({
        id: pgrs.id,
        status: pgrs.status,
        revision: pgrs.revision,
        valid_until: pgrs.valid_until,
        created_at: pgrs.created_at,
        progress: pgrs.progress,
        company_id: companies.id,
        company_name: companies.name,
        company_cnpj: companies.cnpj,
      })
      .from(pgrs)
      .leftJoin(companies, eq(pgrs.company_id, companies.id))
      .orderBy(desc(pgrs.created_at));

    return rows.map((row) => ({
      id: row.id,
      status: row.status as PgrListItem["status"],
      revision: row.revision,
      valid_until: row.valid_until,
      created_at: row.created_at,
      progress: row.progress,
      company: row.company_id
        ? {
            id: row.company_id,
            name: row.company_name!,
            cnpj: row.company_cnpj ?? null,
          }
        : null,
    }));
  }

  async getPgrDetail(id: string): Promise<PgrDetail | undefined> {
    const [pgrRow] = await db.select().from(pgrs).where(eq(pgrs.id, id));
    if (!pgrRow) return undefined;

    const [companyRow] = pgrRow.company_id
      ? await db
          .select()
          .from(companies)
          .where(eq(companies.id, pgrRow.company_id))
      : [undefined];

    const risksRows = await db
      .select()
      .from(pgrRisks)
      .where(eq(pgrRisks.pgr_id, id))
      .orderBy(pgrRisks.created_at);

    const actionsRows = await db
      .select()
      .from(pgrActions)
      .where(eq(pgrActions.pgr_id, id))
      .orderBy(pgrActions.created_at);

    return {
      pgr: pgrRow as PgrDetail["pgr"],
      company: companyRow ?? null,
      risks: risksRows,
      actions: actionsRows,
    };
  }

  async createPgr(payload: CreatePgrPayload): Promise<string> {
    return db.transaction(async (tx) => {
      const { company, pgr, risks, actions } = payload;

      // Upsert company by CNPJ
      let companyId: string;
      if (company.cnpj) {
        const [existing] = await tx
          .select({ id: companies.id })
          .from(companies)
          .where(eq(companies.cnpj, company.cnpj));
        if (existing) {
          companyId = existing.id;
        } else {
          const [inserted] = await tx
            .insert(companies)
            .values(company)
            .returning({ id: companies.id });
          companyId = inserted.id;
        }
      } else {
        const [inserted] = await tx
          .insert(companies)
          .values(company)
          .returning({ id: companies.id });
        companyId = inserted.id;
      }

      // Insert PGR
      const [newPgr] = await tx
        .insert(pgrs)
        .values({ ...pgr, company_id: companyId })
        .returning({ id: pgrs.id });
      const pgrId = newPgr.id;

      // Bulk insert risks
      if (risks.length > 0) {
        await tx
          .insert(pgrRisks)
          .values(risks.map((r) => ({ ...r, pgr_id: pgrId })));
      }

      // Bulk insert actions
      if (actions.length > 0) {
        await tx
          .insert(pgrActions)
          .values(actions.map((a) => ({ ...a, pgr_id: pgrId })));
      }

      return pgrId;
    });
  }

  async updatePgr(payload: UpdatePgrPayload): Promise<string> {
    return db.transaction(async (tx) => {
      const { company, pgr, risks, actions, pgrId, companyId } = payload;

      // Update company
      await tx
        .update(companies)
        .set(company)
        .where(eq(companies.id, companyId));

      // Update PGR
      await tx
        .update(pgrs)
        .set({
          ...pgr,
          company_id: companyId,
          updated_at: new Date().toISOString(),
        })
        .where(eq(pgrs.id, pgrId));

      // Delete + re-insert risks
      await tx.delete(pgrRisks).where(eq(pgrRisks.pgr_id, pgrId));
      if (risks.length > 0) {
        await tx
          .insert(pgrRisks)
          .values(risks.map((r) => ({ ...r, pgr_id: pgrId })));
      }

      // Delete + re-insert actions
      await tx.delete(pgrActions).where(eq(pgrActions.pgr_id, pgrId));
      if (actions.length > 0) {
        await tx
          .insert(pgrActions)
          .values(actions.map((a) => ({ ...a, pgr_id: pgrId })));
      }

      return pgrId;
    });
  }

  async deletePgr(id: string): Promise<boolean> {
    const result = await db
      .delete(pgrs)
      .where(eq(pgrs.id, id))
      .returning({ id: pgrs.id });
    return result.length > 0;
  }

  // ── Trainings ────────────────────────────────────────────

  async listTrainings(): Promise<Training[]> {
    return db
      .select()
      .from(trainings)
      .orderBy(desc(trainings.created_at)) as Promise<Training[]>;
  }

  async getTraining(id: string): Promise<Training | undefined> {
    const [row] = await db
      .select()
      .from(trainings)
      .where(eq(trainings.id, id));
    return row as Training | undefined;
  }

  async createTraining(data: InsertTraining): Promise<Training> {
    const [row] = await db.insert(trainings).values(data).returning();
    return row as Training;
  }

  async updateTraining(
    id: string,
    data: UpdateTraining,
  ): Promise<Training | undefined> {
    const [row] = await db
      .update(trainings)
      .set({ ...data, updated_at: new Date().toISOString() })
      .where(eq(trainings.id, id))
      .returning();
    return row as Training | undefined;
  }

  async deleteTraining(id: string): Promise<boolean> {
    const result = await db
      .delete(trainings)
      .where(eq(trainings.id, id))
      .returning({ id: trainings.id });
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
