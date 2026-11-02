import { handleJobs } from "../server/handlers.js";

export function GET(request: Request) {
  return handleJobs(new URL(request.url));
}
