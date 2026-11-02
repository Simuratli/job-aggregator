import { SearchIcon } from "./icons";

interface EmptyStateProps {
  loading: boolean;
  isFiltered: boolean;
  onReset: () => void;
}

export const EmptyState = ({ loading, isFiltered, onReset }: EmptyStateProps) => (
  <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
    <SearchIcon width={32} height={32} className={loading ? "animate-pulse" : undefined} />
    {loading ? (
      <p>Searching job boards…</p>
    ) : (
      <>
        <p className="font-bold">No jobs match your search.</p>
        <p className="max-w-xs text-xp-muted">Try a broader title, another location, or fewer filters.</p>
        {isFiltered && (
          <button type="button" onClick={onReset} className="xp-button mt-1">
            Clear filters
          </button>
        )}
      </>
    )}
  </div>
);
