// Fetches every job from every board in data/companies.json, plus all of Workable through its
// global search, and writes public/data/jobs.json for the site. Failed boards go to data/crawl-report.json.
//
//   npm run crawl
//   npm run crawl -- --provider ashby --limit 20     -> quick partial run (overwrites jobs.json!)

import { parseArgs } from "node:util";
import { PROVIDERS } from "../src/constants";
import { encodeJobsFile } from "../src/lib/jobsFile";
import type { Company, CrawlStats, Job, Provider } from "../src/types";
import { CRAWL_CONCURRENCY, PATHS } from "./config";
import { logEvery, readCompanies, writeJson } from "./files";
import { runPool } from "./pool";
import { BOARD_FETCHERS } from "./providers";
import { crawlWorkableSearch } from "./workableSearch";

const { values: args } = parseArgs({
  options: {
    provider: { type: "string", multiple: true },
    limit: { type: "string" },
  },
});

const selected = new Set<Provider>((args.provider as Provider[] | undefined) ?? PROVIDERS);
const limit = args.limit ? Number(args.limit) : Infinity;
const startedAt = Date.now();

const companies = (await readCompanies()).filter((c) => selected.has(c.provider) && BOARD_FETCHERS[c.provider]);
const byProvider = new Map<Provider, Company[]>();
for (const company of companies) {
  const list = byProvider.get(company.provider) ?? [];
  if (list.length < limit) list.push(company);
  byProvider.set(company.provider, list);
}

const boardTotal = [...byProvider.values()].reduce((sum, list) => sum + list.length, 0);
const jobs = new Map<string, Job>();
const failures: { provider: Provider; slug: string; error: string }[] = [];
const activeBoards = Object.fromEntries(PROVIDERS.map((p) => [p, 0])) as Record<Provider, number>;
let boardsDone = 0;
let workableJobs = 0;

console.log(`Crawling ${boardTotal} boards${selected.has("workable") ? " + Workable search" : ""}…`);
const stopLog = logEvery(
  10_000,
  () =>
    `  boards ${boardsDone}/${boardTotal} · jobs ${jobs.size} · workable ${workableJobs} · ` +
    `failed ${failures.length} · ${Math.round((Date.now() - startedAt) / 1000)}s`,
);

const crawlBoards = (provider: Provider, list: Company[]) =>
  runPool(list, CRAWL_CONCURRENCY[provider], async (company) => {
    try {
      const companyJobs = await BOARD_FETCHERS[provider]!(company);
      if (companyJobs.length) activeBoards[provider]++;
      for (const job of companyJobs) jobs.set(job.id, job);
    } catch (error) {
      failures.push({ provider, slug: company.slug, error: (error as Error).message });
    }
    boardsDone++;
  });

const crawlWorkable = async () => {
  const result = await crawlWorkableSearch((count) => (workableJobs = count));
  for (const job of result.jobs) jobs.set(job.id, job);
  activeBoards.workable = new Set(result.jobs.map((job) => job.company)).size;
  const coverage = result.reportedTotal ? Math.round((result.jobs.length / result.reportedTotal) * 100) : 0;
  console.log(`  Workable: ${result.jobs.length} of ${result.reportedTotal} reported jobs (${coverage}%)`);
  for (const partition of result.failedPartitions) {
    failures.push({ provider: "workable", slug: partition, error: "partition failed" });
  }
};

await Promise.all([
  ...[...byProvider].map(([provider, list]) => crawlBoards(provider, list)),
  ...(selected.has("workable") ? [crawlWorkable()] : []),
]);
stopLog();

const allJobs = [...jobs.values()];
const stats = Object.fromEntries(
  PROVIDERS.map((provider) => [
    provider,
    { companies: activeBoards[provider], jobs: allJobs.filter((job) => job.provider === provider).length },
  ]),
) as CrawlStats;

await writeJson(PATHS.jobs, encodeJobsFile(allJobs, stats, Date.now()), false);
await writeJson(PATHS.crawlReport, { crawledAt: new Date().toISOString(), stats, failures });

console.log(`Done in ${Math.round((Date.now() - startedAt) / 1000)}s: ${allJobs.length} jobs`);
console.table(stats);
console.log(`${failures.length} boards failed (see data/crawl-report.json)`);
