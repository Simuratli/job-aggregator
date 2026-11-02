// Builds data/companies.json, the list of boards the crawler reads:
//   1. keeps every company already in the file (hand-added, TheirStack, earlier runs)
//   2. imports the LastRound AI ATS Company Directory (Ashby, Greenhouse, Lever; CC BY 4.0)
//   3. probes every known company name against SmartRecruiters, BambooHR, Breezy HR and JOIN,
//      which publish no directory of their own
//
//   npm run directory                  -> all of the above
//   npm run directory -- --skip-probe  -> only steps 1 and 2 (seconds instead of minutes)

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import type { Company, Provider } from "../src/types";
import { PATHS, PROBE_CONCURRENCY } from "./config";
import { companyKey, logEvery, readCompanies, writeCompanies } from "./files";
import { runPool } from "./pool";
import { resolveCompany } from "./probe";

const PROBED_PROVIDERS = ["smartrecruiters", "bamboohr", "breezy", "join"] as const;
const DIRECTORY_PROVIDERS = new Set<Provider>(["ashby", "greenhouse", "lever"]);

const { values: args } = parseArgs({ options: { "skip-probe": { type: "boolean", default: false } } });

/** Minimal CSV reader: the directory quotes names that contain commas */
const parseCsv = (text: string) =>
  text
    .trim()
    .split(/\r?\n/)
    .map((line) => {
      const cells: string[] = [];
      let cell = "";
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quoted && char === '"' && line[i + 1] === '"') {
          cell += '"';
          i++;
        } else if (char === '"') {
          quoted = !quoted;
        } else if (char === "," && !quoted) {
          cells.push(cell);
          cell = "";
        } else {
          cell += char;
        }
      }
      cells.push(cell);
      return cells;
    });

const companies = new Map<string, Company>();
const add = (company: Company) => {
  const key = companyKey(company);
  if (companies.has(key)) return false;
  companies.set(key, company);
  return true;
};

for (const company of await readCompanies()) add(company);
const existingCount = companies.size;

const [header, ...rows] = parseCsv(await readFile(PATHS.lastRoundDirectory, "utf8"));
const column = (name: string) => header.indexOf(name);
let imported = 0;
for (const row of rows) {
  const provider = row[column("ats_vendor")] as Provider;
  const slug = row[column("board_slug")]?.trim();
  const name = row[column("company_name")]?.trim();
  if (DIRECTORY_PROVIDERS.has(provider) && slug && name && add({ name, slug, provider })) imported++;
}
console.log(`Kept ${existingCount} existing companies, imported ${imported} from the LastRound directory`);

if (!args["skip-probe"]) {
  // One entry per company name, with its known slugs as the first guesses
  const names = new Map<string, Set<string>>();
  for (const company of companies.values()) {
    const slugs = names.get(company.name) ?? new Set<string>();
    slugs.add(company.slug.toLowerCase());
    names.set(company.name, slugs);
  }
  const entries = [...names.entries()];

  let checked = 0;
  let found = 0;
  const total = entries.length * PROBED_PROVIDERS.length;
  const stopLog = logEvery(10_000, () => `  probed ${checked}/${total}, found ${found}`);

  await Promise.all(
    PROBED_PROVIDERS.map((provider) => {
      const known = new Set([...companies.values()].filter((c) => c.provider === provider).map((c) => c.name));
      return runPool(entries, PROBE_CONCURRENCY, async ([name, slugs]) => {
        if (!known.has(name)) {
          const company = await resolveCompany(provider, name, [...slugs]);
          if (company && add(company)) found++;
        }
        checked++;
      });
    }),
  );

  stopLog();
  console.log(`Probing found ${found} more boards`);
}

await writeCompanies(companies.values());
const counts = Object.entries(
  [...companies.values()].reduce<Record<string, number>>((acc, c) => ({ ...acc, [c.provider]: (acc[c.provider] ?? 0) + 1 }), {}),
);
console.log(`Saved ${companies.size} companies:`, Object.fromEntries(counts));
