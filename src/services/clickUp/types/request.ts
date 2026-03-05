export interface ClickUpCreateTaskRequest {
  name: string;
  assignees: number[];
  description?: string;
  tags?: string[];
  priority?: number;
}
