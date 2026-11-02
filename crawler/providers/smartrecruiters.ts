import { createJob, joinParts, toTimestamp } from "../../src/lib/jobs";
import type { Company, Job } from "../../src/types";
import { SMARTRECRUITERS_MAX_JOBS, SMARTRECRUITERS_PAGE_SIZE } from "../config";
import { fetchJson } from "../http";

interface SmartRecruitersPosting {
  id: string;
  name: string;
  company: { identifier: string; name: string };
  releasedDate?: string;
  location?: { city?: string; country?: string; fullLocation?: string; remote?: boolean; hybrid?: boolean };
  department?: { label?: string };
  function?: { label?: string };
  typeOfEmployment?: { label?: string };
}

interface SmartRecruitersPage {
  totalFound: number;
  content: SmartRecruitersPosting[];
}

const toJob = (posting: SmartRecruitersPosting): Job => {
  const { location } = posting;
  return createJob({
    id: `smartrecruiters:${posting.id}`,
    title: posting.name,
    company: posting.company.name,
    provider: "smartrecruiters",
    department: posting.department?.label || posting.function?.label,
    employmentType: posting.typeOfEmployment?.label,
    location: location?.fullLocation || joinParts(location?.city, location?.country?.toUpperCase()),
    workplace: location?.remote ? "remote" : location?.hybrid ? "hybrid" : "onsite",
    postedAt: toTimestamp(posting.releasedDate),
    url: `https://jobs.smartrecruiters.com/${posting.company.identifier}/${posting.id}`,
  });
};

export const fetchSmartRecruitersJobs = async (company: Company): Promise<Job[]> => {
  const base = `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(company.slug)}/postings`;
  // Keyed by id: offset paging shifts when postings are added mid-crawl, so pages can overlap
  const jobs = new Map<string, Job>();

  for (let offset = 0; offset < SMARTRECRUITERS_MAX_JOBS; offset += SMARTRECRUITERS_PAGE_SIZE) {
    const page = await fetchJson<SmartRecruitersPage>(`${base}?limit=${SMARTRECRUITERS_PAGE_SIZE}&offset=${offset}`);
    for (const posting of page.content) jobs.set(posting.id, toJob(posting));
    if (offset + SMARTRECRUITERS_PAGE_SIZE >= page.totalFound) break;
  }

  return [...jobs.values()];
};
