export interface ClickUpTasksResponse {
  tasks: ClickUpTask[];
}

export interface ClickUpTask {
  id: string;
  custom_id: unknown;
  custom_item_id: number;
  name: string;
  text_content: string;
  description: string;
  status: ClickUpTaskStatus;
  orderindex: string;
  date_created: string;
  date_updated: string;
  date_closed: unknown;
  date_done: unknown;
  archived: boolean;
  creator: ClickUpCreator;
  assignees: ClickUpAssignee[];
  group_assignees: unknown[];
  watchers: ClickUpWatcher[];
  checklists: unknown[];
  tags: unknown[];
  parent: unknown;
  top_level_parent: unknown;
  priority: unknown;
  due_date: unknown;
  start_date: unknown;
  points: unknown;
  time_estimate: unknown;
  time_spent: number;
  custom_fields: unknown[];
  dependencies: unknown[];
  linked_tasks: unknown[];
  locations: unknown[];
  team_id: string;
  url: string;
  sharing: ClickUpSharing;
  permission_level: string;
  list: ClickUpListRef;
  project: ClickUpProjectRef;
  folder: ClickUpFolderRef;
  space: ClickUpSpaceRef;
}

export interface ClickUpTaskStatus {
  status: string;
  id: string;
  color: string;
  type: string;
  orderindex: number;
}

export interface ClickUpCreator {
  id: number;
  username: string;
  color: string;
  email: string;
  profilePicture: unknown;
}

export interface ClickUpAssignee {
  id: number;
  username: string;
  color: string;
  initials: string;
  email: string;
  profilePicture: unknown;
}

export interface ClickUpWatcher {
  id: number;
  username: string;
  color: string;
  initials: string;
  email: string;
  profilePicture: unknown;
}

export interface ClickUpSharing {
  public: boolean;
  public_share_expires_on: unknown;
  public_fields: string[];
  token: unknown;
  seo_optimized: boolean;
}

export interface ClickUpListRef {
  id: string;
  name: string;
  access: boolean;
}

export interface ClickUpProjectRef {
  id: string;
  name: string;
  hidden: boolean;
  access: boolean;
}

export interface ClickUpFolderRef {
  id: string;
  name: string;
  hidden: boolean;
  access: boolean;
}

export interface ClickUpSpaceRef {
  id: string;
}
