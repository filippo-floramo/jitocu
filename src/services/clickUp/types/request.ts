export interface ClickUpCreateTaskRequest {
  name: string;
  assignees: number[];
  description?: string;
  /** Takes precedence over `description` when both are sent. */
  markdown_content?: string;
  tags?: string[];
  priority?: number;
}
