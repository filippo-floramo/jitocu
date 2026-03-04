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

export interface CratimeEntryPayload {
  start: number
  end: number
  stop: number
  duration: number
  tid: string
}

export interface ClickCupTimeTimeEntriesResponse {
  data: ClickUpTimeEntry[]
}

export interface ClickUpTimeEntry {
  id: string
  task: ClickUpPartialTask
  wid: string
  user: ClickUpUser
  billable: boolean
  start: string
  end: string
  duration: string
  description: string
  tags: any[]
  source: string
  at: string
  is_locked: boolean
  approval_id: any
  task_location: TaskLocation
  task_url: string
}

export interface ClickUpPartialTask {
  id: string
  name: string
  status: ClickUpTaskStatus
  custom_type: any
}

export interface ClickUpTaskStatus {
  status: string
  color: string
  type: string
  orderindex: number
}

export interface ClickUpUser {
  id: number
  username: string
  email: string
  color: string
  initials: string
  profilePicture: any
}

export interface TaskLocation {
  list_id: string
  folder_id: string
  space_id: string
}
