import type { Workplace } from "../src/types";
import { getJobsBatch } from "./jobsBatch.js";
import { searchWorkable, WORKABLE_WORKPLACE_PARAM } from "./workableSearch.js";

// Web-standard handlers, shared by the Vercel functions in api/ and the dev-server plugin

/** Lets Vercel's CDN serve repeat requests for a while instead of re-fetching every board */
const cacheFor = (seconds: number) => ({
  "Cache-Control": `public, max-age=0, s-maxage=${seconds}, stale-while-revalidate=${seconds * 4}`,
});

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  Response.json(body, { status, headers });

/** GET /api/jobs?batch=N */
export const handleJobs = async (url: URL) => {
  try {
    const batch = await getJobsBatch(Number(url.searchParams.get("batch") ?? 0));
    return json(batch, 200, cacheFor(30 * 60));
  } catch (error) {
    const status = error instanceof RangeError ? 404 : 502;
    return json({ error: (error as Error).message }, status);
  }
};

/** GET /api/workable/search?query=&location=&workplace= */
export const handleWorkableSearch = async (url: URL) => {
  try {
    const workplace = url.searchParams.get("workplace") as Workplace | null;
    const result = await searchWorkable({
      query: url.searchParams.get("query") ?? "",
      location: url.searchParams.get("location") ?? "",
      workplace: workplace ? WORKABLE_WORKPLACE_PARAM[workplace] : undefined,
    });
    return json(result, 200, cacheFor(10 * 60));
  } catch (error) {
    return json({ error: (error as Error).message }, 502);
  }
};
