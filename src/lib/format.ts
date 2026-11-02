import { DAY_MS } from "../constants";

const numberFormat = new Intl.NumberFormat("en-US");
const relativeFormat = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const formatNumber = (value: number) => numberFormat.format(value);

export const formatPostedAt = (postedAt: number | undefined, now: number) => {
  if (!postedAt) return "";
  const days = Math.floor((now - postedAt) / DAY_MS);
  if (days < 1) return "Today";
  if (days < 30) return relativeFormat.format(-days, "day");
  if (days < 365) return relativeFormat.format(-Math.floor(days / 30), "month");
  return relativeFormat.format(-Math.floor(days / 365), "year");
};
