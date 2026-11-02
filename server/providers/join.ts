import { joinParts, toTimestamp } from "../normalize.js";
import type { Company, RawJob, Workplace } from "../../src/types";
import { JOIN_MAX_PAGES, JOIN_PAGE_SIZE } from "../config.js";
import { fetchJson, fetchJsonWithHeaders } from "../http.js";

interface JoinJob {
  id: number;
  idParam: string;
  title: string;
  createdAt?: string;
  workplaceType?: string | null;
  category?: { name?: string };
  employmentType?: { name?: string };
  city?: { cityName?: string; countryName?: string };
  country?: { name?: string };
}

const WORKPLACE: Record<string, Workplace> = { ONSITE: "onsite", HYBRID: "hybrid", REMOTE: "remote" };

export const joinJobsUrl = (companyId: string, page: number) =>
  `https://join.com/api/public/companies/${companyId}/jobs?page=${page}&pageSize=${JOIN_PAGE_SIZE}`;

const toJob = (company: Company, job: JoinJob): RawJob =>
  ({
    id: `join:${job.id}`,
    title: job.title,
    company: company.name,
    provider: "join",
    department: job.category?.name,
    employmentType: job.employmentType?.name,
    location: joinParts(job.city?.cityName, job.city?.countryName ?? job.country?.name),
    workplace: WORKPLACE[job.workplaceType ?? ""] ?? "unknown",
    postedAt: toTimestamp(job.createdAt),
    url: `https://join.com/companies/${company.slug}/${job.idParam}`,
  });

// The public API is keyed by JOIN's numeric company id (externalId), not the slug
export const fetchJoinJobs = async (company: Company): Promise<RawJob[]> => {
  const companyId = company.externalId;
  if (!companyId) throw new Error(`JOIN company "${company.slug}" has no externalId`);

  // The first page reports the page count, so the rest can be fetched in parallel
  const first = await fetchJsonWithHeaders<{ items: JoinJob[] }>(joinJobsUrl(companyId, 1));
  const pageCount = Math.min(Number(first.headers.get("X-Page-Count")) || 1, JOIN_MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, index) =>
      fetchJson<{ items: JoinJob[] }>(joinJobsUrl(companyId, index + 2)),
    ),
  );

  return [first.data, ...rest].flatMap((page) => page.items.map((job) => toJob(company, job)));
};
