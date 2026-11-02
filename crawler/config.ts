import type { Provider } from "../src/types";

export const PATHS = {
  companies: new URL("../public/data/companies.json", import.meta.url),
  lastRoundDirectory: new URL("../data/sources/lastround-ats-directory-2026-08.csv", import.meta.url),
  jobs: new URL("../public/data/jobs.json", import.meta.url),
  crawlReport: new URL("../data/crawl-report.json", import.meta.url),
};

export const REQUEST_TIMEOUT_MS = 20_000;
export const MAX_RETRIES = 3;
export const RETRY_BASE_DELAY_MS = 1_000;

/** Parallel requests per host; providers run side by side, so total load is the sum */
export const CRAWL_CONCURRENCY: Record<Provider, number> = {
  ashby: 8,
  greenhouse: 12,
  lever: 8,
  workable: 6,
  smartrecruiters: 6,
  bamboohr: 6,
  breezy: 6,
  join: 4,
};

/** Probing guesses mostly misses, so stay gentler than the crawl */
export const PROBE_CONCURRENCY = 6;

export const SMARTRECRUITERS_PAGE_SIZE = 100;
export const SMARTRECRUITERS_MAX_JOBS = 10_000;
/** JOIN rejects page sizes above 5 */
export const JOIN_PAGE_SIZE = 5;
export const JOIN_MAX_PAGES = 400;

/** Workable's global search caps pages at 20 jobs; partitions bigger than this get split by workplace */
export const WORKABLE_PAGE_SIZE = 20;
export const WORKABLE_SPLIT_THRESHOLD = 4_000;
