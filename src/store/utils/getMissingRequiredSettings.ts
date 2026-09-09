import type { Store } from "../store";
import { MandatorySettingsPath } from "../types";
import { hasSetting } from "./settingAccess";

/**
 * Which paths are required depends on the caller: a command asks for the ones
 * its own APIs need, and `jitocu config` asks feature by feature.
 */
export function getMissingRequiredSettings(
   store: Store,
   paths: MandatorySettingsPath[]
): MandatorySettingsPath[] {
   let missing: MandatorySettingsPath[] = [];

   for (const path of paths) {
      if (!hasSetting(store, path)) {
         missing.push(path)
      }
   }
   return missing
}
