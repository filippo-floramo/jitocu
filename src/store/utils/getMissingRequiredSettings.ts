import type { Store } from "../store";
import { MandatorySettingsPath } from "../types";
import { hasSetting } from "./settingAccess";


const mandatorySettingsPaths: MandatorySettingsPath[] = [
   "jira.domain",
   "jira.apiToken",
   "jira.email",
   "clickUp.workspaceId",
   "clickUp.apiToken"
]

export function getMissingRequiredSettings(store: Store): MandatorySettingsPath[] {
   let missing: MandatorySettingsPath[] = [];

   for (const path of mandatorySettingsPaths) {
      if (!hasSetting(store, path)) {
         missing.push(path)
      }
   }
   return missing
}
