// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  dispatchExpirationAlerts,
  type AlertDispatchRepository,
} from "./alertChannels";
import type { ExpirationAlertJobResult } from "./expirationAlertsJob";

type StoredDispatchStatus = "pending" | "processing" | "sent" | "failed";

type StoredDispatch = {
  id: string;
  tenantId: string;
  tenantName: string;
  channel: "webhook" | "email" | "whatsapp";
  recipient: string;
  dedupeKey: string;
  alertType: string;
  entityId: string;
  title: string;
  companyName: string | null;
  dueDate: string;
  attempts: number;
  maxAttempts: number;
  backoffBaseSeconds: number;
  nextAttemptAt: string;
  status: StoredDispatchStatus;
  processingBy: string | null;
  processingStartedAt: string | null;
  lastError: string | null;
};

class InMemoryAlertDispatchRepository implements AlertDispatchRepository {
  private readonly channelRecords: any[];
  private readonly dispatches: StoredDispatch[] = [];
  private sequence = 0;
  public readonly metricRecords: any[] = [];

  constructor(channelRecords: any[]) {
    this.channelRecords = channelRecords;
  }

  getAllDispatches(): StoredDispatch[] {
    return this.dispatches.map((row) => ({ ...row }));
  }

  async listTenantChannelRecords(tenantIds: string[]): Promise<any[]> {
    const allowed = new Set(tenantIds);
    return this.channelRecords.filter((row) => allowed.has(row.tenantId));
  }

  async enqueueDispatches(
    candidates: any[],
    now: Date,
  ): Promise<{ queued: number; deduplicated: number }> {
    let queued = 0;
    let deduplicated = 0;

    for (const candidate of candidates) {
      const exists = this.dispatches.some(
        (row) => row.dedupeKey === candidate.dedupeKey,
      );
      if (exists) {
        deduplicated += 1;
        continue;
      }

      this.sequence += 1;
      this.dispatches.push({
        id: `dispatch-${this.sequence}`,
        tenantId: candidate.tenantId,
        tenantName: candidate.tenantName,
        channel: candidate.channel,
        recipient: candidate.recipient,
        dedupeKey: candidate.dedupeKey,
        alertType: candidate.alertType,
        entityId: candidate.entityId,
        title: candidate.title,
        companyName: candidate.companyName,
        dueDate: candidate.dueDate,
        attempts: 0,
        maxAttempts: candidate.maxAttempts,
        backoffBaseSeconds: candidate.backoffBaseSeconds,
        nextAttemptAt: now.toISOString(),
        status: "pending",
        processingBy: null,
        processingStartedAt: null,
        lastError: null,
      });
      queued += 1;
    }

    return { queued, deduplicated };
  }

  async recoverStaleProcessing(now: Date, staleBefore: Date): Promise<number> {
    const staleBeforeIso = staleBefore.toISOString();
    let recovered = 0;
    for (const row of this.dispatches) {
      if (row.status !== "processing") continue;
      if (!row.processingStartedAt || row.processingStartedAt < staleBeforeIso) {
        row.status = "pending";
        row.processingBy = null;
        row.processingStartedAt = null;
        row.nextAttemptAt = now.toISOString();
        recovered += 1;
      }
    }
    return recovered;
  }

  async listDueDispatches(
    channel: "webhook" | "email" | "whatsapp",
    now: Date,
    limit: number,
  ): Promise<any[]> {
    const nowIso = now.toISOString();
    return this.dispatches
      .filter(
        (row) =>
          row.channel === channel &&
          row.status === "pending" &&
          row.nextAttemptAt <= nowIso,
      )
      .sort((a, b) => a.nextAttemptAt.localeCompare(b.nextAttemptAt))
      .slice(0, limit)
      .map((row) => this.toQueueRow(row));
  }

