import chalk from "chalk";
import { APIError } from "../../errors";

type ApiService = "Jira" | "ClickUp";

/** The setting a user should re-check when a host cannot be reached. */
const hostSetting: Record<ApiService, string> = {
   Jira: "jira.domain",
   ClickUp: "clickUp.apiToken"
};

/**
 * Node wraps transport failures as `TypeError: fetch failed` and hides the
 * useful part in `cause`; Bun surfaces it directly. Prefer whichever is real.
 */
function describeFailure(error: unknown): string {
   if (error instanceof Error) {
      const cause = (error as { cause?: unknown }).cause;

      if (cause instanceof Error && cause.message) {
         return cause.message;
      }
      return error.message;
   }
   return String(error);
}

function isHostResolutionFailure(detail: string): boolean {
   return /ENOTFOUND|EAI_AGAIN|ERR_NAME_NOT_RESOLVED/i.test(detail);
}

/**
 * `fetch` with transport failures (offline, DNS, refused, timeout) converted to
 * an APIError, so they reach the user as a real message with a hint instead of
 * a raw Node error reported as an unexpected crash.
 */
export async function apiFetch(service: ApiService, url: string, init?: RequestInit): Promise<Response> {
   try {
      return await fetch(url, init);
   } catch (error) {
      const detail = describeFailure(error);
      const hint = isHostResolutionFailure(detail)
         ? `Could not resolve the ${service} host. Check your '${hostSetting[service]}' setting and your internet connection.`
         : `Could not reach the ${service} API. Check your internet connection and try again.`;

      throw new APIError(`${service} API unreachable: ${detail}`, () => {
         console.error(chalk.gray(hint));
      });
   }
}
