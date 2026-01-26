import { getJSONStore } from "../../store/JSONStore";
import { ClickUpAPI } from "./api";
import fuzzy from 'fuzzy';
import { ClickUpTask } from "./types";
import { CLIError } from "../../errors";



export class ClickUpService {
   private api!: ClickUpAPI;
   private store = getJSONStore();
   public static instance: ClickUpService

   private constructor() { }

   private async initialize(): Promise<void> {
      const workspaceId = await this.store.getPath("settings.clickUp.workspaceId") as string;
      const apiToken = await this.store.getPath("settings.clickUp.apiToken") as string;
      this.api = new ClickUpAPI({ workspaceId, apiToken })
   }

   public static async getInstance(): Promise<ClickUpService> {
      if (!ClickUpService.instance) {
         const newService = new ClickUpService();
         await newService.initialize();
         ClickUpService.instance = newService
      }
      return ClickUpService.instance
   }

   public async createTaskAssignedToMe(issue: string, listId: string): Promise<ClickUpTask> {
      const user = await this.api.getAuthorizedUser()
      const myTasks = await this.api.getTasksByListId(listId, String(user.id));
      const isIssueAlreadyCopied = !!myTasks.find((tsk: any) => tsk.name === issue)

      if (isIssueAlreadyCopied) {
         throw new CLIError(`Issue "${issue}" already exists in this list. Delete the existing task or use a different issue.`);
      }
      return await this.api.createTaskByListId(issue, listId, user.id)
   }

   public async getMySharedFolders() {
      return await this.api.getSharedFolders()
   }

   public async getListByName(listName: string) {
      const folders = await this.api.getSharedFolders();

      const mapped = folders.flatMap((fold) => {
         const listNames = fold.lists.map((list) => {
            return { name: `${fold.name} -> ${list.name}`, value: list.id }
         })

         return listNames
      });

      const res = fuzzy
         .filter(listName, mapped, { extract: (val) => val.name })
         .map((res) => res.original)
      return res
   }
}