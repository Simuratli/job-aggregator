import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import { JOB_ROW_HEIGHT, JOB_ROW_HEIGHT_COMPACT } from "../constants";
import { useMediaQuery } from "../hooks/useMediaQuery";
import type { Job } from "../types";
import { JOB_COLUMNS, JobRow } from "./JobRow";

interface JobListProps {
  jobs: Job[];
  now: number;
  /** Changing this scrolls back to the top; new jobs streaming in alone must not */
  scrollResetKey: unknown;
}

const COLUMN_TITLES = ["Job title", "Company", "Location", "Workplace", "Source", "Posted"];

export const JobList = ({ jobs, now, scrollResetKey }: JobListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const compact = !useMediaQuery("(min-width: 900px)");
  const rowHeight = compact ? JOB_ROW_HEIGHT_COMPACT : JOB_ROW_HEIGHT;

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => rowHeight,
    getItemKey: (index) => jobs[index].id,
    overscan: 20,
  });

  useEffect(() => {
    virtualizer.measure();
  }, [virtualizer, rowHeight]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [scrollResetKey]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {!compact && (
        <div className={`grid shrink-0 ${JOB_COLUMNS}`} role="presentation">
          {COLUMN_TITLES.map((title) => (
            <span key={title} className="xp-column-header">
              {title}
            </span>
          ))}
        </div>
      )}

      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
          {virtualizer.getVirtualItems().map((item) => (
            <div
              key={item.key}
              className="absolute top-0 left-0 w-full"
              style={{ height: rowHeight, transform: `translateY(${item.start}px)` }}
            >
              <JobRow job={jobs[item.index]} now={now} compact={compact} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
