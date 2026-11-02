import { MAX_RETRIES, REQUEST_TIMEOUT_MS, RETRY_BASE_DELAY_MS } from "./config";

export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, url: string) {
    super(`HTTP ${status}: ${url}`);
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryable = (status: number) => status === 429 || status >= 500;

const retryDelay = (attempt: number, retryAfter: string | null) => {
  const seconds = Number(retryAfter);
  return seconds > 0 ? seconds * 1000 : RETRY_BASE_DELAY_MS * 2 ** attempt;
};

/** fetch with a timeout, retrying rate limits, 5xx and network errors with backoff */
export const request = async (url: string, init: RequestInit = {}) => {
  for (let attempt = 0; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
    } catch (error) {
      if (attempt >= MAX_RETRIES) throw error;
      await sleep(retryDelay(attempt, null));
      continue;
    }

    if (res.ok || !isRetryable(res.status) || attempt >= MAX_RETRIES) return res;
    await res.body?.cancel();
    await sleep(retryDelay(attempt, res.headers.get("retry-after")));
  }
};

export const fetchJsonWithHeaders = async <T>(url: string, init?: RequestInit) => {
  const res = await request(url, init);
  if (!res.ok) {
    await res.body?.cancel();
    throw new HttpError(res.status, url);
  }
  return { data: (await res.json()) as T, headers: res.headers };
};

export const fetchJson = async <T>(url: string, init?: RequestInit): Promise<T> =>
  (await fetchJsonWithHeaders<T>(url, init)).data;

/** Like fetchJson, but a missing board (404, or a redirect when not following them) resolves to null */
export const fetchJsonOrNull = async <T>(url: string, init?: RequestInit): Promise<T | null> => {
  try {
    return await fetchJson<T>(url, init);
  } catch (error) {
    if (error instanceof HttpError && (error.status === 404 || (error.status >= 300 && error.status < 400))) {
      return null;
    }
    throw error;
  }
};
