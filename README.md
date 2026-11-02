# Job Radar

One search across the public job boards of companies on **Ashby, Greenhouse, Lever, Workable, SmartRecruiters, BambooHR, Breezy HR and JOIN**.

```bash
npm install
npm run dev
```

## How it works

- **Companies are stored, jobs are not.** `public/data/companies.json` lists every company board (`name`, `slug`, `provider`, plus `externalId` for JOIN). It is built once with `npm run directory`.
- **Jobs are fetched live from each provider's API** by a small API that runs inside the Vite server (`server/jobsApi.ts`):
  - `GET /api/jobs/stream` fetches every board in `companies.json` and streams each board's jobs to the browser as one NDJSON line the moment it arrives, so the list fills in progressively. Each board is kept in memory for 30 minutes (`BOARD_CACHE_TTL_MS`), so reopening the page is fast.
  - `GET /api/workable/search?query=&location=&workplace=` searches Workable live. Workable's public search covers every Workable company, so no company list is needed; the first 100 matches for the current search are shown.
- Boards are fetched server-side because Workable search and BambooHR send no CORS headers, and Lever returns every full job description (megabytes per company).
- The list is virtualized, results are merged newest-first as they stream in, and filtering runs on deferred state, so typing stays smooth with hundreds of thousands of jobs.

The API runs in `npm run dev` and `npm run preview`. A static deploy of `dist/` alone has no API; host it with a Node server that mounts the same handlers.

| Provider        | Company list                                        | Live endpoint                                                  |
| --------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Ashby           | LastRound AI ATS Company Directory                  | `jobs.ashbyhq.com/api/non-user-graphql` (no posting dates)     |
| Greenhouse      | LastRound AI ATS Company Directory                  | `boards-api.greenhouse.io/v1/boards/{slug}/jobs`               |
| Lever           | LastRound AI ATS Company Directory                  | `api.lever.co/v0/postings/{slug}`                              |
| Workable        | not needed                                          | `jobs.workable.com/api/v1/jobs` (global search)                |
| SmartRecruiters | known company names probed against the API          | `api.smartrecruiters.com/v1/companies/{slug}/postings`         |
| BambooHR        | known company names probed against the API          | `{slug}.bamboohr.com/careers/list`                             |
| Breezy HR       | known company names probed against the API          | `{slug}.breezy.hr/json`                                        |
| JOIN            | known company names probed; id read from the page   | `join.com/api/public/companies/{id}/jobs`                      |

## Rebuilding the company list

```bash
npm run directory                  # import, verify every board, probe names (slow)
npm run directory -- --skip-probe  # import + verify only
```

The builder keeps everything already in `companies.json`, imports the LastRound directory, drops boards that are gone or have no open jobs, and probes every known company name against SmartRecruiters, BambooHR, Breezy and JOIN (which publish no directory). You can also add a company by hand: the slug is the board's subdomain or last URL segment, e.g. `jobs.ashbyhq.com/linear` → `linear`, `acme.breezy.hr` → `acme`.

`npm run sync:theirstack -- --provider breezy --limit 10` adds companies from TheirStack (needs `THEIRSTACK_API_KEY` in `.env`; each company costs TheirStack credits).

**ADP is not supported:** its career sites are keyed by an opaque client id, and its real API requires a partner contract.

## Attribution

The Ashby, Greenhouse and Lever company list comes from the [LastRound AI ATS Company Directory](https://datahub.io/lastroundai-hiring-data/lastroundai-hiring-data/ats-directory), licensed [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). A copy is in `data/sources/`.