  async claimDispatch(
    id: string,
    now: Date,
    instanceId: string,
    _correlationId: string,
  ): Promise<any | null> {
    const nowIso = now.toISOString();
    const row = this.dispatches.find(
      (entry) =>
        entry.id === id &&
        entry.status === "pending" &&
        entry.nextAttemptAt <= nowIso,
    );
    if (!row) {
      return null;
    }

    row.status = "processing";
    row.processingBy = instanceId;
    row.processingStartedAt = nowIso;
    return this.toQueueRow(row);
  }

  async markDispatchSent(
    id: string,
    _now: Date,
    instanceId: string,
    _correlationId: string,
  ): Promise<void> {
    const row = this.dispatches.find(
      (entry) =>
        entry.id === id &&
        entry.status === "processing" &&
        entry.processingBy === instanceId,
    );
    if (!row) return;
    row.status = "sent";
    row.attempts += 1;
    row.processingBy = null;
    row.processingStartedAt = null;
    row.lastError = null;
  }

  async markDispatchRetry(
    id: string,
    _now: Date,
    nextAttemptAt: Date,
    error: string,
    instanceId: string,
    _correlationId: string,
  ): Promise<void> {
    const row = this.dispatches.find(
      (entry) =>
        entry.id === id &&
        entry.status === "processing" &&
        entry.processingBy === instanceId,
    );
    if (!row) return;
    row.status = "pending";
    row.attempts += 1;
    row.nextAttemptAt = nextAttemptAt.toISOString();
    row.processingBy = null;
    row.processingStartedAt = null;
    row.lastError = error;
  }

  async markDispatchFailed(
    id: string,
    _now: Date,
    error: string,
    instanceId: string,
    _correlationId: string,
  ): Promise<void> {
    const row = this.dispatches.find(
      (entry) =>
        entry.id === id &&
        entry.status === "processing" &&
        entry.processingBy === instanceId,
    );
    if (!row) return;
    row.status = "failed";
    row.attempts += 1;
    row.processingBy = null;
    row.processingStartedAt = null;
    row.lastError = error;
  }

  async recordRunMetrics(record: any): Promise<void> {
    this.metricRecords.push(record);
  }

  private toQueueRow(row: StoredDispatch): any {
    return {
      id: row.id,
      tenantId: row.tenantId,
      tenantName: row.tenantName,
      channel: row.channel,
      recipient: row.recipient,
      alertType: row.alertType,
      entityId: row.entityId,
      title: row.title,
      companyName: row.companyName,
      dueDate: row.dueDate,
      attempts: row.attempts,
      maxAttempts: row.maxAttempts,
      backoffBaseSeconds: row.backoffBaseSeconds,
    };
  }
}

function createJobResult(overrides: Partial<ExpirationAlertJobResult> = {}): ExpirationAlertJobResult {
  return {
    correlationId: "corr-001",
    executedAt: "2026-02-19T12:00:00.000Z",
    tenantsEvaluated: 1,
    alerts: [
      {
        type: "pgr",
        tenantId: "tenant-a",
        tenantName: "Tenant A",
        entityId: "pgr-1",
        title: "PGR pgr-1",
        companyName: "Empresa A",
        dueDate: "2026-02-25",
        daysUntilDue: 6,
      },
    ],
    ...overrides,
  };
}

