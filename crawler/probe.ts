import type { Company, Provider } from "../src/types";
import { fetchJsonOrNull, request } from "./http";
import { BAMBOO_INIT, bambooListUrl } from "./providers/bamboohr";
import { breezyListUrl, type BreezyJob } from "./providers/breezy";
import { joinJobsUrl } from "./providers/join";

type Resolver = (slug: string, name: string) => Promise<Company | null>;

const SUBDOMAIN = /^[a-z0-9][a-z0-9-]*$/;

const joinCompanyFromPage = async (slug: string) => {
  const res = await request(`https://join.com/companies/${encodeURIComponent(slug)}`);
  if (!res.ok) {
    await res.body?.cancel();
    return null;
  }
  // The numeric company id the jobs API needs only appears in the page's Next.js state
  const match = (await res.text()).match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  const company = match ? JSON.parse(match[1]).props?.pageProps?.initialState?.company : null;
  return company?.id ? { id: String(company.id), name: company.name as string, domain: company.domain as string } : null;
};

/** Each resolver checks one slug guess and returns the company if that board exists and has open jobs */
export const RESOLVERS: Record<Exclude<Provider, "workable">, Resolver> = {
  ashby: async (slug, name) => {
    const data = await fetchJsonOrNull<{ jobs: unknown[] }>(
      `https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}`,
    );
    return data?.jobs.length ? { name, slug, provider: "ashby" } : null;
  },
  greenhouse: async (slug, name) => {
    const data = await fetchJsonOrNull<{ jobs: unknown[] }>(
      `https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs`,
    );
    return data?.jobs.length ? { name, slug, provider: "greenhouse" } : null;
  },
  lever: async (slug, name) => {
    const data = await fetchJsonOrNull<unknown[]>(
      `https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json&limit=1`,
    );
    return data?.length ? { name, slug, provider: "lever" } : null;
  },
  smartrecruiters: async (slug, name) => {
    const data = await fetchJsonOrNull<{ totalFound: number; content: { company?: { name?: string } }[] }>(
      `https://api.smartrecruiters.com/v1/companies/${encodeURIComponent(slug)}/postings?limit=1`,
    );
    return data?.totalFound
      ? { name: data.content[0]?.company?.name || name, slug, provider: "smartrecruiters" }
      : null;
  },
  bamboohr: async (slug, name) => {
    if (!SUBDOMAIN.test(slug)) return null;
    const data = await fetchJsonOrNull<{ result?: unknown[] }>(bambooListUrl(slug), BAMBOO_INIT);
    return data?.result?.length ? { name, slug, provider: "bamboohr" } : null;
  },
  breezy: async (slug, name) => {
    if (!SUBDOMAIN.test(slug)) return null;
    const data = await fetchJsonOrNull<BreezyJob[]>(breezyListUrl(slug));
    return data?.length ? { name: data[0].company?.name || name, slug, provider: "breezy" } : null;
  },
  join: async (slug, name) => {
    const company = await joinCompanyFromPage(slug);
    if (!company) return null;
    const jobs = await fetchJsonOrNull<{ items: unknown[] }>(joinJobsUrl(company.id, 1));
    return jobs?.items.length
      ? { name: company.name || name, slug: company.domain || slug, provider: "join", externalId: company.id }
      : null;
  },
};

/** Board slugs are usually derived from the company name or domain; try the common conventions */
export const slugCandidates = (name: string, hints: string[] = []) => {
  const trimmed = name.trim();
  return [
    ...new Set(
      [
        ...hints,
        trimmed.toLowerCase().replace(/[^a-z0-9]/g, ""),
        trimmed.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        trimmed.replace(/[^A-Za-z0-9]/g, ""),
      ].filter(Boolean),
    ),
  ];
};

export const resolveCompany = async (provider: keyof typeof RESOLVERS, name: string, hints: string[] = []) => {
  for (const slug of slugCandidates(name, hints)) {
    try {
      const company = await RESOLVERS[provider](slug, name);
      if (company) return company;
    } catch {
      // An unreachable guess is just a miss; keep trying the other candidates
    }
  }
  return null;
};
