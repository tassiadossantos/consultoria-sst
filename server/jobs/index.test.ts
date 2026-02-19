// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startScheduledJobs } from "./index";

describe("startScheduledJobs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("runs on start and then at configured interval", async () => {
    const runExpirationAlerts = vi.fn().mockResolvedValue({
      correlationId: "corr-1",
      executedAt: new Date().toISOString(),
      tenantsEvaluated: 0,
      alerts: [],
    });

    const handle = startScheduledJobs({
      enabled: true,
      runOnStart: true,
      intervalMs: 1_000,
      runExpirationAlerts,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    await vi.runAllTicks();
    expect(runExpirationAlerts).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(3_000);
    expect(runExpirationAlerts).toHaveBeenCalledTimes(4);

    handle.stop();
  });

  it("does not schedule when disabled", async () => {
    const runExpirationAlerts = vi.fn();

    const handle = startScheduledJobs({
      enabled: false,
      runExpirationAlerts,
      logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
    });

    await vi.advanceTimersByTimeAsync(10_000);
    expect(runExpirationAlerts).not.toHaveBeenCalled();

    const runNowResult = await handle.runNow();
    expect(runNowResult).toBeNull();
  });

  it("skips overlapping executions", async () => {
    let resolveRun: (() => void) | null = null;
    const runExpirationAlerts = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveRun = () => resolve({
            correlationId: "corr-overlap",
            executedAt: new Date().toISOString(),
            tenantsEvaluated: 0,
            alerts: [],
          });
        }),
    );
    const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

    const handle = startScheduledJobs({
      enabled: true,
      runOnStart: true,
      intervalMs: 1_000,
      runExpirationAlerts,
      logger,
    });

    await vi.runAllTicks();
    expect(runExpirationAlerts).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1_000);
    expect(runExpirationAlerts).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining("skipped run because previous execution"),
    );

    resolveRun?.();
    await vi.runAllTicks();

    await vi.advanceTimersByTimeAsync(1_000);
    expect(runExpirationAlerts).toHaveBeenCalledTimes(2);

    handle.stop();
  });
});
