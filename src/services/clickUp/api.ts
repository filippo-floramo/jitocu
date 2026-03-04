import { APIError } from '../../errors';
import type { ClickUpPartialTask, ClickUpCreateTaskRequest, ClickUpFolder, ClickUpUser, CratimeEntryPayload, ClickUpTimeEntry, ClickCupTimeTimeEntriesResponse } from './types';

export class ClickUpAPI {
   private workspaceId: string;
   private apiToken: string;
   private baseUrl: string = "https://api.clickup.com/api/v2"
   private cachedUser: ClickUpUser | null = null

   constructor({ workspaceId, apiToken }: { workspaceId: string, apiToken: string }) {
      if (!apiToken || !workspaceId) {
         throw new Error('Missing ClickUp configuration');
      }
      this.workspaceId = workspaceId;
      this.apiToken = apiToken
   }

   public async createTaskByListId(issue: string, listId: string, userId?: number): Promise<ClickUpPartialTask> {
      if (!listId) {
         throw new Error('Missing ClickUp List Id');
      }
      const url = `${this.baseUrl}/list/${listId}/task`;
      const taskData: ClickUpCreateTaskRequest = {
         name: issue,
         assignees: userId ? [Number(userId)] : []
      };

      const response = await fetch(url, {
         method: 'POST',
         headers: {
            'Authorization': this.apiToken,
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(taskData)
      });

      if (!response.ok) {
         const error = await response.text();
         throw new APIError(`ClickUp API error (${response.status}): ${error}`);
      }

      const data = await response.json() as ClickUpPartialTask
      return data;
   }

   public async getTasksByListId(listId: string, usrId?: string) {
      if (!listId) {
         throw new APIError('Missing ClickUp List Id');
      }

      const queryParm = `?include_closed=true${usrId ? `&assignees[]=${usrId}` : ""}`
      const url = `${this.baseUrl}/list/${listId}/task${queryParm}`;
      const response = await fetch(url, {
         headers: {
            'Authorization': this.apiToken
         },
      });
      if (!response.ok) {
         throw new APIError(`ClickUp API error. Fail to fetch Tasks: (${response.status}): ${response.statusText}`);
      }

      const data = await response.json() as any;
      return data.tasks || [];
   }

   public async createTimeEntry(body: CratimeEntryPayload) {
      const url = `${this.baseUrl}/team/${this.workspaceId}/time_entries`;
      const response = await fetch(url, {
         method: 'POST',
         headers: {
            'Authorization': this.apiToken,
            'Content-Type': 'application/json'
         },
         body: JSON.stringify(body)
      });
      if (!response.ok) {
         throw new APIError(`ClickUp API error. Fail to create time entry: (${response.status}): ${response.statusText}`);
      }
      const data = await response.json() as { data: ClickUpTimeEntry };
      return data.data || {}
   }

   public async getTimeEntries(range: { start: number, end: number }) {
      const queryParam = `?start_date=${range.start}&end_date=${range.end}`
      const url = `${this.baseUrl}/team/${this.workspaceId}/time_entries${queryParam}`;
      const response = await fetch(url, {
         headers: {
            'Authorization': this.apiToken
         }
      });
      if (!response.ok) {
         throw new APIError(`ClickUp API error. Failed to fetch time entries (${response.status}): ${response.statusText}`);
      }
      const data = await response.json() as ClickCupTimeTimeEntriesResponse;
      return data.data
   }

   public async getSharedFolders(): Promise<ClickUpFolder[]> {
      const url = `${this.baseUrl}/team/${this.workspaceId}/shared`;
      const response = await fetch(url, {
         headers: {
            'Authorization': this.apiToken
         }
      });
      if (!response.ok) {
         throw new APIError(`ClickUp API error. Failed to fetch lists (${response.status}): ${response.statusText}`);
      }
      const data = await response.json() as any;
      return data.shared.folders.map((folder: any): ClickUpFolder => ({
         id: folder.id,
         name: folder.name,
         lists: folder.lists.map((list: any) => ({
            id: list.id,
            name: list.name
         }))
      }))

   }

   public async getAuthorizedUser(): Promise<ClickUpUser> {
      if (this.cachedUser) return this.cachedUser;
      const url = `${this.baseUrl}/user`;

      const response = await fetch(url, {
         headers: {
            'Authorization': this.apiToken
         }
      });
      if (!response.ok) {
         throw new APIError(`ClickUp API error. Failed to fetch user (${response.status}): ${response.statusText}`);
      }
      const data = await response.json() as any;
      this.cachedUser = data.user
      return this.cachedUser!;
   }
}


