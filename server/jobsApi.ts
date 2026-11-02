import type { ServerResponse } from "node:http";
import type { Connect, Plugin } from "vite";
import { handleJobs, handleWorkableSearch } from "./handlers.js";

const ROUTES: Record<string, (url: URL) => Promise<Response>> = {
  "/api/jobs": handleJobs,
  "/api/workable/search": handleWorkableSearch,
};

const send = async (response: Response, res: ServerResponse) => {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(Buffer.from(await response.arrayBuffer()));
};

const handler: Connect.NextHandleFunction = (req, res, next) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  const route = req.method === "GET" ? ROUTES[url.pathname] : undefined;
  if (!route) return next();
  void route(url).then((response) => send(response, res));
};

/**
 * Serves the same handlers as the Vercel functions in api/ inside `vite dev` and `vite preview`,
 * so the app works locally without the Vercel CLI.
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
