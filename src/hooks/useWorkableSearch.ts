import { useEffect, useState } from "react";
import { createJob } from "../lib/jobs";
import type { Job, JobFilters, WorkableSearchResult } from "../types";

const SEARCH_URL = "/api/workable/search";
const DEBOUNCE_MS = 400;

export interface WorkableSearchState {
  jobs: Job[];
  /** Total Workable matches for the current search; only the first pages are in `jobs` */
  total: number;
  loading: boolean;
}

/**
 * Workable is searched live for whatever the user typed, rather than loaded board by board:
 * its public search covers every Workable company, which no company list could.
 */
export const useWorkableSearch = (filters: Pick<JobFilters, "query" | "location" | "workplace">, enabled: boolean) => {
  const [state, setState] = useState<WorkableSearchState>({ jobs: [], total: 0, loading: enabled });
  const { query, location, workplace } = filters;

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();

    const timer = setTimeout(async () => {
      setState((prev) => ({ ...prev, loading: true }));
      const params = new URLSearchParams({ query: query.trim(), location: location.trim() });
      if (workplace !== "all" && workplace !== "unknown") params.set("workplace", workplace);

      try {
        const res = await fetch(`${SEARCH_URL}?${params}`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const result = (await res.json()) as WorkableSearchResult;
        setState({ jobs: result.jobs.map(createJob), total: result.total, loading: false });
      } catch {
        if (!controller.signal.aborted) setState({ jobs: [], total: 0, loading: false });
      }
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, location, workplace, enabled]);

  return state;
};
