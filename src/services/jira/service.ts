import type { Store } from "../../store/store";
import { JiraAPI } from "./api";

export class JiraService {
   private api: JiraAPI | null = null;

   constructor(private store: Store) { }

   private getApi(): JiraAPI {
      if (!this.api) {
         const domain = this.store.get("settings.jira.domain") as string;
         const email = this.store.get("settings.jira.email") as string;
         const apiToken = this.store.get("settings.jira.apiToken") as string;

         this.api = new JiraAPI({
            domain,
            email,
            apiToken
         })
      }
      return this.api;
   }

   public async getMyIssuesByKey(key: string) {
      return await this.getApi().fetchJiraIssues(key)
   }

   public async getMyIssues() {
      return await this.getApi().fetchJiraIssues();
   }
}
