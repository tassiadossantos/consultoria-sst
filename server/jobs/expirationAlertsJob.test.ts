// @vitest-environment node
import { describe, expect, it, vi } from "vitest";
import {
  buildExpirationAlertsForTenant,
  runExpirationAlertsJob,
  type ExpirationAlertsRepository,
} from "./expirationAlertsJob";

describe("buildExpirationAlertsForTenant", () => {
  const now = new Date("2026-02-19T12:00:00.000Z");

  it("returns alerts only for upcoming expirations in configured window", () => {
    const alerts = buildExpirationAlertsForTenant(
      {
        tenantId: "tenant-a",
        tenantName: "Tenant A",
        alertDays: 15,
      },
      [
        {
          id: "pgr-in-window",
          status: "active",
          validUntil: "2026-02-28",
          companyName: "Empresa A",
        },
        {
          id: "pgr-out-window",
          status: "active",
          validUntil: "2026-03-20",
          companyName: "Empresa A",
        },
        {
          id: "pgr-expired-status",
          status: "expired",
          validUntil: "2026-02-23",
          companyName: "Empresa A",
        },
      ],
      [
        {
          id: "tr-in-window",
          title: "NR-35",
          status: "agendado",
          trainingDate: "2026-02-25",
          companyName: "Empresa A",
        },
        {
          id: "tr-done",
          title: "NR-10",
          status: "realizado",
          trainingDate: "2026-02-22",
          companyName: "Empresa A",
        },
      ],
      now,
    );

    expect(alerts).toHaveLength(2);
    expect(alerts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "pgr",
          entityId: "pgr-in-window",
          daysUntilDue: 9,
        }),
        expect.objectContaining({
          type: "training",
          entityId: "tr-in-window",
          daysUntilDue: 6,
        }),
      ]),
    );
  });

  it("defaults alert window when invalid tenant alert_days is provided", () => {
    const alerts = buildExpirationAlertsForTenant(
      {
        tenantId: "tenant-a",
        tenantName: "Tenant A",
        alertDays: 0,
      },
      [
        {
          id: "pgr-default-window",
          status: "active",
          validUntil: "2026-03-01",
          companyName: null,
        },
      ],
      [],
      now,
    );

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toEqual(
      expect.objectContaining({
        entityId: "pgr-default-window",
        daysUntilDue: 10,
      }),
    );
  });
});

describe("runExpirationAlertsJob", () => {
  it("aggregates alerts from repository and emits log entries", async () => {
    const repository: ExpirationAlertsRepository = {
      listTenantAlertConfigs: vi.fn().mockResolvedValue([
        {
          tenantId: "tenant-a",
          tenantName: "Tenant A",
          alertDays: 15,
        },
      ]),
      listTenantPgrDueRecords: vi.fn().mockResolvedValue([
        {
          id: "pgr-1",
          status: "active",
          validUntil: "2026-02-28",
          companyName: "Empresa A",
        },
      ]),
      listTenantTrainingDueRecords: vi.fn().mockResolvedValue([
        {
          id: "tr-1",
          title: "NR-12",
          status: "agendado",
          trainingDate: "2026-02-26",
          companyName: "Empresa A",
        },
      ]),
    };

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const result = await runExpirationAlertsJob({
      repository,
      logger,
      now: new Date("2026-02-19T10:00:00.000Z"),
    });

    expect(result.tenantsEvaluated).toBe(1);
    expect(result.alerts).toHaveLength(2);
    expect(logger.warn).toHaveBeenCalledTimes(2);
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("completed with 2 alert(s)"),
    );
  });

  it("logs no-op when no alerts are found", async () => {
    const repository: ExpirationAlertsRepository = {
      listTenantAlertConfigs: vi.fn().mockResolvedValue([
        {
          tenantId: "tenant-a",
          tenantName: "Tenant A",
          alertDays: 7,
        },
      ]),
      listTenantPgrDueRecords: vi.fn().mockResolvedValue([]),
      listTenantTrainingDueRecords: vi.fn().mockResolvedValue([]),
    };

    const logger = {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    const result = await runExpirationAlertsJob({
      repository,
      logger,
      now: new Date("2026-02-19T10:00:00.000Z"),
    });

    expect(result.alerts).toHaveLength(0);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("no pending expirations"),
    );
  });
});
