import { joinParts } from "../normalize";
import type { Company, RawJob, Workplace } from "../../src/types";
import { fetchJson } from "../http";

interface BambooJob {
  id: string;
  jobOpeningName: string;
  departmentLabel?: string | null;
  employmentStatusLabel?: string | null;
  location?: { city?: string | null; state?: string | null };
  atsLocation?: { city?: string | null; state?: string | null; country?: string | null };
  isRemote?: boolean | null;
  locationType?: string | null;
}

const WORKPLACE: Record<string, Workplace> = { "0": "onsite", "1": "remote", "2": "hybrid" };

export const bambooListUrl = (slug: string) => `https://${slug}.bamboohr.com/careers/list`;

// Unknown tenants redirect to bamboohr.com, so redirects must not be followed
export const BAMBOO_INIT: RequestInit = { headers: { Accept: "application/json" }, redirect: "manual" };

export const fetchBambooJobs = async (company: Company): Promise<RawJob[]> => {
  const data = await fetchJson<{ result?: BambooJob[] }>(bambooListUrl(company.slug), BAMBOO_INIT);

  return (data.result ?? []).map((job) =>
    ({
      id: `bamboohr:${company.slug}:${job.id}`,
      title: job.jobOpeningName,
      company: company.name,
      provider: "bamboohr",
      department: job.departmentLabel || undefined,
      employmentType: job.employmentStatusLabel || undefined,
      location:
        joinParts(job.atsLocation?.city, job.atsLocation?.country) ||
        joinParts(job.location?.city, job.location?.state),
      workplace: job.isRemote ? "remote" : (WORKPLACE[job.locationType ?? ""] ?? "unknown"),
      // The public list has no posting date
      postedAt: undefined,
      url: `https://${company.slug}.bamboohr.com/careers/${job.id}`,
    }),
  );
};
