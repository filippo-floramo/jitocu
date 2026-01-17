import { baseSettingsPath } from "../constants";
import { getJSONStore } from "../JSONStore";
import { MandatorySettingsPath } from "../types";


const mandatorySettingsPaths: MandatorySettingsPath[] = [
   "jira.domain",
   "jira.apiToken",
   "jira.email",
   "clickUp.workspaceId",
   "clickUp.apiToken"
]

export async function getMissingRequiredSettings(): Promise<MandatorySettingsPath[]> {
   const store = getJSONStore();
   let missing: MandatorySettingsPath[] = [];

   for (const path of mandatorySettingsPaths) {
      if (!(await store.hasPath(`${baseSettingsPath}.${path}`))) {
         missing.push(path)
      }
   }
   return missing
}