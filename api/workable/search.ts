import { handleWorkableSearch } from "../../server/handlers.js";

export function GET(request: Request) {
  return handleWorkableSearch(new URL(request.url));
}
