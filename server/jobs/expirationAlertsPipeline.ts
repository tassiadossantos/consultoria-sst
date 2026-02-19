import { randomUUID } from "crypto";
import { dispatchExpirationAlerts } from "./alertChannels";
import {
  runExpirationAlertsJob,
  type ExpirationAlertJobResult,
} from "./expirationAlertsJob";
import {
  databaseJobLeaseRepository,
  type JobLeaseRepository,
} from "./jobLease";

type JobLogger = Pick<Console, "info" | "warn" | "error">;

const JOB_NAME = "expiration-alerts";
const DEFAULT_LOCK_TTL_SECONDS = 120;

function resolveInstanceId(): string {
  const host = process.env.HOSTNAME ?? process.env.COMPUTERNAME ?? "local";
  return `${host}:${process.pid}`;
}

function resolveLockTtlSeconds(value?: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }

  const envTtl = Number(process.env.EXPIRATION_ALERTS_LOCK_TTL_SECONDS);
  if (Number.isFinite(envTtl) && envTtl > 0) {
    return Math.floor(envTtl);
  }

  return DEFAULT_LOCK_TTL_SECONDS;
}

export type RunExpirationAlertsPipelineOptions = {
  logger?: JobLogger;
  now?: Date;
  correlationId?: string;
  instanceId?: string;
  lockTtlSeconds?: number;
  leaseRepository?: JobLeaseRepository;
};

export async function runExpirationAlertsPipeline(
  options: RunExpirationAlertsPipelineOptions = {},
): Promise<ExpirationAlertJobResult | null> {
  const logger = options.logger ?? console;
  const now = options.now ?? new Date();
  const correlationId = options.correlationId ?? randomUUID();
  const instanceId = options.instanceId ?? resolveInstanceId();
  const lockTtlSeconds = resolveLockTtlSeconds(options.lockTtlSeconds);
  const leaseRepository = options.leaseRepository ?? databaseJobLeaseRepository;

  const acquired = await leaseRepository.tryAcquire(
    JOB_NAME,
    instanceId,
    lockTtlSeconds,
    now,
  );

  if (!acquired) {
    logger.info(
      `[JOB][scheduler] correlation_id=${correlationId} skipped expiration alerts run because another instance holds the lease`,
    );
    return null;
  }

  try {
    const result = await runExpirationAlertsJob({
      logger,
      now,
      correlationId,
    });
    await dispatchExpirationAlerts(result, {
      logger,
      correlationId,
      instanceId,
      now,
    });
    return result;
  } finally {
    try {
      await leaseRepository.release(JOB_NAME, instanceId, new Date());
    } catch (error) {
      logger.warn(
        `[JOB][scheduler] correlation_id=${correlationId} failed to release lease: ${String(error)}`,
      );
    }
  }
}
