import { toTimestamp } from "../normalize";
import type { Company, RawJob } from "../../src/types";
import { fetchJson } from "../http";

interface GreenhouseJob {
  id: number;
  title: string;
  absolute_url: string;
  company_name?: string;
  location?: { name?: string };
  first_published?: string;
  updated_at?: string;
}

export const fetchGreenhouseJobs = async (company: Company): Promise<RawJob[]> => {
  const data = await fetchJson<{ jobs: GreenhouseJob[] }>(
    `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(company.slug)}/jobs`,
  );

  return data.jobs.map((job) => {
    const location = job.location?.name?.trim() ?? "";
    return ({
      id: `greenhouse:${job.id}`,
      title: job.title,
      company: job.company_name || company.name,
      provider: "greenhouse",
      location,
      // The board list has no workplace field; "Remote" in the location is the only signal
      workplace: /\bremote\b/i.test(location) ? "remote" : "unknown",
      postedAt: toTimestamp(job.first_published || job.updated_at),
      url: job.absolute_url,
    });
  });
};
