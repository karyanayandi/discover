import type { Result } from "better-result"
import { Result as R } from "better-result"
import { Cron } from "croner"
import { eq } from "drizzle-orm"
import { db } from "@/lib/db/client"
import { appConfigTable } from "@/lib/db/schemas"
import { logger } from "@/lib/logger"
import { runPipeline } from "@/lib/pipeline/orchestrator"
import { SchedulerError } from "./errors"

const CONFIG_KEY_ENABLED = "pipeline_scheduler_enabled"
const CONFIG_KEY_CRON = "pipeline_scheduler_cron"
const DEFAULT_CRON = "0 * * * *"

interface SchedulerState {
  enabled: boolean
  cronPattern: string
  running: boolean
  job: Cron | null
  lastRunAt: Date | null
  lastRunResult: "success" | "error" | null
  lastRunError: string | null
}

const state: SchedulerState = {
  enabled: false,
  cronPattern: DEFAULT_CRON,
  running: false,
  job: null,
  lastRunAt: null,
  lastRunResult: null,
  lastRunError: null,
}

async function executePipeline(): Promise<void> {
  if (state.running) {
    logger.warn("Scheduler: pipeline already running, skipping")
    return
  }

  state.running = true
  logger.info("Scheduler: starting pipeline run")

  const result = await R.tryPromise({
    try: () => runPipeline(),
    catch: (e) =>
      new SchedulerError({
        message: `Unexpected pipeline error: ${e instanceof Error ? e.message : String(e)}`,
        cause: e,
      }),
  })

  state.lastRunAt = new Date()
  state.running = false

  if (R.isError(result)) {
    state.lastRunResult = "error"
    state.lastRunError = result.error.message
    logger.error(`Scheduler: pipeline failed — ${result.error.message}`)
    return
  }

  const pipelineResult = result.value
  if (R.isError(pipelineResult)) {
    state.lastRunResult = "error"
    state.lastRunError = pipelineResult.error.message
    logger.error(`Scheduler: pipeline error — ${pipelineResult.error.message}`)
    return
  }

  state.lastRunResult = "success"
  state.lastRunError = null
  logger.info(
    `Scheduler: pipeline completed — ${pipelineResult.value.articlesCreated} articles created`,
  )
}

function stopJob(): void {
  if (state.job) {
    state.job.stop()
    state.job = null
  }
}

function createJob(immediate: boolean): void {
  stopJob()

  state.job = new Cron(
    state.cronPattern,
    {
      protect: true,
      catch: (err) => {
        logger.error(
          `Scheduler: cron error — ${err instanceof Error ? err.message : String(err)}`,
        )
      },
    },
    () => executePipeline(),
  )

  if (immediate) {
    void executePipeline()
  }

  const next = state.job.nextRun()
  logger.info(
    `Scheduler: job created — pattern="${state.cronPattern}", immediate=${immediate}, next=${next?.toISOString() ?? "none"}`,
  )
}

function persistConfig(): Promise<Result<void, SchedulerError>> {
  return R.gen(async function* () {
    yield* R.await(
      R.tryPromise({
        try: () =>
          db
            .insert(appConfigTable)
            .values({
              key: CONFIG_KEY_ENABLED,
              value: state.enabled ? "true" : "false",
            })
            .onConflictDoUpdate({
              target: appConfigTable.key,
              set: { value: state.enabled ? "true" : "false" },
            }),
        catch: (e) =>
          new SchedulerError({
            message: "Failed to persist scheduler enabled config",
            cause: e,
          }),
      }),
    )

    yield* R.await(
      R.tryPromise({
        try: () =>
          db
            .insert(appConfigTable)
            .values({
              key: CONFIG_KEY_CRON,
              value: state.cronPattern,
            })
            .onConflictDoUpdate({
              target: appConfigTable.key,
              set: { value: state.cronPattern },
            }),
        catch: (e) =>
          new SchedulerError({
            message: "Failed to persist scheduler cron config",
            cause: e,
          }),
      }),
    )

    return R.ok(undefined)
  })
}

