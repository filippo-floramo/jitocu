import chalk from "chalk";
import { settingPathsMap } from "../constants";

/**
 * Validates if a given path exists in the settings map.
 * If invalid, displays error message and valid paths.
 * @param path - The setting path to validate
 * @returns true if valid, false if invalid
 */
export function validateSettingPath(path: string): boolean {
   return !!settingPathsMap[path as keyof typeof settingPathsMap]
}
