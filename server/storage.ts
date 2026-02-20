import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import {
  companies,
  pgrActions,
  pgrRisks,
  pgrs,
  settings,
  tenants,
  trainings,
  users,
} from "@shared/schema";
import type {
  Company,
  CreatePgrPayload,
  InsertCompany,
  InsertTraining,
  InsertUser,
  PgrDetail,
  PgrListItem,
  Tenant,
  Training,
  UpdateCompany,
  UpdatePgrPayload,
  UpdateTraining,
  User,
} from "@shared/schema";

type SettingsRow = typeof settings.$inferSelect;
type SettingsUpdate = Partial<Omit<SettingsRow, "id" | "tenant_id">>;

export interface IStorage {
  // Tenants
  getTenant(id: string): Promise<Tenant | undefined>;
  createTenant(name: string): Promise<Tenant>;

  // Settings
  getSettings(tenantId: string): Promise<SettingsRow>;
  updateSettings(tenantId: string, data: SettingsUpdate): Promise<SettingsRow>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: string, password: string): Promise<User | undefined>;

  // Companies
  listCompanies(tenantId: string): Promise<Company[]>;
  getCompany(tenantId: string, id: string): Promise<Company | undefined>;
  createCompany(tenantId: string, data: InsertCompany): Promise<Company>;
  updateCompany(
    tenantId: string,
    id: string,
    data: UpdateCompany,
  ): Promise<Company | undefined>;
  deleteCompany(tenantId: string, id: string): Promise<boolean>;

  // PGRs
  listPgrs(tenantId: string): Promise<PgrListItem[]>;
  getPgrDetail(tenantId: string, id: string): Promise<PgrDetail | undefined>;
  createPgr(tenantId: string, payload: CreatePgrPayload): Promise<string>;
  updatePgr(tenantId: string, payload: UpdatePgrPayload): Promise<string>;
  deletePgr(
    tenantId: string,
    id: string,
    options?: { deleteOrphanCompany?: boolean },
  ): Promise<boolean>;

  // Trainings
  listTrainings(tenantId: string): Promise<Training[]>;
  getTraining(tenantId: string, id: string): Promise<Training | undefined>;
  createTraining(tenantId: string, data: InsertTraining): Promise<Training>;
  updateTraining(
    tenantId: string,
    id: string,
    data: UpdateTraining,
  ): Promise<Training | undefined>;
  deleteTraining(tenantId: string, id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getTenant(id: string): Promise<Tenant | undefined> {
    const [row] = await db.select().from(tenants).where(eq(tenants.id, id));
    return row;
  }

  async createTenant(name: string): Promise<Tenant> {
    const [row] = await db.insert(tenants).values({ name }).returning();
    return row;
  }

  private async ensureSettingsRow(tenantId: string): Promise<SettingsRow> {
    const [existing] = await db
      .select()
      .from(settings)
      .where(eq(settings.tenant_id, tenantId));

    if (existing) {
      return existing;
    }

    const [inserted] = await db.insert(settings).values({ tenant_id: tenantId }).returning();
    return inserted;
  }

  async getSettings(tenantId: string): Promise<SettingsRow> {
    return this.ensureSettingsRow(tenantId);
  }

  async updateSettings(tenantId: string, data: SettingsUpdate): Promise<SettingsRow> {
    const [updated] = await db
      .update(settings)
      .set(data)
      .where(eq(settings.tenant_id, tenantId))
      .returning();

    if (updated) {
      return updated;
    }

    const [inserted] = await db
      .insert(settings)
      .values({ tenant_id: tenantId, ...data })
      .returning();
    return inserted;
  }

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

  async listCompanies(tenantId: string): Promise<Company[]> {
    return db
      .select()
      .from(companies)
      .where(eq(companies.tenant_id, tenantId))
      .orderBy(desc(companies.created_at));
  }

  async getCompany(tenantId: string, id: string): Promise<Company | undefined> {
    const [row] = await db
      .select()
      .from(companies)
      .where(and(eq(companies.id, id), eq(companies.tenant_id, tenantId)));
    return row;
  }

  async createCompany(tenantId: string, data: InsertCompany): Promise<Company> {
    const [row] = await db
      .insert(companies)
      .values({ ...data, tenant_id: tenantId })
      .returning();
    return row;
  }

  async updateCompany(
    tenantId: string,
    id: string,
    data: UpdateCompany,
  ): Promise<Company | undefined> {
    const [row] = await db
      .update(companies)
      .set(data)
      .where(and(eq(companies.id, id), eq(companies.tenant_id, tenantId)))
      .returning();
    return row;
  }

  async deleteCompany(tenantId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(companies)
      .where(and(eq(companies.id, id), eq(companies.tenant_id, tenantId)))
      .returning({ id: companies.id });
    return result.length > 0;
  }

  async listPgrs(tenantId: string): Promise<PgrListItem[]> {
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
      .leftJoin(
        companies,
        and(eq(pgrs.company_id, companies.id), eq(companies.tenant_id, tenantId)),
      )
      .where(eq(pgrs.tenant_id, tenantId))
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
            name: row.company_name ?? "",
            cnpj: row.company_cnpj ?? null,
          }
        : null,
    }));
  }

  async getPgrDetail(tenantId: string, id: string): Promise<PgrDetail | undefined> {
    const [pgrRow] = await db
      .select()
      .from(pgrs)
      .where(and(eq(pgrs.id, id), eq(pgrs.tenant_id, tenantId)));

    if (!pgrRow) {
      return undefined;
    }

    const [companyRow] = await db
      .select()
      .from(companies)
      .where(
        and(eq(companies.id, pgrRow.company_id), eq(companies.tenant_id, tenantId)),
      );

    const risksRows = await db
      .select()
      .from(pgrRisks)
      .where(and(eq(pgrRisks.pgr_id, id), eq(pgrRisks.tenant_id, tenantId)))
      .orderBy(pgrRisks.created_at);

    const actionsRows = await db
      .select()
      .from(pgrActions)
      .where(and(eq(pgrActions.pgr_id, id), eq(pgrActions.tenant_id, tenantId)))
      .orderBy(pgrActions.created_at);

    return {
      pgr: pgrRow as PgrDetail["pgr"],
      company: companyRow ?? null,
      risks: risksRows,
      actions: actionsRows,
    };
  }

  async createPgr(tenantId: string, payload: CreatePgrPayload): Promise<string> {
    return db.transaction(async (tx) => {
      const { company, pgr, risks, actions } = payload;

      let companyId: string;
      if (company.cnpj) {
        const [existing] = await tx
          .select({ id: companies.id })
          .from(companies)
          .where(
            and(
              eq(companies.tenant_id, tenantId),
              eq(companies.cnpj, company.cnpj),
            ),
          );

        if (existing) {
          companyId = existing.id;
        } else {
          const [inserted] = await tx
            .insert(companies)
            .values({ ...company, tenant_id: tenantId })
            .returning({ id: companies.id });
          companyId = inserted.id;
        }
      } else {
        const [inserted] = await tx
          .insert(companies)
          .values({ ...company, tenant_id: tenantId })
          .returning({ id: companies.id });
        companyId = inserted.id;
      }

      const [newPgr] = await tx
        .insert(pgrs)
        .values({ ...pgr, company_id: companyId, tenant_id: tenantId })
        .returning({ id: pgrs.id });
      const pgrId = newPgr.id;

      if (risks.length > 0) {
        await tx.insert(pgrRisks).values(
          risks.map((risk) => ({
            ...risk,
            pgr_id: pgrId,
            tenant_id: tenantId,
          })),
        );
      }

      if (actions.length > 0) {
        await tx.insert(pgrActions).values(
          actions.map((action) => ({
            ...action,
            pgr_id: pgrId,
            tenant_id: tenantId,
          })),
        );
      }

      return pgrId;
    });
  }

  async updatePgr(tenantId: string, payload: UpdatePgrPayload): Promise<string> {
    return db.transaction(async (tx) => {
      const { company, pgr, risks, actions, pgrId, companyId } = payload;

      const [companyRow] = await tx
        .update(companies)
        .set(company)
        .where(and(eq(companies.id, companyId), eq(companies.tenant_id, tenantId)))
        .returning({ id: companies.id });

      if (!companyRow) {
        throw new Error("Company not found for tenant");
      }

      const [pgrRow] = await tx
        .update(pgrs)
        .set({
          ...pgr,
          company_id: companyId,
          tenant_id: tenantId,
          updated_at: new Date().toISOString(),
        })
        .where(and(eq(pgrs.id, pgrId), eq(pgrs.tenant_id, tenantId)))
        .returning({ id: pgrs.id });

      if (!pgrRow) {
        throw new Error("PGR not found for tenant");
      }

      await tx
        .delete(pgrRisks)
        .where(and(eq(pgrRisks.pgr_id, pgrId), eq(pgrRisks.tenant_id, tenantId)));
      if (risks.length > 0) {
        await tx.insert(pgrRisks).values(
          risks.map((risk) => ({
            ...risk,
            pgr_id: pgrId,
            tenant_id: tenantId,
          })),
        );
      }

      await tx
        .delete(pgrActions)
        .where(and(eq(pgrActions.pgr_id, pgrId), eq(pgrActions.tenant_id, tenantId)));
      if (actions.length > 0) {
        await tx.insert(pgrActions).values(
          actions.map((action) => ({
            ...action,
            pgr_id: pgrId,
            tenant_id: tenantId,
          })),
        );
      }

      return pgrId;
    });
  }

  async deletePgr(
    tenantId: string,
    id: string,
    options: { deleteOrphanCompany?: boolean } = {},
  ): Promise<boolean> {
    return db.transaction(async (tx) => {
      const [targetPgr] = await tx
        .select({ id: pgrs.id, company_id: pgrs.company_id })
        .from(pgrs)
        .where(and(eq(pgrs.id, id), eq(pgrs.tenant_id, tenantId)));

      if (!targetPgr) {
        return false;
      }

      await tx
        .delete(pgrs)
        .where(and(eq(pgrs.id, id), eq(pgrs.tenant_id, tenantId)));

      if (!options.deleteOrphanCompany) {
        return true;
      }

      const companyId = targetPgr.company_id;
      const [remainingPgr] = await tx
        .select({ id: pgrs.id })
        .from(pgrs)
        .where(and(eq(pgrs.tenant_id, tenantId), eq(pgrs.company_id, companyId)))
        .limit(1);

      if (remainingPgr) {
        return true;
      }

      const [linkedTraining] = await tx
        .select({ id: trainings.id })
        .from(trainings)
        .where(and(eq(trainings.tenant_id, tenantId), eq(trainings.company_id, companyId)))
        .limit(1);

      if (linkedTraining) {
        return true;
      }

      await tx
        .delete(companies)
        .where(and(eq(companies.id, companyId), eq(companies.tenant_id, tenantId)));

      return true;
    });
  }

  async listTrainings(tenantId: string): Promise<Training[]> {
    return (await db
      .select()
      .from(trainings)
      .where(eq(trainings.tenant_id, tenantId))
      .orderBy(desc(trainings.created_at))) as Training[];
  }

  async getTraining(tenantId: string, id: string): Promise<Training | undefined> {
    const [row] = await db
      .select()
      .from(trainings)
      .where(and(eq(trainings.id, id), eq(trainings.tenant_id, tenantId)));
    return row as Training | undefined;
  }

  async createTraining(tenantId: string, data: InsertTraining): Promise<Training> {
    if (data.company_id) {
      const [companyRow] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(and(eq(companies.id, data.company_id), eq(companies.tenant_id, tenantId)));

      if (!companyRow) {
        throw new Error("Company not found for tenant");
      }
    }

    const [row] = await db
      .insert(trainings)
      .values({ ...data, tenant_id: tenantId })
      .returning();
    return row as Training;
  }

  async updateTraining(
    tenantId: string,
    id: string,
    data: UpdateTraining,
  ): Promise<Training | undefined> {
    if (data.company_id) {
      const [companyRow] = await db
        .select({ id: companies.id })
        .from(companies)
        .where(and(eq(companies.id, data.company_id), eq(companies.tenant_id, tenantId)));

      if (!companyRow) {
        throw new Error("Company not found for tenant");
      }
    }

    const [row] = await db
      .update(trainings)
      .set({ ...data, tenant_id: tenantId, updated_at: new Date().toISOString() })
      .where(and(eq(trainings.id, id), eq(trainings.tenant_id, tenantId)))
      .returning();
    return row as Training | undefined;
  }

  async deleteTraining(tenantId: string, id: string): Promise<boolean> {
    const result = await db
      .delete(trainings)
      .where(and(eq(trainings.id, id), eq(trainings.tenant_id, tenantId)))
      .returning({ id: trainings.id });
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
