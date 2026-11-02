import type { JobsProgress } from "../hooks/useJobs";
import { formatNumber } from "../lib/format";

interface StatusBarProps {
  shown: number;
  workableShown: number;
  workableTotal: number;
  progress: JobsProgress;
  loading: boolean;
}

export const StatusBar = ({ shown, workableShown, workableTotal, progress, loading }: StatusBarProps) => {
  const percent = progress.boards ? (progress.done / progress.boards) * 100 : 0;

  return (
    <div className="xp-statusbar" role="status">
      <span className="xp-statusbar__cell min-w-0 flex-1">
        {formatNumber(shown)} jobs shown
        {workableTotal > workableShown && (
          <span className="hidden text-xp-muted sm:inline">
            · top {formatNumber(workableShown)} of {formatNumber(workableTotal)} Workable matches
          </span>
        )}
      </span>
      {loading && progress.boards > 0 ? (
        <span className="xp-statusbar__cell w-[220px] sm:w-[300px]">
          <span className="hidden shrink-0 tabular-nums sm:inline">
            {formatNumber(progress.done)}/{formatNumber(progress.boards)} boards
          </span>
          <span className="xp-progress min-w-0 flex-1" aria-label={`${Math.round(percent)}% of boards checked`}>
            <span className="xp-progress__bar block" style={{ width: `${percent}%` }} />
          </span>
        </span>
      ) : (
        <span className="xp-statusbar__cell hidden sm:flex">
          {progress.boards ? `${formatNumber(progress.boards - progress.failed)} boards online` : "Ready"}
        </span>
      )}
    </div>
  );
};
