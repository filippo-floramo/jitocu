import type { Store } from "../../store/store";
import { JiraAPI } from "./api";
import { requireSetting } from "../../store/utils/settingAccess";

export class JiraService {
   private api: JiraAPI | null = null;

   constructor(private store: Store) { }

   private getApi(): JiraAPI {
      if (!this.api) {
         this.api = new JiraAPI({
            domain: requireSetting(this.store, "jira.domain"),
            email: requireSetting(this.store, "jira.email"),
            apiToken: requireSetting(this.store, "jira.apiToken")
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
