import type { Store } from "../../store/store";
import { ClickUpAPI } from "./api";
import fuzzy from 'fuzzy';
import { ClickUpTask, CreateTimeEntryPayload } from "./types";
import { CLIError } from "../../errors";
import { mapTimeEntries } from "../../helpers/mapTimeEntries";
import type { JiraIssueChoiceValue } from "../jira/types";
import { requireSetting } from "../../store/utils/settingAccess";

export class ClickUpService {
   private api: ClickUpAPI | null = null;

   constructor(private store: Store) { }

   private getApi(): ClickUpAPI {
      if (!this.api) {
         this.api = new ClickUpAPI({
            workspaceId: requireSetting(this.store, "clickUp.workspaceId"),
            apiToken: requireSetting(this.store, "clickUp.apiToken")
         })
      }
      return this.api;
   }

   public async createTaskAssignedToMe(issue: JiraIssueChoiceValue, listId: string): Promise<ClickUpTask> {
      const user = await this.getApi().getAuthorizedUser()
      const myTasks = await this.getApi().getTasksByListId(listId, String(user.id));
      const isIssueAlreadyCopied = myTasks.some(
         (tsk) => tsk.name === issue.key || tsk.name.startsWith(`${issue.key} - `)
      );

      if (isIssueAlreadyCopied) {
         throw new CLIError(`Issue "${issue.key}" already exists in this list. Delete the existing task or use a different issue.`);
      }
      return await this.getApi().createTaskByListId(`${issue.key} - ${issue.summary}`, listId, user.id)
   }

   public async getTimeEntries(range: { start: number, end: number }) {
      const entries = await this.getApi().getTimeEntries(range)

      return mapTimeEntries(entries)
   }

   public async createTimeEntry(body: CreateTimeEntryPayload) {
      return await this.getApi().createTimeEntry(body)
   }

   public async getTasksByListId(listId: string) {
      const user = await this.getApi().getAuthorizedUser()
      const myTasks = await this.getApi().getTasksByListId(listId, String(user.id));
      return myTasks
   }

   public async getMySharedFolders() {
      return await this.getApi().getSharedFolders()
   }

   public async getListByName(listName: string) {
      const folders = await this.getApi().getSharedFolders();

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
