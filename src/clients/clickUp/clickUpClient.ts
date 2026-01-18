import { JSONStore } from '../../store/JSONStore';
import type { ClickUpTask, ClickUpCreateTaskRequest, ClickUpFolder, ClickUpUser } from './types';
import fuzzy from 'fuzzy';


class ClickUpAPIClient {
   public static instance: ClickUpAPIClient
   private workspaceId: string | undefined;
   private apiToken: string | undefined;
   private baseUrl: string = "https://api.clickup.com/api/v2"
   private cachedUser: ClickUpUser | null = null
   private store: JSONStore;

   constructor(store: JSONStore) {
      this.store = store;
   }

   public async initialize(): Promise<void> {
      this.workspaceId = await this.store.getPath("settings.clickUp.workspaceId");
      this.apiToken = await this.store.getPath("settings.clickUp.apiToken");
   }

   public static async getInstance(store: JSONStore): Promise<ClickUpAPIClient> {
      if (!ClickUpAPIClient.instance) {
         const newCLient = new ClickUpAPIClient(store);
         await newCLient.initialize();

         ClickUpAPIClient.instance = newCLient
      }
      return ClickUpAPIClient.instance
   }

   public async createTask(issue: string, listId: string): Promise<ClickUpTask> {
      const user = await this.getAuthorizedUser();

      if (!this.apiToken || !listId) {
         throw new Error('Missing ClickUp configuration');
      }

      try {
         const url = `${this.baseUrl}/list/${listId}/task`;

         const taskData: ClickUpCreateTaskRequest = {
            name: issue,
            assignees: [user.id]
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
            throw new Error(`ClickUp API error (${response.status}): ${error}`);
         }

         const data = await response.json() as ClickUpTask
         return data;
      } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to create ClickUp task: ${error.message}`);
         }
         throw error;
      }
   }

   public async getSharedFolders(): Promise<ClickUpFolder[]> {
      if (!this.apiToken) {
         throw new Error('Missing ClickUp API token');
      }

      try {
         const url = `${this.baseUrl}/team/${this.workspaceId}/shared`;
         const response = await fetch(url, {
            headers: {
               'Authorization': this.apiToken
            }
         });

         if (!response.ok) {
            throw new Error(`ClickUp API error (${response.status}): ${response.statusText}`);
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

      } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to fetch lists: ${error.message}`);
         }
         throw error;
      }
   }



   public async getListByName(listName: string) {
      const folders = await this.getSharedFolders();

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

   public async getAuthorizedUser(): Promise<ClickUpUser> {

      if (!this.apiToken) {
         throw new Error('Missing ClickUp API token');
      }

      if (this.cachedUser) return this.cachedUser;

      try {
         const url = `${this.baseUrl}/user`;

         const response = await fetch(url, {
            headers: {
               'Authorization': this.apiToken
            }
         });

         if (!response.ok) {
            throw new Error(`ClickUp API error (${response.status}): ${response.statusText}`);
         }

         const data = await response.json() as any;

         this.cachedUser = data.user

         return this.cachedUser!;
      } catch (error) {
         if (error instanceof Error) {
            throw new Error(`Failed to fetch user: ${error.message}`);
         }
         throw error;
      }
   }
}


export async function getClickUpClient(store: JSONStore) {
   const client = await ClickUpAPIClient.getInstance(store);
   return client;
}