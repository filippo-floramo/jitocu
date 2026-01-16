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


interface JiraSettings {
   domain: string,
   email: string,
   apiToken: string;
}

interface ClickUpSettings {
   apiToken: string;
   workspaceId: string
}

