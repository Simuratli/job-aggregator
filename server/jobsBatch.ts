import type { Company, JobsBatch, Provider } from "../src/types";
import { getBoardJobs } from "./boardCache.js";
import { BATCH_CONCURRENCY, BATCH_SIZE } from "./config.js";
import { readCompanies } from "./files.js";
import { runPool } from "./pool.js";
import { BOARD_FETCHERS } from "./providers/index.js";

let orderedBoards: Promise<Company[]> | null = null;

/**
 * The company list in a fixed order with providers interleaved round-robin, so every batch spreads its
 * requests over all providers instead of hammering one host, and batch N always means the same boards
 * (which is what lets the CDN cache batches).
 */
const getOrderedBoards = () =>
  (orderedBoards ??= readCompanies().then((companies) => {
    const byProvider = new Map<Provider, Company[]>();
    for (const company of companies) {
      if (!BOARD_FETCHERS[company.provider]) continue;
      byProvider.set(company.provider, [...(byProvider.get(company.provider) ?? []), company]);
    }
    const queues = [...byProvider.values()];
    const ordered: Company[] = [];
    for (let i = 0; ordered.length < companies.length && queues.some((queue) => i < queue.length); i++) {
      for (const queue of queues) if (i < queue.length) ordered.push(queue[i]);
    }
    return ordered;
  }));

export const getJobsBatch = async (batch: number): Promise<JobsBatch> => {
  const boards = await getOrderedBoards();
  const batches = Math.max(1, Math.ceil(boards.length / BATCH_SIZE));
  if (!Number.isInteger(batch) || batch < 0 || batch >= batches) throw new RangeError(`No batch ${batch}`);

  const slice = boards.slice(batch * BATCH_SIZE, (batch + 1) * BATCH_SIZE);
  const result: JobsBatch = { batch, batches, totalBoards: boards.length, boards: slice.length, failed: 0, active: {}, jobs: [] };

  await runPool(slice, BATCH_CONCURRENCY, async (company) => {
    try {
      const jobs = await getBoardJobs(company);
      if (!jobs.length) return;
      result.active[company.provider] = (result.active[company.provider] ?? 0) + 1;
      result.jobs.push(...jobs);
    } catch {
      result.failed++;
    }
  });

  return result;
};
