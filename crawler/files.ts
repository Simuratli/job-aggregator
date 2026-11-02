import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { Company } from "../src/types";
import { PATHS } from "./config";

export const readJson = async <T>(path: URL, fallback: T): Promise<T> => {
  try {
    return JSON.parse(await readFile(path, "utf8")) as T;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw error;
  }
};

export const writeJson = async (path: URL, value: unknown, pretty = true) => {
  await mkdir(new URL(".", path), { recursive: true });
  await writeFile(path, pretty ? `${JSON.stringify(value, null, 2)}\n` : JSON.stringify(value));
};

export const companyKey = (company: Pick<Company, "provider" | "slug">) =>
  `${company.provider}:${company.slug.toLowerCase()}`;

export const readCompanies = () => readJson<Company[]>(PATHS.companies, []);

export const writeCompanies = (companies: Iterable<Company>) =>
  writeJson(
    PATHS.companies,
    [...companies].sort((a, b) => a.provider.localeCompare(b.provider) || a.name.localeCompare(b.name)),
  );

/** Logs `line()` every few seconds while long work runs; call the returned function to stop */
export const logEvery = (ms: number, line: () => string) => {
  const timer = setInterval(() => console.log(line()), ms);
  return () => clearInterval(timer);
};
