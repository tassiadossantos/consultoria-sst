import { and, eq, lt, or } from "drizzle-orm";
import { jobLocks } from "@shared/schema";

type Database = (typeof import("../db"))["db"];

let cachedDb: Database | null = null;

async function resolveDb(): Promise<Database> {
  if (cachedDb) {
    return cachedDb;
  }

  const module = await import("../db");
  cachedDb = module.db;
  return cachedDb;
}

const DEFAULT_LEASE_TTL_SECONDS = 120;
const MIN_LEASE_TTL_SECONDS = 30;

function sanitizeLeaseTtlSeconds(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_LEASE_TTL_SECONDS;
  }

  const normalized = Math.floor(value);
  if (normalized < MIN_LEASE_TTL_SECONDS) {
    return MIN_LEASE_TTL_SECONDS;
  }
  return normalized;
}

function addSeconds(value: Date, seconds: number): Date {
  return new Date(value.getTime() + seconds * 1000);
}

export interface JobLeaseRepository {
  tryAcquire(
    jobName: string,
    owner: string,
    leaseTtlSeconds: number,
    now: Date,
  ): Promise<boolean>;
  release(jobName: string, owner: string, now: Date): Promise<void>;
}

export const databaseJobLeaseRepository: JobLeaseRepository = {
  async tryAcquire(
    jobName: string,
    owner: string,
    leaseTtlSeconds: number,
    now: Date,
  ): Promise<boolean> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    const ttlSeconds = sanitizeLeaseTtlSeconds(leaseTtlSeconds);
    const lockedUntilIso = addSeconds(now, ttlSeconds).toISOString();

    const inserted = await database
      .insert(jobLocks)
      .values({
        job_name: jobName,
        lock_owner: owner,
        locked_until: lockedUntilIso,
        updated_at: nowIso,
      })
      .onConflictDoNothing()
      .returning({ jobName: jobLocks.job_name });

    if (inserted.length > 0) {
      return true;
    }

    const updated = await database
      .update(jobLocks)
      .set({
        lock_owner: owner,
        locked_until: lockedUntilIso,
        updated_at: nowIso,
      })
      .where(
        and(
          eq(jobLocks.job_name, jobName),
          or(lt(jobLocks.locked_until, nowIso), eq(jobLocks.lock_owner, owner)),
        ),
      )
      .returning({ jobName: jobLocks.job_name });

    return updated.length > 0;
  },

  async release(jobName: string, owner: string, now: Date): Promise<void> {
    const database = await resolveDb();
    const nowIso = now.toISOString();
    await database
      .update(jobLocks)
      .set({
        locked_until: nowIso,
        updated_at: nowIso,
      })
      .where(and(eq(jobLocks.job_name, jobName), eq(jobLocks.lock_owner, owner)));
  },
};

export const noOpJobLeaseRepository: JobLeaseRepository = {
  tryAcquire: async () => true,
  release: async () => undefined,
};
