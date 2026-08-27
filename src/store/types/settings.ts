export interface Settings {
   jira?: JiraSettings,
   clickUp?: ClickUpSettings,
}


export type MandatorySettingsPath =
   | "jira.domain"
   | "jira.apiToken"
   | "jira.email"
   | "clickUp.workspaceId"
   | "clickUp.apiToken"

/**
 * Every settable settings path. All of them are mandatory today, so this is an
 * alias — it exists so path helpers don't have to claim a path is mandatory.
 */
export type SettingPath = MandatorySettingsPath


interface JiraSettings {
   domain: string,
   email: string,
   apiToken: string;
}

interface ClickUpSettings {
   apiToken: string;
   workspaceId: string
}

