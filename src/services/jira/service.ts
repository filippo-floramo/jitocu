import { getJSONStore } from "../../store/JSONStore";
import { JiraAPI } from "./api";

export class JiraService {
   private api!: JiraAPI;
   private store = getJSONStore();
   public static instance: JiraService

   private constructor() { }

   public static async getInstance() {
      if (!JiraService.instance) {
         const newService = new JiraService();
         await newService.initialize();
         JiraService.instance = newService
      }
      return JiraService.instance
   }
   public async initialize() {
      const domain = await this.store.getPath("settings.jira.domain") as string;
      const email = await this.store.getPath("settings.jira.email") as string;
      const apiToken = await this.store.getPath("settings.jira.apiToken") as string;

      this.api = new JiraAPI({
         domain,
         email,
         apiToken
      })
   }
   public async getMyIssuesByKey(key: string) {
      return await this.api.fetchJiraIssues(key)
   }

   public async getMyIssues() {
      return await this.api.fetchJiraIssues();
   }
}