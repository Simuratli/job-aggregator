import { useEffect, useState } from "react";
import { formatNumber } from "../lib/format";
import { RadarIcon, SearchIcon } from "./icons";

interface TaskbarProps {
  totalJobs: number;
  onSearch: () => void;
}

const clockFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });

const Clock = () => {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);
  return <time dateTime={now.toISOString()}>{clockFormat.format(now)}</time>;
};

export const Taskbar = ({ totalJobs, onSearch }: TaskbarProps) => (
  <footer className="xp-taskbar">
    <button type="button" className="xp-start" onClick={onSearch} title="Jump to the search box">
      <SearchIcon width={18} height={18} />
      search
    </button>
    <span className="xp-task hidden sm:flex">
      <RadarIcon />
      Job Radar
    </span>
    <div className="xp-tray">
      <span className="hidden tabular-nums sm:inline">{formatNumber(totalJobs)} jobs</span>
      <Clock />
    </div>
  </footer>
);
