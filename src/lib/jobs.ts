import { DAY_MS } from "../constants";
import type { Job, JobFilters, RawJob } from "../types";

export const createJob = (raw: RawJob): Job => ({
  ...raw,
  searchText: [raw.title, raw.company, raw.department].join(" ").toLowerCase(),
  locationText: raw.location.toLowerCase(),
});

const newerFirst = (a: Job, b: Job) => (b.postedAt ?? 0) - (a.postedAt ?? 0);

/** Merges a new batch into an already newest-first list in one pass, so streaming never re-sorts everything */
export const mergeByNewest = (sorted: Job[], batch: Job[]) => {
  const incoming = [...batch].sort(newerFirst);
  const merged: Job[] = new Array(sorted.length + incoming.length);
  let i = 0;
  let j = 0;
  let k = 0;
  while (i < sorted.length && j < incoming.length) {
    merged[k++] = newerFirst(sorted[i], incoming[j]) <= 0 ? sorted[i++] : incoming[j++];
  }
  while (i < sorted.length) merged[k++] = sorted[i++];
  while (j < incoming.length) merged[k++] = incoming[j++];
  return merged;
};

const collator = new Intl.Collator("en", { sensitivity: "base" });

export const sortByCompany = (jobs: Job[]) =>
  [...jobs].sort((a, b) => collator.compare(a.company, b.company) || collator.compare(a.title, b.title));

/** Keeps the input order, so pass a list that is already sorted the way the user asked */
export const filterJobs = (jobs: Job[], filters: JobFilters, now: number) => {
  const terms = filters.query.toLowerCase().split(/\s+/).filter(Boolean);
  const location = filters.location.trim().toLowerCase();
  const providers = new Set(filters.providers);
  const minPostedAt = filters.postedWithinDays ? now - filters.postedWithinDays * DAY_MS : 0;

  return jobs.filter(
    (job) =>
      providers.has(job.provider) &&
      (filters.workplace === "all" || job.workplace === filters.workplace) &&
      (!minPostedAt || (job.postedAt ?? 0) >= minPostedAt) &&
      (!location || job.locationText.includes(location)) &&
      terms.every((term) => job.searchText.includes(term)),
  );
};
