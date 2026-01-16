export interface JiraIssueChoice {
   name: string;
   value: string;
}

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