import { useEffect, useState } from "react";
import { createJob, mergeByNewest } from "../lib/jobs";
import type { Job, JobsStreamMessage, Provider } from "../types";

const STREAM_URL = "/api/jobs/stream";
/** How often streamed boards are pushed into React state */
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

/** Reads newline-delimited JSON from a streamed response body, one message at a time */
async function* readLines(body: ReadableStream<BufferSource>) {
  const reader = body.pipeThrough(new TextDecoderStream()).getReader();
  let pending = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += value;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) if (line) yield JSON.parse(line) as JobsStreamMessage;
  }
}

/** Streams every board's jobs from the server as they are fetched live, batching renders */
export const useJobs = () => {
  const [state, setState] = useState<JobsState>(INITIAL);

  useEffect(() => {
    const controller = new AbortController();
    const seenIds = new Set<string>();
    const activeBoards: Partial<Record<Provider, number>> = {};
    const progress: JobsProgress = { boards: 0, done: 0, failed: 0 };
    let batch: Job[] = [];

    const flush = (loading: boolean) => {
      const incoming = batch;
      batch = [];
      setState((prev) => ({
        ...prev,
        jobs: incoming.length ? mergeByNewest(prev.jobs, incoming) : prev.jobs,
        progress: { ...progress },
        activeBoards: { ...activeBoards },
        loading,
      }));
    };

    const timer = setInterval(() => flush(true), FLUSH_INTERVAL_MS);

    const run = async () => {
      const res = await fetch(STREAM_URL, { signal: controller.signal });
      if (!res.ok || !res.body) throw new Error(`Could not load jobs (HTTP ${res.status})`);

      for await (const message of readLines(res.body)) {
        if (message.type === "start") progress.boards = message.boards;
        if (message.type === "failed") {
          progress.done++;
          progress.failed++;
        }
        if (message.type === "board") {
          progress.done++;
          activeBoards[message.provider] = (activeBoards[message.provider] ?? 0) + 1;
          for (const raw of message.jobs) {
            // A posting can be listed on two boards; ids are also the list keys
            if (seenIds.has(raw.id)) continue;
            seenIds.add(raw.id);
            batch.push(createJob(raw));
          }
        }
      }
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
