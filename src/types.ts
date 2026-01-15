// Jira Types
export interface JiraIssue {
  id: string;
  key: string;
  fields: JiraFields;
}

export interface JiraFields {
  summary: string;
  description?: string | JiraADF;
  status: JiraStatus;
  issuetype: JiraIssueType;
  priority?: JiraPriority;
  labels: string[];
}

export interface JiraStatus {
  name: string;
}

export interface JiraIssueType {
  name: string;
}

export interface JiraPriority {
  name: string;
}

export interface JiraADF {
  type: string;
  version: number;
  content?: JiraADFNode[];
}

export interface JiraADFNode {
  type: string;
  text?: string;
  content?: JiraADFNode[];
}

export interface JiraSearchResponse {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
}

// ClickUp Types
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

// ClickUp Folder/List Types
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

// UI Types
export interface JiraIssueChoice {
  name: string;
  value: string;
}

export interface IssueItem {
  label: string;
  value: JiraIssue;
  key: string;
  summary: string;
  status: string;
  type: string;
}