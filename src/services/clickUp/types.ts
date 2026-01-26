export interface ClickUpTask {
  id: string;
  name: string;
  description?: string;
  status: {
    status: string;
  };
  url: string;
}

export interface ClickUpCreateTaskRequest {
  name: string;
  assignees: number[]
  description?: string;
  tags?: string[];
  priority?: number;
}

export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  lists: ClickUpList[];
}

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string;
  profilePicture: string | null;
}