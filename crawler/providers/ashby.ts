import { createJob, joinParts, toTimestamp } from "../../src/lib/jobs";
import type { Company, Job, Workplace } from "../../src/types";
import { fetchJson } from "../http";

interface AshbyJob {
  id: string;
  title: string;
  department?: string;
  team?: string;
  employmentType?: string;
  location?: string;
  publishedAt?: string;
  isListed?: boolean;
  isRemote?: boolean;
  workplaceType?: string | null;
  address?: { postalAddress?: { addressLocality?: string; addressCountry?: string } };
  jobUrl: string;
}

const WORKPLACE: Record<string, Workplace> = { Remote: "remote", Hybrid: "hybrid", OnSite: "onsite" };

const EMPLOYMENT: Record<string, string> = {
  FullTime: "Full-time",
  PartTime: "Part-time",
  Intern: "Internship",
  Contract: "Contract",
  Temporary: "Temporary",
};

export const fetchAshbyJobs = async (company: Company): Promise<Job[]> => {
  const data = await fetchJson<{ jobs: AshbyJob[] }>(
    `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(company.slug)}`,
  );

  return data.jobs
    .filter((job) => job.isListed !== false)
    .map((job) =>
      createJob({
        id: `ashby:${job.id}`,
        title: job.title,
        company: company.name,
        provider: "ashby",
        department: job.team || job.department,
        employmentType: job.employmentType ? (EMPLOYMENT[job.employmentType] ?? job.employmentType) : undefined,
        location:
          job.location ||
          joinParts(job.address?.postalAddress?.addressLocality, job.address?.postalAddress?.addressCountry),
        workplace: (job.workplaceType && WORKPLACE[job.workplaceType]) || (job.isRemote ? "remote" : "unknown"),
        postedAt: toTimestamp(job.publishedAt),
        url: job.jobUrl,
      }),
    );
};