describe("dispatchExpirationAlerts", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("deduplicates re-enqueue across cycles and sends only once", async () => {
    const repository = new InMemoryAlertDispatchRepository([
      {
        tenantId: "tenant-a",
        channel: "webhook",
        enabled: true,
        config: { urls: ["https://example.test/hook"] },
        maxRetries: 3,
        maxPerRun: 10,
        backoffBaseSeconds: 60,
      },
    ]);

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));

    const first = await dispatchExpirationAlerts(createJobResult(), {
      repository,
      correlationId: "corr-first",
      now: new Date("2026-02-19T10:00:00.000Z"),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });
    const second = await dispatchExpirationAlerts(createJobResult(), {
      repository,
      correlationId: "corr-second",
      now: new Date("2026-02-19T10:05:00.000Z"),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(first.metrics.queued).toBe(1);
    expect(first.metrics.delivered).toBe(1);
    expect(second.metrics.queued).toBe(0);
    expect(second.metrics.deduplicated).toBe(1);
    expect(second.metrics.attempted).toBe(0);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(repository.metricRecords).toHaveLength(2);
    expect(repository.metricRecords[0].correlationId).toBe("corr-first");
    expect(repository.metricRecords[1].correlationId).toBe("corr-second");
  });

  it("retries with backoff and succeeds in a later cycle", async () => {
    const repository = new InMemoryAlertDispatchRepository([
      {
        tenantId: "tenant-a",
        channel: "email",
        enabled: true,
        config: {
          provider: "resend",
          apiKey: "resend-key",
          from: "SST <alerts@example.com>",
          to: ["ops@example.com"],
        },
        maxRetries: 3,
        maxPerRun: 10,
        backoffBaseSeconds: 60,
      },
    ]);

    const fetchSpy = vi.spyOn(globalThis, "fetch");
    fetchSpy
      .mockResolvedValueOnce(new Response("fail", { status: 500 }))
      .mockResolvedValueOnce(new Response("", { status: 200 }));

    const firstNow = new Date("2026-02-19T10:00:00.000Z");
    const first = await dispatchExpirationAlerts(createJobResult(), {
      repository,
      correlationId: "corr-retry-1",
      now: firstNow,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    const second = await dispatchExpirationAlerts(createJobResult(), {
      repository,
      correlationId: "corr-retry-2",
      now: new Date(firstNow.getTime() + 61_000),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(first.metrics.attempted).toBe(1);
    expect(first.metrics.retried).toBe(1);
    expect(first.metrics.delivered).toBe(0);

    expect(second.metrics.attempted).toBe(1);
    expect(second.metrics.delivered).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);

    const rows = repository.getAllDispatches();
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("sent");
    expect(rows[0].attempts).toBe(2);
  });

  it("applies per-channel per-tenant limit in each run", async () => {
    const repository = new InMemoryAlertDispatchRepository([
      {
        tenantId: "tenant-a",
        channel: "webhook",
        enabled: true,
        config: { urls: ["https://example.test/hook"] },
        maxRetries: 3,
        maxPerRun: 1,
        backoffBaseSeconds: 60,
      },
    ]);

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response("", { status: 200 }));

    const resultWithTwoAlerts = createJobResult({
      alerts: [
        {
          type: "pgr",
          tenantId: "tenant-a",
          tenantName: "Tenant A",
          entityId: "pgr-1",
          title: "PGR pgr-1",
          companyName: "Empresa A",
          dueDate: "2026-02-25",
          daysUntilDue: 6,
        },
        {
          type: "training",
          tenantId: "tenant-a",
          tenantName: "Tenant A",
          entityId: "training-1",
          title: "NR-35",
          companyName: "Empresa A",
          dueDate: "2026-02-26",
          daysUntilDue: 7,
        },
      ],
    });

    const first = await dispatchExpirationAlerts(resultWithTwoAlerts, {
      repository,
      correlationId: "corr-limit-1",
      now: new Date("2026-02-19T10:00:00.000Z"),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    const second = await dispatchExpirationAlerts(resultWithTwoAlerts, {
      repository,
      correlationId: "corr-limit-2",
      now: new Date("2026-02-19T10:10:00.000Z"),
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    expect(first.metrics.queued).toBe(2);
    expect(first.metrics.delivered).toBe(1);
    expect(first.metrics.rateLimited).toBe(1);

    expect(second.metrics.queued).toBe(0);
    expect(second.metrics.deduplicated).toBe(2);
    expect(second.metrics.delivered).toBe(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("returns only skipped channels when there is nothing to enqueue or dispatch", async () => {
    const repository = new InMemoryAlertDispatchRepository([]);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    const report = await dispatchExpirationAlerts(
      createJobResult({ alerts: [] }),
      {
        repository,
        correlationId: "corr-empty",
        now: new Date("2026-02-19T10:00:00.000Z"),
        logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      },
    );

    expect(report.attemptedChannels).toEqual([]);
    expect(report.skippedChannels).toEqual(["webhook", "email", "whatsapp"]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
