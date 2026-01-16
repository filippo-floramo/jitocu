import type { JiraSearchResponse, JiraIssueChoice } from "./types";

class JiraAPIClient {
   private domain = process.env.JIRA_DOMAIN;
   private email = process.env.JIRA_EMAIL;
   private apiToken = process.env.JIRA_API_TOKEN;
   private baseUrl = `https://${this.domain}/rest/api/3`


   constructor() { }

   public async fetchMyJiraIssues(): Promise<JiraIssueChoice[]> {

      if (!this.domain || !this.email || !this.apiToken) {
         throw new Error('Missing Jira configuration');
      }

      try {
         const jql = 'assignee=currentUser() ORDER BY updated DESC';
         const url = `${this.baseUrl}/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,description,status,issuetype,priority,labels`;

         const auth = btoa(`${this.email}:${this.apiToken}`);

         const response = await fetch(url, {
            headers: {
               'Authorization': `Basic ${auth}`,
               'Accept': 'application/json',
               'Content-Type': 'application/json'
            }
         });

         if (!response.ok) {
            const error = await response.text();
            throw new Error(`Jira API error (${response.status}): ${error}`);
         }

         const data: JiraSearchResponse = await response.json();

         return data.issues.map((issue): JiraIssueChoice => ({
            name: `${issue.key} - ${issue.fields.summary}`,
            value: issue.fields.summary
         }));
      } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to fetch Jira issues: ${error.message}`);
         }
         throw error;
      }
   }
}


export function createJiraClient() {
   return new JiraAPIClient()
}