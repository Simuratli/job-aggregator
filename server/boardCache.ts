import type { Company, RawJob } from "../src/types";
import { BOARD_CACHE_TTL_MS } from "./config.js";
import { companyKey } from "./files.js";
import { BOARD_FETCHERS } from "./providers/index.js";

interface Entry {
  expiresAt: number;
  jobs: Promise<RawJob[]>;
}

// Holds the promise, so concurrent viewers share one in-flight request per board
const cache = new Map<string, Entry>();

export const getBoardJobs = (company: Company) => {
  const key = companyKey(company);
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) return hit.jobs;

  const fetcher = BOARD_FETCHERS[company.provider];
  if (!fetcher) return Promise.reject(new Error(`No board fetcher for ${company.provider}`));

  const jobs = fetcher(company);
  cache.set(key, { expiresAt: Date.now() + BOARD_CACHE_TTL_MS, jobs });
  // Failures aren't worth remembering for 30 minutes; let the next viewer retry
  jobs.catch(() => cache.delete(key));
  return jobs;
};
