import { toTimestamp } from "../normalize";
import type { Company, RawJob } from "../../src/types";
import { fetchJson } from "../http";

export interface BreezyJob {
  id: string;
  name: string;
  url: string;
  published_date?: string;
  type?: { name?: string };
  department?: string | null;
  location?: { name?: string; is_remote?: boolean };
  company?: { name?: string };
}

export const breezyListUrl = (slug: string) => `https://${slug}.breezy.hr/json`;

export const fetchBreezyJobs = async (company: Company): Promise<RawJob[]> => {
  const data = await fetchJson<BreezyJob[]>(breezyListUrl(company.slug));

  return data.map((job) =>
    ({
      id: `breezy:${job.id}`,
      title: job.name,
      company: job.company?.name || company.name,
      provider: "breezy",
      department: job.department || undefined,
      employmentType: job.type?.name,
      location: job.location?.name ?? "",
      workplace: job.location?.is_remote ? "remote" : "unknown",
      postedAt: toTimestamp(job.published_date),
      url: job.url,
    }),
  );
};
