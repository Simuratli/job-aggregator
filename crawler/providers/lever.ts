import { createJob, toTimestamp } from "../../src/lib/jobs";
import type { Company, Job, Workplace } from "../../src/types";
import { fetchJson } from "../http";

interface LeverPosting {
  id: string;
  text: string;
  hostedUrl: string;
  createdAt?: number;
  workplaceType?: string;
  categories?: { location?: string; team?: string; department?: string; commitment?: string };
}

const WORKPLACE: Record<string, Workplace> = { remote: "remote", hybrid: "hybrid", onsite: "onsite" };

export const fetchLeverJobs = async (company: Company): Promise<Job[]> => {
  const data = await fetchJson<LeverPosting[]>(
    `https://api.lever.co/v0/postings/${encodeURIComponent(company.slug)}?mode=json`,
  );

  return data.map((posting) =>
    createJob({
      id: `lever:${posting.id}`,
      title: posting.text,
      company: company.name,
      provider: "lever",
      department: posting.categories?.team || posting.categories?.department,
      employmentType: posting.categories?.commitment,
      location: posting.categories?.location ?? "",
      workplace: WORKPLACE[posting.workplaceType ?? ""] ?? "unknown",
      postedAt: toTimestamp(posting.createdAt),
      url: posting.hostedUrl,
    }),
  );
};
