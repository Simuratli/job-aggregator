import { memo } from "react";
import { PROVIDER_COLORS, PROVIDER_LABELS, WORKPLACE_LABELS } from "../constants";
import { formatPostedAt } from "../lib/format";
import type { Job } from "../types";

/** Shared by the column headers and the rows so they always line up */
export const JOB_COLUMNS = "grid-cols-[minmax(0,2.6fr)_minmax(0,1.4fr)_minmax(0,1.4fr)_76px_118px_84px]";

interface JobRowProps {
  job: Job;
  now: number;
  compact: boolean;
}

const SourceTile = ({ job }: { job: Job }) => (
  <span
    className="flex size-4 shrink-0 items-center justify-center rounded-[2px] text-[9px] font-bold text-white"
    style={{ background: PROVIDER_COLORS[job.provider] }}
    aria-hidden
  >
    {job.company.charAt(0).toUpperCase()}
  </span>
);

export const JobRow = memo(({ job, now, compact }: JobRowProps) => {
  const posted = formatPostedAt(job.postedAt, now);
  const workplace = job.workplace === "unknown" ? "" : WORKPLACE_LABELS[job.workplace];

  if (compact) {
    return (
      <a
        href={job.url}
        target="_blank"
        rel="noopener noreferrer"
        className="xp-row flex h-full items-center gap-2 border-b border-[#f0f0f0] px-2"
      >
        <SourceTile job={job} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{job.title}</span>
          <span className="block truncate text-[11px] text-xp-muted">
            {[job.company, job.location, workplace, posted].filter(Boolean).join(" · ")}
          </span>
        </span>
      </a>
    );
  }

  return (
    <a
      href={job.url}
      target="_blank"
      rel="noopener noreferrer"
      title={`${job.title} at ${job.company}`}
      className={`xp-row grid h-full items-center ${JOB_COLUMNS}`}
    >
      <span className="flex min-w-0 items-center gap-1.5 px-1.5">
        <SourceTile job={job} />
        <span className="truncate">{job.title}</span>
      </span>
      <span className="truncate px-1.5">{job.company}</span>
      <span className="truncate px-1.5 text-xp-muted">{job.location}</span>
      <span className="truncate px-1.5 text-xp-muted">{workplace}</span>
      <span className="truncate px-1.5 text-xp-muted">{PROVIDER_LABELS[job.provider]}</span>
      <span className="truncate px-1.5 text-xp-muted tabular-nums">{posted}</span>
    </a>
  );
});
