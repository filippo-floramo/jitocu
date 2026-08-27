const SECRET_PATHS = ['settings.jira.apiToken', 'settings.clickUp.apiToken'] as const;

/**
 * ••••••••1234 — fully masked if shorter than the reveal length, so a short
 * value never accidentally exposes its entire content.
 */
export function maskValue(value: string): string {
   const revealLength = 4;
   const minLengthToReveal = 8;
   if (value.length < minLengthToReveal) {
      return '•'.repeat(8);
   }
   return '•'.repeat(8) + value.slice(-revealLength);
}

function maskAtPath(data: any, keys: string[]): void {
   let current = data;
   for (let i = 0; i < keys.length - 1; i++) {
      if (current == null || typeof current !== 'object') {
         return;
      }
      current = current[keys[i]];
   }
   if (current == null || typeof current !== 'object') {
      return;
   }
   const lastKey = keys[keys.length - 1];
   if (typeof current[lastKey] === 'string') {
      current[lastKey] = maskValue(current[lastKey]);
   }
}

/**
 * Deep-clones `data` and masks every field listed in SECRET_PATHS.
 */
export function maskSettings<T>(data: T): T {
   const clone = structuredClone(data);
   for (const secretPath of SECRET_PATHS) {
      maskAtPath(clone, secretPath.split('.'));
   }
   return clone;
}

/**
 * True if `path` is a secret path, or a parent of one — e.g. "settings.jira"
 * is a parent of "settings.jira.apiToken" and must be masked when read.
 */
export function isSecretPathOrParent(path: string): boolean {
   return SECRET_PATHS.some(
      secretPath => secretPath === path || secretPath.startsWith(`${path}.`)
   );
}

export function isSecretPath(path: string): boolean {
   return (SECRET_PATHS as readonly string[]).includes(path);
}

/**
 * Masks `value`, which was read from `path`. Handles both a direct secret
 * leaf (e.g. "settings.jira.apiToken" -> a string) and a parent of one or
 * more secrets (e.g. "settings.jira" -> an object containing apiToken).
 */
export function maskValueAtPath<T>(path: string, value: T): T {
   if (value == null) {
      return value;
   }

   if (isSecretPath(path) && typeof value === 'string') {
      return maskValue(value) as unknown as T;
   }

   if (typeof value === 'object') {
      const clone = structuredClone(value);
      for (const secretPath of SECRET_PATHS) {
         if (secretPath.startsWith(`${path}.`)) {
            const relativeKeys = secretPath.slice(path.length + 1).split('.');
            maskAtPath(clone, relativeKeys);
         }
      }
      return clone;
   }

   return value;
}
