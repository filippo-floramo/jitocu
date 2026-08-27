import { settingPathsMap } from "../constants";
import type { SettingPath } from "../types";

interface SettingValueRule {
   isValid: (value: string) => boolean;
   hint: string;
}

const hostPattern = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const noWhitespacePattern = /^\S+$/;
const numericPattern = /^\d+$/;

const rules: Record<SettingPath, SettingValueRule> = {
   "jira.domain": {
      isValid: (value) => hostPattern.test(value),
      hint: "Expected a bare host, e.g. 'example.atlassian.net'"
   },
   "jira.email": {
      isValid: (value) => emailPattern.test(value),
      hint: "Expected an email address, e.g. 'me@example.com'"
   },
   "jira.apiToken": {
      isValid: (value) => noWhitespacePattern.test(value),
      hint: "Expected a token with no spaces"
   },
   "clickUp.workspaceId": {
      isValid: (value) => numericPattern.test(value),
      hint: "Expected a numeric workspace id, e.g. '9012345678'"
   },
   "clickUp.apiToken": {
      isValid: (value) => noWhitespacePattern.test(value),
      hint: "Expected a token with no spaces, e.g. 'pk_...'"
   }
};

/**
 * Cleans up a raw CLI value: trims surrounding whitespace, and for the Jira
 * domain drops a pasted protocol prefix and trailing slash, since the API layer
 * prepends "https://" itself.
 */
export function normalizeSettingValue(path: SettingPath, value: string): string {
   const trimmed = (value ?? "").trim();

   if (path === "jira.domain") {
      return trimmed.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
   }
   return trimmed;
}

/**
 * Returns an error message when `value` cannot be used for `path`, else null.
 * Never echoes the value back, so secrets stay out of error output.
 */
export function validateSettingValue(path: SettingPath, value: string): string | null {
   if (value.length === 0) {
      return `${settingPathsMap[path]} cannot be empty`;
   }

   const rule = rules[path];
   return rule.isValid(value) ? null : `Invalid value for ${path}. ${rule.hint}`;
}
