import type { ClickUpTask, ClickUpCreateTaskRequest, ClickUpFolder, ClickUpUser } from '../types';


export async function createClickUpTask(issue: string, listId: string): Promise<ClickUpTask> {
  const apiToken = process.env.CLICKUP_API_TOKEN;

  const user = await getAuthorizedUser();

  if (!apiToken || !listId) {
    throw new Error('Missing ClickUp configuration');
  }

  try {
    const url = `https://api.clickup.com/api/v2/list/${listId}/task`;

    const taskData: ClickUpCreateTaskRequest = {
      name: issue,
      assignees: [user.id]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': apiToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ClickUp API error (${response.status}): ${error}`);
    }

    const data: ClickUpTask = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to create ClickUp task: ${error.message}`);
    }
    throw error;
  }
}

export async function getSharedFolders(workspaceId: string): Promise<ClickUpFolder[]> {
  const apiToken = process.env.CLICKUP_API_TOKEN;

  if (!apiToken) {
    throw new Error('Missing ClickUp API token');
  }

  try {
    const url = `https://api.clickup.com/api/v2/team/${workspaceId}/shared`;

    const response = await fetch(url, {
      headers: {
        'Authorization': apiToken
      }
    });

    if (!response.ok) {
      throw new Error(`ClickUp API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();

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

export async function getAuthorizedUser(): Promise<ClickUpUser> {
  const apiToken = process.env.CLICKUP_API_TOKEN;

  if (!apiToken) {
    throw new Error('Missing ClickUp API token');
  }

  try {
    const url = `https://api.clickup.com/api/v2/user`;

    const response = await fetch(url, {
      headers: {
        'Authorization': apiToken
      }
    });

    if (!response.ok) {
      throw new Error(`ClickUp API error (${response.status}): ${response.statusText}`);
    }

    const data = await response.json();

    return data.user;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch user: ${error.message}`);
    }
    throw error;
  }
}
