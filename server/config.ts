import type { Provider } from "../src/types";

export const PATHS = {
  companies: new URL("../public/data/companies.json", import.meta.url),
  lastRoundDirectory: new URL("../data/sources/lastround-ats-directory-2026-08.csv", import.meta.url),
};

export const REQUEST_TIMEOUT_MS = 20_000;
export const MAX_RETRIES = 2;
export const RETRY_BASE_DELAY_MS = 1_000;

/** How long a board's jobs are kept in the server's memory before being fetched again */
export const BOARD_CACHE_TTL_MS = 30 * 60 * 1000;

/** Parallel requests per host; providers run side by side, so total load is the sum */
export const FETCH_CONCURRENCY: Record<Provider, number> = {
  ashby: 16,
  greenhouse: 12,
  lever: 16,
  workable: 4,
  smartrecruiters: 6,
  bamboohr: 6,
  breezy: 6,
  join: 4,
};

/** Probing guesses mostly misses, so stay gentler than live fetching */
export const PROBE_CONCURRENCY = 6;

export const SMARTRECRUITERS_PAGE_SIZE = 100;
export const SMARTRECRUITERS_MAX_JOBS = 2_000;
/** JOIN rejects page sizes above 5 */
export const JOIN_PAGE_SIZE = 5;
export const JOIN_MAX_PAGES = 100;

/** Workable's search returns at most 20 jobs per page */
export const WORKABLE_PAGE_SIZE = 20;
export const WORKABLE_SEARCH_PAGES = 5;