function loadConfig(): Promise<Result<void, SchedulerError>> {
  return R.gen(async function* () {
    const enabledRow = yield* R.await(
      R.tryPromise({
        try: () =>
          db.query.appConfigTable.findFirst({
            where: eq(appConfigTable.key, CONFIG_KEY_ENABLED),
          }),
        catch: (e) =>
          new SchedulerError({
            message: "Failed to load scheduler enabled config",
            cause: e,
          }),
      }),
    )

    const cronRow = yield* R.await(
      R.tryPromise({
        try: () =>
          db.query.appConfigTable.findFirst({
            where: eq(appConfigTable.key, CONFIG_KEY_CRON),
          }),
        catch: (e) =>
          new SchedulerError({
            message: "Failed to load scheduler cron config",
            cause: e,
          }),
      }),
    )

    state.enabled = enabledRow?.value === "true"
    state.cronPattern = cronRow?.value ?? DEFAULT_CRON

    return R.ok(undefined)
  })
}

export function isValidCron(pattern: string): Result<true, SchedulerError> {
  return R.try({
    try: () => {
      const test = new Cron(pattern, { paused: true }, () => undefined)
      test.stop()
      return true as const
    },
    catch: (e) =>
      new SchedulerError({
        message: `Invalid cron pattern: "${pattern}"`,
        cause: e,
      }),
  })
}

export async function initScheduler(): Promise<void> {
  const result = await loadConfig()

  if (R.isError(result)) {
    logger.error(`Scheduler: failed to load config — ${result.error.message}`)
    return
  }

  if (state.enabled) {
    createJob(false)
  }

  logger.info(
    `Scheduler: initialized — enabled=${state.enabled}, cron="${state.cronPattern}"`,
  )
}

export async function enableScheduler(
  cronPattern?: string,
): Promise<Result<void, SchedulerError>> {
  if (cronPattern !== undefined) {
    const validation = isValidCron(cronPattern)
    if (R.isError(validation)) {
      return validation
    }
    state.cronPattern = cronPattern
  }

  state.enabled = true
  createJob(true)

  const persistResult = await persistConfig()
  if (R.isError(persistResult)) {
    logger.error(
      `Scheduler: enabled but failed to persist — ${persistResult.error.message}`,
    )
    return persistResult
  }

  logger.info(`Scheduler: enabled — cron="${state.cronPattern}"`)
  return R.ok(undefined)
}

export async function disableScheduler(): Promise<
  Result<void, SchedulerError>
> {
  state.enabled = false
  stopJob()

  const persistResult = await persistConfig()
  if (R.isError(persistResult)) {
    logger.error(
      `Scheduler: disabled but failed to persist — ${persistResult.error.message}`,
    )
    return persistResult
  }

  logger.info("Scheduler: disabled")
  return R.ok(undefined)
}

export async function updateSchedule(
  cronPattern: string,
): Promise<Result<void, SchedulerError>> {
  const validation = isValidCron(cronPattern)
  if (R.isError(validation)) {
    return validation
  }

  state.cronPattern = cronPattern
  if (state.enabled) {
    createJob(false)
  }

  const persistResult = await persistConfig()
  if (R.isError(persistResult)) {
    logger.error(
      `Scheduler: schedule updated but failed to persist — ${persistResult.error.message}`,
    )
    return persistResult
  }

  logger.info(`Scheduler: schedule updated — cron="${cronPattern}"`)
  return R.ok(undefined)
}

export interface SchedulerStatus {
  enabled: boolean
  cronPattern: string
  running: boolean
  nextRunAt: string | null
  lastRunAt: string | null
  lastRunResult: "success" | "error" | null
  lastRunError: string | null
}

export function getSchedulerStatus(): SchedulerStatus {
  return {
    enabled: state.enabled,
    cronPattern: state.cronPattern,
    running: state.running,
    nextRunAt: state.job?.nextRun()?.toISOString() ?? null,
    lastRunAt: state.lastRunAt?.toISOString() ?? null,
    lastRunResult: state.lastRunResult,
    lastRunError: state.lastRunError,
  }
}
