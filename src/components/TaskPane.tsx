import type { ReactNode } from "react";
import { POSTED_WITHIN_OPTIONS, PROVIDER_COLORS, PROVIDER_LABELS, PROVIDERS, WORKPLACE_OPTIONS } from "../constants";
import { formatNumber } from "../lib/format";
import type { JobFilters, Provider, SortOrder } from "../types";
import { TaskPanel } from "./TaskPanel";

interface TaskPaneProps {
  filters: JobFilters;
  providerCounts: Record<Provider, number>;
  isFiltered: boolean;
  onChange: (patch: Partial<JobFilters>) => void;
  onReset: () => void;
  /** Extra panels shown under the filters */
  children?: ReactNode;
}

export const TaskPane = ({ filters, providerCounts, isFiltered, onChange, onReset, children }: TaskPaneProps) => {
  const toggleProvider = (provider: Provider) => {
    const selected = filters.providers.includes(provider);
    // Unticking the last source would just show nothing, so keep at least one
    if (selected && filters.providers.length === 1) return;
    onChange({
      providers: selected ? filters.providers.filter((p) => p !== provider) : [...filters.providers, provider],
    });
  };

  return (
    <aside className="xp-taskpane flex max-h-[38dvh] shrink-0 flex-col gap-3 overflow-y-auto p-3 md:max-h-none md:w-[230px]">
      <TaskPanel title="Job boards">
        {PROVIDERS.map((provider) => (
          <label key={provider} className="flex cursor-pointer items-center gap-1.5 text-black">
            <input
              type="checkbox"
              className="xp-check"
              checked={filters.providers.includes(provider)}
              onChange={() => toggleProvider(provider)}
            />
            <span className="size-2 shrink-0 rounded-[1px]" style={{ background: PROVIDER_COLORS[provider] }} />
            <span className="min-w-0 flex-1 truncate">{PROVIDER_LABELS[provider]}</span>
            <span className="text-xp-muted tabular-nums">{formatNumber(providerCounts[provider])}</span>
          </label>
        ))}
      </TaskPanel>

      <TaskPanel title="Workplace">
        {WORKPLACE_OPTIONS.map((option) => (
          <label key={option.value} className="flex cursor-pointer items-center gap-1.5 text-black">
            <input
              type="radio"
              name="workplace"
              className="xp-check"
              checked={filters.workplace === option.value}
              onChange={() => onChange({ workplace: option.value })}
            />
            {option.label}
          </label>
        ))}
      </TaskPanel>

      <TaskPanel title="Date and order">
        <label className="flex flex-col gap-1 text-black">
          Posted
          <select
            className="xp-select"
            value={filters.postedWithinDays}
            onChange={(event) => onChange({ postedWithinDays: Number(event.target.value) })}
          >
            {POSTED_WITHIN_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-black">
          Sort by
          <select
            className="xp-select"
            value={filters.sort}
            onChange={(event) => onChange({ sort: event.target.value as SortOrder })}
          >
            <option value="newest">Newest first</option>
            <option value="company">Company A–Z</option>
          </select>
        </label>
      </TaskPanel>

      {isFiltered && (
        <TaskPanel title="Search tasks">
          <button type="button" onClick={onReset} className="text-left text-xp-link hover:underline">
            Clear all filters
          </button>
        </TaskPanel>
      )}

      {children}
    </aside>
  );
};
