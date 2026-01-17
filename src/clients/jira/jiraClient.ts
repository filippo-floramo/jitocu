import JsonStore from "../../store/JSONStore";
import type { JiraSearchResponse, JiraIssueChoice } from "./types";

class JiraAPIClient {
   public static instance: JiraAPIClient
   private domain: string | undefined;
   private email: string | undefined;
   private apiToken: string | undefined;
   private baseUrl: string = "https://api.atlassian.net/rest/api/3"
   private store: JsonStore;


   constructor(store: JsonStore) {
      this.store = store
   }

   public async initialize(): Promise<void> {
      this.domain = await this.store.getPath("settings.jira.domain");
      this.email = await this.store.getPath("settings.jira.email");
      this.apiToken = await this.store.getPath("settings.jira.apiToken");
      this.baseUrl = `https://${this.domain}/rest/api/3`;
   }

   public static async getInstance(store: JsonStore): Promise<JiraAPIClient> {
      if (!JiraAPIClient.instance) {
         const newClient = new JiraAPIClient(store);
         await newClient.initialize();

         JiraAPIClient.instance = newClient
      }
      return JiraAPIClient.instance
   }

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

         const data = await response.json() as JiraSearchResponse;

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


export async function getJiraClient(store: JsonStore) {
   const client = await JiraAPIClient.getInstance(store);
   return client;
}