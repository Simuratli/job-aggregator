import type { RawJob, WorkableSearchResult, Workplace } from "../src/types";
import { WORKABLE_PAGE_SIZE, WORKABLE_SEARCH_PAGES } from "./config.js";
import { fetchJson } from "./http.js";
import { joinParts, toTimestamp } from "./normalize.js";

interface WorkableSearchJob {
  id: string;
  title: string;
  url: string;
  employmentType?: string;
  department?: string;
  workplace?: string;
  created?: string;
  locations?: string[];
  location?: { city?: string; countryName?: string };
  company?: { title?: string };
}

interface WorkableSearchPage {
  totalSize: number;
  nextPageToken?: string;
  jobs: WorkableSearchJob[];
}

const SEARCH_URL = "https://jobs.workable.com/api/v1/jobs";
const WORKPLACE: Record<string, Workplace> = { remote: "remote", hybrid: "hybrid", on_site: "onsite" };
export const WORKABLE_WORKPLACE_PARAM: Partial<Record<Workplace, string>> = {
  remote: "remote",
  hybrid: "hybrid",
  onsite: "on_site",
};

const toJob = (job: WorkableSearchJob): RawJob => ({
  id: `workable:${job.id}`,
  title: job.title,
  company: job.company?.title ?? "",
  provider: "workable",
  department: job.department || undefined,
  employmentType: job.employmentType || undefined,
  location:
    joinParts(job.location?.city, job.location?.countryName) ||
    job.locations?.find((value) => value !== "TELECOMMUTE") ||
    "",
  workplace: WORKPLACE[job.workplace ?? ""] ?? "unknown",
  postedAt: toTimestamp(job.created),
  url: job.url,
});

/**
 * Workable has no company directory, but its public job search spans every Workable board.
 * It pages 20 at a time with a cursor, so only the first few pages for the current search are fetched.
 */
export const searchWorkable = async (params: {
  query: string;
  location: string;
  workplace?: string;
}): Promise<WorkableSearchResult> => {
  const jobs: RawJob[] = [];
  let total = 0;
  let pageToken: string | undefined;

  for (let page = 0; page < WORKABLE_SEARCH_PAGES; page++) {
    const search = new URLSearchParams({
      query: params.query,
      location: params.location,
      limit: String(WORKABLE_PAGE_SIZE),
      ...(params.workplace ? { workplace: params.workplace } : {}),
      ...(pageToken ? { pageToken } : {}),
    });
    const result = await fetchJson<WorkableSearchPage>(`${SEARCH_URL}?${search}`);
    total = result.totalSize;
    jobs.push(...result.jobs.map(toJob));
    pageToken = result.jobs.length === WORKABLE_PAGE_SIZE ? result.nextPageToken : undefined;
    if (!pageToken) break;
  }

  return { total, jobs };
};
