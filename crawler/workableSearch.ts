import { createJob, joinParts, toTimestamp } from "../src/lib/jobs";
import type { Job, Workplace } from "../src/types";
import { CRAWL_CONCURRENCY, WORKABLE_PAGE_SIZE } from "./config";
import { fetchJson } from "./http";
import { runPool } from "./pool";

interface WorkableSearchJob {
  id: string;
  title: string;
  url: string;
  employmentType?: string;
  department?: string;
  workplace?: string;
  created?: string;
  locations?: string[];
  location?: { city?: string; subregion?: string; countryName?: string };
  company?: { title?: string };
}

interface WorkableSearchPage {
  totalSize: number;
  nextPageToken?: string;
  jobs: WorkableSearchJob[];
}

const SEARCH_URL = "https://jobs.workable.com/api/v1/jobs";
const WORKPLACE_PARAMS = ["remote", "hybrid", "on_site"] as const;
const WORKPLACE: Record<string, Workplace> = { remote: "remote", hybrid: "hybrid", on_site: "onsite" };

// Names Workable uses that differ from the Intl display names
const COUNTRY_ALIASES = ["Turkey", "Czech Republic", "Hong Kong", "Macau", "Ivory Coast"];

/** Every country name Intl knows; the search filters by location text, so these partition the result set */
const countryNames = () => {
  const names = new Intl.DisplayNames(["en"], { type: "region", fallback: "none" });
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const found = new Set(COUNTRY_ALIASES);
  for (const a of letters) {
    for (const b of letters) {
      const name = names.of(a + b);
      if (name) found.add(name);
    }
  }
  return [...found];
};

const toJob = (job: WorkableSearchJob): Job => {
  const fallbackLocation = job.locations?.find((value) => value !== "TELECOMMUTE");
  return createJob({
    id: `workable:${job.id}`,
    title: job.title,
    company: job.company?.title ?? "",
    provider: "workable",
    department: job.department || undefined,
    employmentType: job.employmentType || undefined,
    location: joinParts(job.location?.city, job.location?.countryName) || fallbackLocation || "",
    workplace: WORKPLACE[job.workplace ?? ""] ?? "unknown",
    postedAt: toTimestamp(job.created),
    url: job.url,
  });
};

const pageUrl = (params: Record<string, string>) =>
  `${SEARCH_URL}?${new URLSearchParams({ query: "", limit: String(WORKABLE_PAGE_SIZE), ...params })}`;

export interface WorkableCrawlResult {
  jobs: Job[];
  /** What Workable reports in total, to measure how much the partitions covered */
  reportedTotal: number;
  failedPartitions: string[];
}

/**
 * Workable has no company directory, but its public job search spans every Workable board.
 * The search is paginated 20 at a time with a cursor, so it's split into workplace × country
 * partitions that can be walked in parallel; overlaps are deduplicated by id.
 */
export const crawlWorkableSearch = async (onProgress: (jobs: number) => void): Promise<WorkableCrawlResult> => {
  const jobs = new Map<string, Job>();
  const failedPartitions: string[] = [];
  const reportedTotal = (await fetchJson<WorkableSearchPage>(pageUrl({}))).totalSize;

  const partitions = WORKPLACE_PARAMS.flatMap((workplace) =>
    countryNames().map((location) => ({ workplace, location })),
  );

  await runPool(partitions, CRAWL_CONCURRENCY.workable, async (partition) => {
    let pageToken: string | undefined;
    try {
      do {
        const page = await fetchJson<WorkableSearchPage>(pageUrl({ ...partition, ...(pageToken ? { pageToken } : {}) }));
        for (const job of page.jobs) jobs.set(job.id, toJob(job));
        onProgress(jobs.size);
        pageToken = page.jobs.length === WORKABLE_PAGE_SIZE ? page.nextPageToken : undefined;
      } while (pageToken);
    } catch (error) {
      failedPartitions.push(`${partition.workplace}/${partition.location}: ${(error as Error).message}`);
    }
  });

  return { jobs: [...jobs.values()], reportedTotal, failedPartitions };
};
