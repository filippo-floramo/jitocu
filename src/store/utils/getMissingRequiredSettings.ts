import { baseSettingsPath } from "../constants";
import type { Store } from "../store";
import { MandatorySettingsPath } from "../types";


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
      if (!store.has(`${baseSettingsPath}.${path}` as any)) {
         missing.push(path)
      }
   }
   return missing
}
