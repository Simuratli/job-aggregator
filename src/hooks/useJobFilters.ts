import { useCallback, useState } from "react";
import { DEFAULT_FILTERS } from "../constants";
import type { JobFilters } from "../types";

export const useJobFilters = () => {
  const [filters, setFilters] = useState<JobFilters>(DEFAULT_FILTERS);

  const updateFilters = useCallback((patch: Partial<JobFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  const isFiltered = JSON.stringify(filters) !== JSON.stringify(DEFAULT_FILTERS);

  return { filters, updateFilters, resetFilters, isFiltered };
};
