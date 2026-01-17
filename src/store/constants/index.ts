import { MandatorySettingsPath } from "../types"

export const baseSettingsPath = "settings"

export const settingPathsMap: Record<MandatorySettingsPath, string> = {
   "jira.domain": "Jira Domain (Example: 'domain.atlassian.net')",
   "jira.apiToken": "Jira API TOKEN",
   "jira.email": "Jira Email",
   "clickUp.workspaceId": "ClickUp Workspace ID",
   "clickUp.apiToken": "ClickUp API Token"
}