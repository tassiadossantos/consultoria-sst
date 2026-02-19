import {
  type ExpirationAlertJobResult,
} from "./expirationAlertsJob";
import { runExpirationAlertsPipeline } from "./expirationAlertsPipeline";

type JobLogger = Pick<Console, "info" | "warn" | "error">;

type RunExpirationAlertsFn = () => Promise<ExpirationAlertJobResult | null>;

export type ScheduledJobsHandle = {
  stop: () => void;
  runNow: () => Promise<ExpirationAlertJobResult | null>;
};

type StartScheduledJobsOptions = {
  enabled?: boolean;
  runOnStart?: boolean;
  intervalMs?: number;
  logger?: JobLogger;
  runExpirationAlerts?: RunExpirationAlertsFn;
};

const DEFAULT_INTERVAL_MS = 30 * 60 * 1000;
const MIN_INTERVAL_MS = 60 * 1000;

function resolveEnabled(value?: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return process.env.EXPIRATION_ALERTS_ENABLED !== "false";
}

function resolveRunOnStart(value?: boolean): boolean {
  if (typeof value === "boolean") {
    return value;
  }
  return process.env.EXPIRATION_ALERTS_RUN_ON_START !== "false";
}

function resolveIntervalMs(value?: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  const envMinutes = Number(process.env.EXPIRATION_ALERTS_INTERVAL_MINUTES);
  if (Number.isFinite(envMinutes) && envMinutes > 0) {
    return Math.max(Math.floor(envMinutes * 60 * 1000), MIN_INTERVAL_MS);
  }

  return DEFAULT_INTERVAL_MS;
}

export function startScheduledJobs(options: StartScheduledJobsOptions = {}): ScheduledJobsHandle {
  const logger = options.logger ?? console;
  const enabled = resolveEnabled(options.enabled);
  const runOnStart = resolveRunOnStart(options.runOnStart);
  const intervalMs = resolveIntervalMs(options.intervalMs);
  const runExpirationAlerts =
    options.runExpirationAlerts ??
    (async () => runExpirationAlertsPipeline({ logger }));

  if (!enabled) {
    logger.info("[JOB][scheduler] automated jobs are disabled");
    return {
      stop: () => undefined,
      runNow: async () => null,
    };
  }

  let isRunning = false;
  let stopped = false;

  const runSafe = async (): Promise<ExpirationAlertJobResult | null> => {
    if (stopped) {
      return null;
    }

    if (isRunning) {
      logger.warn("[JOB][scheduler] skipped run because previous execution is still in progress");
      return null;
    }

    isRunning = true;
    try {
      return await runExpirationAlerts();
    } catch (error) {
      logger.error(`[JOB][scheduler] expiration alerts job failed: ${String(error)}`);
      return null;
    } finally {
      isRunning = false;
    }
  };

  logger.info(
    `[JOB][scheduler] expiration alerts scheduler started (interval_ms=${intervalMs}, run_on_start=${runOnStart})`,
  );

  if (runOnStart) {
    void runSafe();
  }

  const timer = setInterval(() => {
    void runSafe();
  }, intervalMs);
  timer.unref?.();

  return {
    stop: () => {
      if (stopped) {
        return;
      }
      stopped = true;
      clearInterval(timer);
      logger.info("[JOB][scheduler] automated jobs stopped");
    },
    runNow: runSafe,
  };
}
