import { baseSettingsPath } from "../constants";
import type { Store } from "../store";
import type { SettingPath } from "../types";
import { ConfigError } from "../../errors";
import { showMissingSettignsPaths } from "./showMissingSettingsPaths";

/** A fully-qualified store key, e.g. "settings.jira.domain". */
export type FullSettingPath = `${typeof baseSettingsPath}.${SettingPath}`;

export function fullSettingPath(path: SettingPath): FullSettingPath {
   return `${baseSettingsPath}.${path}`;
}

/**
 * conf's dot-notation key types only reach the top level of the store shape,
 * so our nested settings paths are unreachable through them. This interface is
 * the single place that widens the key type; every caller elsewhere goes
 * through the typed helpers below with a SettingPath.
 */
interface NestedPathStore {
   get(key: FullSettingPath): string | undefined;
   set(key: FullSettingPath, value: string): void;
   has(key: FullSettingPath): boolean;
}

function nested(store: Store): NestedPathStore {
   return store as unknown as NestedPathStore;
}

export function getSetting(store: Store, path: SettingPath): string | undefined {
   return nested(store).get(fullSettingPath(path));
}

export function setSetting(store: Store, path: SettingPath, value: string): void {
   nested(store).set(fullSettingPath(path), value);
}

export function hasSetting(store: Store, path: SettingPath): boolean {
   return nested(store).has(fullSettingPath(path));
}

/**
 * Reads a setting that must be present, throwing a ConfigError instead of
 * handing a downstream API an undefined value typed as string. Also rejects an
 * empty value, which `has` reports as present.
 */
export function requireSetting(store: Store, path: SettingPath): string {
   const value = getSetting(store, path);

   if (value === undefined || value.trim().length === 0) {
      throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths([path]));
   }
   return value;
}
