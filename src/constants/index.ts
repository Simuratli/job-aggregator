import type { JobFilters, Provider, Workplace } from "../types";

// Shared with the crawler (Node), so nothing in here may touch browser or Vite-only APIs

/** Order matters: the jobs file stores providers by index into this list */
export const PROVIDERS: Provider[] = [
  "ashby",
  "greenhouse",
  "lever",
  "workable",
  "smartrecruiters",
  "bamboohr",
  "breezy",
  "join",
];

export const PROVIDER_LABELS: Record<Provider, string> = {
  ashby: "Ashby",
  greenhouse: "Greenhouse",
  lever: "Lever",
  workable: "Workable",
  smartrecruiters: "SmartRecruiters",
  bamboohr: "BambooHR",
  breezy: "Breezy HR",
  join: "JOIN",
};

/** Tile colour of each source's little icon in the list */
export const PROVIDER_COLORS: Record<Provider, string> = {
  ashby: "#6b4fd8",
  greenhouse: "#2f9a52",
  lever: "#3b3f47",
  workable: "#00a58a",
  smartrecruiters: "#1a8fd8",
  bamboohr: "#73a92b",
  breezy: "#11a6c4",
  join: "#e2427a",
};

/** Order matters: the jobs file stores workplaces by index into this list */
export const WORKPLACES: Workplace[] = ["unknown", "remote", "hybrid", "onsite"];

export const WORKPLACE_LABELS: Record<Workplace, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  unknown: "Not specified",
};

export const WORKPLACE_OPTIONS: { value: JobFilters["workplace"]; label: string }[] = [
  { value: "all", label: "All" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "On-site" },
];

export const POSTED_WITHIN_OPTIONS = [
  { value: 0, label: "Any time" },
  { value: 1, label: "Last 24 hours" },
  { value: 7, label: "Last 7 days" },
  { value: 30, label: "Last 30 days" },
];

export const DEFAULT_FILTERS: JobFilters = {
  query: "",
  location: "",
  providers: PROVIDERS,
  workplace: "all",
  postedWithinDays: 0,
  sort: "newest",
};

export const DAY_MS = 24 * 60 * 60 * 1000;
/** Details view rows: one line on wide screens, two stacked lines on phones */
export const JOB_ROW_HEIGHT = 24;
export const JOB_ROW_HEIGHT_COMPACT = 44;
