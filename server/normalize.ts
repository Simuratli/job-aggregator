export const toTimestamp = (value: string | number | undefined | null) => {
  if (!value) return undefined;
  const time = typeof value === "number" ? value : Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
};

export const joinParts = (...parts: (string | undefined | null)[]) =>
  parts.map((part) => part?.trim()).filter(Boolean).join(", ");
