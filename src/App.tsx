import { useDeferredValue, useMemo, useRef, useState } from "react";
import { EmptyState } from "./components/EmptyState";
import { JobList } from "./components/JobList";
import { SearchBar } from "./components/SearchBar";
import { StatusBar } from "./components/StatusBar";
import { TaskPane } from "./components/TaskPane";
import { TaskPanel } from "./components/TaskPanel";
import { Taskbar } from "./components/Taskbar";
import { XpWindow } from "./components/XpWindow";
import { PROVIDERS } from "./constants";
import { useJobFilters } from "./hooks/useJobFilters";
import { useJobs } from "./hooks/useJobs";
import { useWorkableSearch } from "./hooks/useWorkableSearch";
import { formatNumber } from "./lib/format";
import { filterJobs, mergeByNewest, sortByCompany } from "./lib/jobs";
import type { Provider } from "./types";

const App = () => {
  const { jobs, progress, activeBoards, loading, error } = useJobs();
  const { filters, updateFilters, resetFilters, isFiltered } = useJobFilters();
  const [now] = useState(Date.now);
  const searchRef = useRef<HTMLInputElement>(null);

  // Typing stays instant; the filter pass over every job runs on the deferred copy
  const deferredFilters = useDeferredValue(filters);
  const workable = useWorkableSearch(deferredFilters, deferredFilters.providers.includes("workable"));

  // Board jobs arrive newest-first already; A–Z is only built when it's asked for
  const companySorted = useMemo(
    () => (deferredFilters.sort === "company" ? sortByCompany(jobs) : null),
    [jobs, deferredFilters.sort],
  );

  const visibleJobs = useMemo(() => {
    const boardJobs = filterJobs(companySorted ?? jobs, deferredFilters, now);
    // Workable already matched the text and location server-side, and also searches descriptions,
    // so re-applying the title filter here would throw away valid matches
    const workableJobs = filterJobs(workable.jobs, { ...deferredFilters, query: "", location: "" }, now);
    if (!workableJobs.length) return boardJobs;
    return companySorted ? sortByCompany([...boardJobs, ...workableJobs]) : mergeByNewest(boardJobs, workableJobs);
  }, [companySorted, jobs, deferredFilters, now, workable.jobs]);

  const providerCounts = useMemo(() => {
    const counts = Object.fromEntries(PROVIDERS.map((p) => [p, 0])) as Record<Provider, number>;
    for (const job of jobs) counts[job.provider]++;
    counts.workable = workable.total;
    return counts;
  }, [jobs, workable.total]);

  const totalJobs = jobs.length + workable.total;
  const totalCompanies = Object.values(activeBoards).reduce((sum, count) => sum + count, 0);

  return (
    <div className="xp-desktop flex h-dvh flex-col">
      <div className="flex min-h-0 flex-1 md:p-6 lg:px-10 lg:py-8">
        <XpWindow
          title={
            totalJobs
              ? `Job Radar - ${formatNumber(totalJobs)} jobs at ${formatNumber(totalCompanies)} companies`
              : "Job Radar - Searching job boards…"
          }
          className="mx-auto min-h-0 w-full max-w-[1240px] min-w-0 flex-1"
        >
          <SearchBar filters={filters} onChange={updateFilters} inputRef={searchRef} />

          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <TaskPane
              filters={filters}
              providerCounts={providerCounts}
              isFiltered={isFiltered}
              onChange={updateFilters}
              onReset={resetFilters}
            >
              <div className="hidden md:block">
                <TaskPanel title="Details">
                  <p className="text-black">
                    Jobs are fetched live from each company's job board. Company list partly from the{" "}
                    <a
                      href="https://datahub.io/lastroundai-hiring-data/lastroundai-hiring-data/ats-directory"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xp-link underline"
                    >
                      LastRound AI ATS Company Directory
                    </a>{" "}
                    (CC BY 4.0).
                  </p>
                </TaskPanel>
              </div>
            </TaskPane>

            <div className="flex min-h-0 flex-1 flex-col p-1.5 md:p-2">
              <div className="xp-listview flex-1">
                {error && !jobs.length ? (
                  <div className="flex h-full items-center justify-center p-8 text-center">{error}</div>
                ) : visibleJobs.length ? (
                  <JobList jobs={visibleJobs} now={now} scrollResetKey={deferredFilters} />
                ) : (
                  <EmptyState loading={loading || workable.loading} isFiltered={isFiltered} onReset={resetFilters} />
                )}
              </div>
            </div>
          </div>

          <StatusBar
            shown={visibleJobs.length}
            workableShown={workable.jobs.length}
            workableTotal={workable.total}
            progress={progress}
            loading={loading}
          />
        </XpWindow>
      </div>

      <Taskbar totalJobs={totalJobs} onSearch={() => searchRef.current?.focus()} />
    </div>
  );
};

export default App;
