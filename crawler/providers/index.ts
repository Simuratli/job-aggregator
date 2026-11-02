import type { Company, Job, Provider } from "../../src/types";
import { fetchAshbyJobs } from "./ashby";
import { fetchBambooJobs } from "./bamboohr";
import { fetchBreezyJobs } from "./breezy";
import { fetchGreenhouseJobs } from "./greenhouse";
import { fetchJoinJobs } from "./join";
import { fetchLeverJobs } from "./lever";
import { fetchSmartRecruitersJobs } from "./smartrecruiters";

/** Per-company boards. Workable is crawled through its global search instead (see workableSearch.ts) */
export const BOARD_FETCHERS: Partial<Record<Provider, (company: Company) => Promise<Job[]>>> = {
  ashby: fetchAshbyJobs,
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  smartrecruiters: fetchSmartRecruitersJobs,
  bamboohr: fetchBambooJobs,
  breezy: fetchBreezyJobs,
  join: fetchJoinJobs,
};
