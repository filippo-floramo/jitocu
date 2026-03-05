import type { ClickUpTaskStatus } from "./task";

export interface CreateTimeEntryPayload {
  start: number;
  end: number;
  stop: number;
  duration: number;
  tid: string;
}

export interface ClickUpTimeEntriesResponse {
  data: ClickUpTimeEntry[];
}

export interface ClickUpTimeEntry {
  id: string;
  task: ClickUpTimeEntryTask;
  wid: string;
  user: ClickUpUser;
  billable: boolean;
  start: string;
  end: string;
  duration: string;
  description: string;
  tags: unknown[];
  source: string;
  at: string;
  is_locked: boolean;
  approval_id: unknown;
  task_location: ClickUpTaskLocation;
  task_url: string;
}

export interface ClickUpTimeEntryTask {
  id: string;
  name: string;
  status: ClickUpTaskStatus;
  custom_type: unknown;
}

export interface ClickUpUser {
  id: number;
  username: string;
  email: string;
  color: string;
  initials: string;
  profilePicture: unknown;
}

export interface ClickUpTaskLocation {
  list_id: string;
  folder_id: string;
  space_id: string;
}
