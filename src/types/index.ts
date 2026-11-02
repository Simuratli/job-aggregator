export type Provider =
  | "ashby"
  | "greenhouse"
  | "lever"
  | "workable"
  | "smartrecruiters"
  | "bamboohr"
  | "breezy"
  | "join";

export type Workplace = "remote" | "hybrid" | "onsite" | "unknown";

export interface Company {
  name: string;
  slug: string;
  provider: Provider;
  /** Provider-specific id when the API is not keyed by slug (JOIN uses a numeric company id) */
  externalId?: string;
}

/** A job as the server sends it */
export interface RawJob {
  id: string;
  title: string;
  company: string;
  provider: Provider;
  department?: string;
  employmentType?: string;
  location: string;
  workplace: Workplace;
  postedAt?: number;
  url: string;
}

export interface Job extends RawJob {
  /** Lowercased title + company + department, precomputed so filtering stays cheap */
  searchText: string;
  locationText: string;
}

export type SortOrder = "newest" | "company";

export interface JobFilters {
  query: string;
  location: string;
  providers: Provider[];
  workplace: Workplace | "all";
  postedWithinDays: number;
  sort: SortOrder;
}

/** Lines of the NDJSON stream from /api/jobs/stream */
export type JobsStreamMessage =
  | { type: "start"; boards: number }
  | { type: "board"; provider: Provider; jobs: RawJob[] }
  | { type: "failed"; provider: Provider; slug: string }
  | { type: "done" };

export interface WorkableSearchResult {
  /** How many Workable jobs match in total; only the first few pages are returned */
  total: number;
  jobs: RawJob[];
}
