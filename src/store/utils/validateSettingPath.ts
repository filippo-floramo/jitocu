import { settingPathsMap } from "../constants";
import type { SettingPath } from "../types";

/**
 * Narrows an arbitrary CLI string to a known settings path, so callers can pass
 * it to the typed store helpers without casting.
 * @param path - The setting path to validate
 * @returns true if valid, false if invalid
 */
export function validateSettingPath(path: string): path is SettingPath {
   return Object.hasOwn(settingPathsMap, path)
}
