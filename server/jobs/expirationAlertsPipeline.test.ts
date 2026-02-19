// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import * as dispatchModule from "./alertChannels";
import * as expirationJobModule from "./expirationAlertsJob";
import { runExpirationAlertsPipeline } from "./expirationAlertsPipeline";

describe("runExpirationAlertsPipeline", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("skips execution when lease is not acquired", async () => {
    const tryAcquire = vi.fn().mockResolvedValue(false);
    const release = vi.fn();

    const runJobSpy = vi.spyOn(expirationJobModule, "runExpirationAlertsJob");
    const dispatchSpy = vi.spyOn(dispatchModule, "dispatchExpirationAlerts");

    const result = await runExpirationAlertsPipeline({
      correlationId: "corr-lock-skip",
      leaseRepository: {
        tryAcquire,
        release,
      },
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
      now: new Date("2026-02-19T12:00:00.000Z"),
    });

    expect(result).toBeNull();
    expect(runJobSpy).not.toHaveBeenCalled();
    expect(dispatchSpy).not.toHaveBeenCalled();
    expect(release).not.toHaveBeenCalled();
  });

  it("runs job + dispatch and releases lease when acquired", async () => {
    const tryAcquire = vi.fn().mockResolvedValue(true);
    const release = vi.fn().mockResolvedValue(undefined);
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const runJobSpy = vi
      .spyOn(expirationJobModule, "runExpirationAlertsJob")
      .mockResolvedValue({
        correlationId: "corr-lock-run",
        executedAt: "2026-02-19T12:00:00.000Z",
        tenantsEvaluated: 1,
        alerts: [],
      });
    const dispatchSpy = vi
      .spyOn(dispatchModule, "dispatchExpirationAlerts")
      .mockResolvedValue({
        correlationId: "corr-lock-run",
        attemptedChannels: [],
        deliveredChannels: [],
        failedChannels: [],
        skippedChannels: ["webhook", "email", "whatsapp"],
        metrics: {
          queued: 0,
          deduplicated: 0,
          staleRecovered: 0,
          attempted: 0,
          delivered: 0,
          failed: 0,
          retried: 0,
          rateLimited: 0,
        },
      });

    const result = await runExpirationAlertsPipeline({
      correlationId: "corr-lock-run",
      instanceId: "instance-a",
      leaseRepository: {
        tryAcquire,
        release,
      },
      logger,
      now: new Date("2026-02-19T12:00:00.000Z"),
    });

    expect(result).not.toBeNull();
    expect(runJobSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: "corr-lock-run",
      }),
    );
    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        correlationId: "corr-lock-run",
      }),
      expect.objectContaining({
        correlationId: "corr-lock-run",
        instanceId: "instance-a",
      }),
    );
    expect(release).toHaveBeenCalledWith(
      "expiration-alerts",
      "instance-a",
      expect.any(Date),
    );
  });
});
