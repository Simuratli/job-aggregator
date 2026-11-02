// Optional: adds companies TheirStack knows use a given ATS to data/companies.json.
// Every returned company costs TheirStack credits (3 each at the time of writing), so keep --limit small.
//
//   npm run sync:theirstack -- --provider breezy --limit 10

import { parseArgs } from "node:util";
import type { Company } from "../src/types";
import { companyKey, readCompanies, writeCompanies } from "./files";
import { runPool } from "./pool";
import { RESOLVERS, resolveCompany } from "./probe";

type ProbedProvider = keyof typeof RESOLVERS;

const TECHNOLOGY: Record<ProbedProvider, string> = {
  ashby: "ashby",
  greenhouse: "greenhouse",
  lever: "lever",
  smartrecruiters: "smartrecruiters",
  bamboohr: "bamboohr",
  breezy: "breezy-hr",
  join: "join",
};

interface TheirStackCompany {
  name?: string;
  domain?: string;
  url?: string;
}

const { values: args } = parseArgs({
  options: {
    limit: { type: "string", default: "10" },
    provider: { type: "string", multiple: true },
  },
});

const apiKey = process.env.THEIRSTACK_API_KEY;
if (!apiKey) {
  console.error("THEIRSTACK_API_KEY is missing. Add it to .env (see .env.example).");
  process.exit(1);
}

const search = async (technology: string, limit: number): Promise<TheirStackCompany[]> => {
  const res = await fetch("https://api.theirstack.com/v1/companies/search", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ company_technology_slug_or: [technology], limit, page: 0 }),
  });
  if (!res.ok) throw new Error(`TheirStack ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { data?: TheirStackCompany[] }).data ?? [];
};

const domainLabel = (company: TheirStackCompany) => {
  const raw = company.domain || company.url || "";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return "";
  }
};

const companies = new Map((await readCompanies()).map((c) => [companyKey(c), c]));
const providers = (args.provider ?? Object.keys(TECHNOLOGY)) as ProbedProvider[];

for (const provider of providers) {
  if (!TECHNOLOGY[provider]) {
    console.warn(`${provider}: not supported here, skipping`);
    continue;
  }

  try {
    const found = await search(TECHNOLOGY[provider], Number(args.limit));
    const resolved: Company[] = [];
    await runPool(found, 6, async (company) => {
      const match = company.name ? await resolveCompany(provider, company.name, [domainLabel(company)]) : null;
      if (match) resolved.push(match);
    });

    let added = 0;
    for (const company of resolved) {
      if (!companies.has(companyKey(company))) {
        companies.set(companyKey(company), company);
        added++;
      }
    }
    console.log(`${provider}: ${found.length} from TheirStack, ${resolved.length} with open jobs, ${added} new`);
  } catch (error) {
    // Keep going so one failing provider (e.g. out of credits) doesn't lose the others' results
    console.error(`${provider}: ${(error as Error).message}`);
  }
}

await writeCompanies(companies.values());
console.log(`Saved ${companies.size} companies`);
