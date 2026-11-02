import type { Ref } from "react";
import type { JobFilters } from "../types";
import { GlobeIcon, SearchIcon } from "./icons";

interface SearchBarProps {
  filters: JobFilters;
  onChange: (patch: Partial<JobFilters>) => void;
  inputRef: Ref<HTMLInputElement>;
}

/** Laid out like Explorer's address bar: a label, then the field, under the toolbar */
export const SearchBar = ({ filters, onChange, inputRef }: SearchBarProps) => (
  <div className="flex flex-col gap-1.5 border-b border-[#d6d2c2] px-2 py-1.5 shadow-[0_1px_#fff] sm:flex-row sm:items-center sm:gap-3">
    <label className="flex min-w-0 flex-1 items-center gap-1.5">
      <span className="w-[54px] shrink-0 text-xp-muted sm:w-auto">Search</span>
      <span className="relative flex min-w-0 flex-1 items-center">
        <SearchIcon className="pointer-events-none absolute left-1" />
        <input
          ref={inputRef}
          type="search"
          value={filters.query}
          onChange={(event) => onChange({ query: event.target.value })}
          placeholder="Job title, company or team"
          className="xp-input pl-6"
          autoFocus
        />
      </span>
    </label>
    <label className="flex min-w-0 items-center gap-1.5 sm:w-[260px]">
      <span className="w-[54px] shrink-0 text-xp-muted sm:w-auto">Location</span>
      <span className="relative flex min-w-0 flex-1 items-center">
        <GlobeIcon className="pointer-events-none absolute left-1" />
        <input
          type="search"
          value={filters.location}
          onChange={(event) => onChange({ location: event.target.value })}
          placeholder="City or country"
          className="xp-input pl-6"
        />
      </span>
    </label>
  </div>
);
