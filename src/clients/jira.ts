import type { JiraSearchResponse, JiraIssueChoice } from "../types";

/**
 * Fetch all Jira issues assigned to the current user
 */
export async function fetchMyJiraIssues(): Promise<JiraIssueChoice[]> {
  const domain = process.env.JIRA_DOMAIN;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!domain || !email || !apiToken) {
    throw new Error('Missing Jira configuration');
  }

  try {
    const jql = 'assignee=currentUser() ORDER BY updated DESC';
    const url = `https://${domain}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,description,status,issuetype,priority,labels`;

    const auth = btoa(`${email}:${apiToken}`);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Jira API error (${response.status}): ${error}`);
    }

    const data: JiraSearchResponse = await response.json();

    return data.issues.map((issue): JiraIssueChoice => ({
      name: `${issue.key} - ${issue.fields.summary}`,
      value: issue.fields.summary
    }));
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Jira issues: ${error.message}`);
    }
    throw error;
  }
}
