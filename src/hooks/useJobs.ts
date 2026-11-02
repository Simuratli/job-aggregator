import { useEffect, useState } from "react";
import { createJob, mergeByNewest } from "../lib/jobs";
import type { Job, JobsBatch, Provider } from "../types";

const JOBS_URL = "/api/jobs";
/** Batches requested at once; each one fetches ~100 company boards server-side */
const BATCH_CONCURRENCY = 6;
/** How often loaded batches are pushed into React state */
const FLUSH_INTERVAL_MS = 500;

export interface JobsProgress {
  boards: number;
  done: number;
  failed: number;
}

export interface JobsState {
  jobs: Job[];
  progress: JobsProgress;
  /** Boards that returned at least one job, per provider */
  activeBoards: Partial<Record<Provider, number>>;
  loading: boolean;
  error: string | null;
}

const INITIAL: JobsState = {
  jobs: [],
  progress: { boards: 0, done: 0, failed: 0 },
  activeBoards: {},
  loading: true,
  error: null,
};

const fetchBatch = async (batch: number, signal: AbortSignal, retries = 1): Promise<JobsBatch> => {
  const res = await fetch(`${JOBS_URL}?batch=${batch}`, { signal });
  if (res.ok) return res.json() as Promise<JobsBatch>;
  // A cold serverless call can time out; one retry usually lands on a warm instance or the CDN cache
  if (retries > 0 && res.status >= 500) return fetchBatch(batch, signal, retries - 1);
  throw new Error(`Could not load jobs (HTTP ${res.status})`);
};

/** Loads every company's live jobs batch by batch, merging results in as they arrive */
export const useJobs = () => {
  const [state, setState] = useState<JobsState>(INITIAL);

  useEffect(() => {
    const controller = new AbortController();
    const seenIds = new Set<string>();
    const activeBoards: Partial<Record<Provider, number>> = {};
    const progress: JobsProgress = { boards: 0, done: 0, failed: 0 };
    let pending: Job[] = [];

    const flush = (loading: boolean) => {
      const incoming = pending;
      pending = [];
      setState((prev) => ({
        ...prev,
        jobs: incoming.length ? mergeByNewest(prev.jobs, incoming) : prev.jobs,
        progress: { ...progress },
        activeBoards: { ...activeBoards },
        loading,
      }));
    };

    const apply = (batch: JobsBatch) => {
      progress.done += batch.boards;
      progress.failed += batch.failed;
      for (const [provider, count] of Object.entries(batch.active) as [Provider, number][]) {
        activeBoards[provider] = (activeBoards[provider] ?? 0) + count;
      }
      for (const raw of batch.jobs) {
        // A posting can be listed on two boards; ids are also the list keys
        if (seenIds.has(raw.id)) continue;
        seenIds.add(raw.id);
        pending.push(createJob(raw));
      }
    };

    const timer = setInterval(() => flush(true), FLUSH_INTERVAL_MS);

    const run = async () => {
      const first = await fetchBatch(0, controller.signal);
      progress.boards = first.totalBoards;
      apply(first);

      const queue = Array.from({ length: first.batches - 1 }, (_, index) => index + 1);
      let failedBatches = 0;
      await Promise.all(
        Array.from({ length: BATCH_CONCURRENCY }, async () => {
          for (let batch = queue.shift(); batch !== undefined; batch = queue.shift()) {
            try {
              apply(await fetchBatch(batch, controller.signal));
            } catch (error) {
              if (controller.signal.aborted) throw error;
              // Losing one batch shouldn't blank the page; count its boards as failed and move on
              failedBatches++;
              const boards = Math.min(first.boards, progress.boards - batch * first.boards);
              progress.done += boards;
              progress.failed += boards;
            }
          }
        }),
      );
      if (failedBatches) console.warn(`${failedBatches} job batches could not be loaded`);
    };

    run()
      .then(() => {
        clearInterval(timer);
        flush(false);
      })
      .catch((error: Error) => {
        clearInterval(timer);
        if (controller.signal.aborted) return;
        flush(false);
        setState((prev) => ({ ...prev, error: error.message }));
      });

    return () => {
      controller.abort();
      clearInterval(timer);
    };
  }, []);

  return state;
};
