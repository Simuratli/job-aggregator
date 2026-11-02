import type { IncomingMessage, ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import type { Company, JobsStreamMessage, Provider, Workplace } from "../src/types";
import { getBoardJobs } from "./boardCache";
import { FETCH_CONCURRENCY } from "./config";
import { readCompanies } from "./files";
import { runPool } from "./pool";
import { BOARD_FETCHERS } from "./providers";
import { searchWorkable, WORKABLE_WORKPLACE_PARAM } from "./workableSearch";

/**
 * GET /api/jobs/stream
 * Fetches every board in companies.json live (cached per board for a while) and streams each board's
 * jobs as one NDJSON line the moment it arrives, so the page fills in progressively.
 */
const streamJobs = async (req: IncomingMessage, res: ServerResponse) => {
  const companies = (await readCompanies()).filter((company) => BOARD_FETCHERS[company.provider]);
  const byProvider = new Map<Provider, Company[]>();
  for (const company of companies) {
    byProvider.set(company.provider, [...(byProvider.get(company.provider) ?? []), company]);
  }

  let closed = false;
  req.on("close", () => (closed = true));
  const send = (message: JobsStreamMessage) => {
    if (!closed) res.write(`${JSON.stringify(message)}\n`);
  };

  res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" });
  send({ type: "start", boards: companies.length });

  await Promise.all(
    [...byProvider].map(([provider, list]) =>
      runPool(list, FETCH_CONCURRENCY[provider], async (company) => {
        if (closed) return;
        try {
          const jobs = await getBoardJobs(company);
          if (jobs.length) send({ type: "board", provider, jobs });
          else send({ type: "failed", provider, slug: company.slug });
        } catch {
          send({ type: "failed", provider, slug: company.slug });
        }
      }),
    ),
  );

  send({ type: "done" });
  res.end();
};

/** GET /api/workable/search?query=&location=&workplace= */
const workableSearch = async (url: URL, res: ServerResponse) => {
  try {
    const workplace = url.searchParams.get("workplace") as Workplace | null;
    const result = await searchWorkable({
      query: url.searchParams.get("query") ?? "",
      location: url.searchParams.get("location") ?? "",
      workplace: workplace ? WORKABLE_WORKPLACE_PARAM[workplace] : undefined,
    });
    res.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify(result));
  } catch (error) {
    res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
    res.end(JSON.stringify({ error: (error as Error).message }));
  }
};

const handler: Connect.NextHandleFunction = (req, res, next) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (req.method === "GET" && url.pathname === "/api/jobs/stream") return void streamJobs(req, res);
  if (req.method === "GET" && url.pathname === "/api/workable/search") return void workableSearch(url, res);
  next();
};

/**
 * The job boards are called server-side: Workable search and BambooHR send no CORS headers, and
 * Lever returns every full description, which is far too much to download in a browser.
 * Runs inside `vite dev` and `vite preview`.
 */
export const jobsApi = (): Plugin => ({
  name: "jobs-api",
  configureServer(server) {
    server.middlewares.use(handler);
  },
  configurePreviewServer(server) {
    server.middlewares.use(handler);
  },
});
