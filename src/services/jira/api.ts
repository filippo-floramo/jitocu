import { APIError } from "../../errors";
import { JSONStore } from "../../store/JSONStore";
import type { JiraSearchResponse, JiraIssueChoice } from "./types";

export class JiraAPI {
   private domain: string;
   private email: string;
   private apiToken: string;
   private baseUrl: string = "https://api.atlassian.net/rest/api/3"
   private auth: string;


   constructor({ domain, email, apiToken }: { domain: string, email: string, apiToken: string }) {
      if (!apiToken || !email || !apiToken) {
         throw new Error('Missing Jira configuration');
      }

      this.domain = domain;
      this.apiToken = apiToken;
      this.email = email;
      this.auth = btoa(`${this.email}:${this.apiToken}`);
      this.baseUrl = `https://${this.domain}/rest/api/3`;
   }

   public async fetchJiraIssues(key?: string): Promise<JiraIssueChoice[]> {
      const baseJql = `assignee=currentUser() ${key ? `AND key=${key}` : ""}`
      const jqlQuery = `${baseJql} ORDER BY updated DESC`;
      const url = `${this.baseUrl}/search/jql?jql=${encodeURIComponent(jqlQuery)}&maxResults=50&fields=summary,description,status,issuetype,priority,labels`;

      const response = await fetch(url, {
         headers: {
            'Authorization': `Basic ${this.auth}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json'
         }
      });

      if (!response.ok) {
         const error = await response.text();
         throw new APIError(`Jira API error. Faled to fetch issues (${response.status}): ${error}`);
      }

      const data = await response.json() as JiraSearchResponse;
      return data.issues.map((issue): JiraIssueChoice => ({
         name: `${issue.key} - ${issue.fields.summary}`,
         value: issue.fields.summary
      }));

   }
}