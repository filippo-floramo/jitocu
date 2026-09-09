import { MandatorySettingsPath } from "../types"

export const baseSettingsPath = "settings"

export const settingPathsMap: Record<MandatorySettingsPath, string> = {
   "jira.domain": "Jira Domain (Example: 'domain.atlassian.net')",
   "jira.apiToken": "Jira API TOKEN",
   "jira.email": "Jira Email",
   "clickUp.workspaceId": "ClickUp Workspace ID",
   "clickUp.apiToken": "ClickUp API Token"
}

export const clickUpSettingsPaths: MandatorySettingsPath[] = [
   "clickUp.workspaceId",
   "clickUp.apiToken"
]

export const jiraSettingsPaths: MandatorySettingsPath[] = [
   "jira.domain",
   "jira.apiToken",
   "jira.email"
]

/**
 * A group of settings the user either has or hasn't, plus what it unlocks.
 * Commands require only the groups they actually call, so a ClickUp-only setup
 * is enough for `jitocu time`. See `assertConfigured`.
 */
export interface SettingsFeature {
   label: string;
   neededFor: string;
   paths: MandatorySettingsPath[];
}

export const settingsFeatures: SettingsFeature[] = [
   {
      label: "ClickUp",
      neededFor: "every command",
      paths: clickUpSettingsPaths
   },
   {
      label: "Jira",
      neededFor: "jitocu and jitocu create",
      paths: jiraSettingsPaths
   }
]
