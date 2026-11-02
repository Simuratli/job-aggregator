import type { Company, Provider, RawJob } from "../../src/types";
import { fetchAshbyJobs } from "./ashby.js";
import { fetchBambooJobs } from "./bamboohr.js";
import { fetchBreezyJobs } from "./breezy.js";
import { fetchGreenhouseJobs } from "./greenhouse.js";
import { fetchJoinJobs } from "./join.js";
import { fetchLeverJobs } from "./lever.js";
import { fetchSmartRecruitersJobs } from "./smartrecruiters.js";

/** Per-company boards. Workable is crawled through its global search instead (see workableSearch.ts) */
export const BOARD_FETCHERS: Partial<Record<Provider, (company: Company) => Promise<RawJob[]>>> = {
  ashby: fetchAshbyJobs,
  greenhouse: fetchGreenhouseJobs,
  lever: fetchLeverJobs,
  smartrecruiters: fetchSmartRecruitersJobs,
  bamboohr: fetchBambooJobs,
  breezy: fetchBreezyJobs,
  join: fetchJoinJobs,
};
