import { describe, test, expect, afterEach, mock } from 'bun:test';
import { JiraService } from '../src/services/jira/service';
import type { Store } from '../src/store/store';

function fakeStore(settings: Record<string, string>): Store {
   return {
      get: (key: string) => settings[key]
   } as unknown as Store;
}

function jiraSearchResponse(issues: Array<{ key: string, summary: string }>) {
   return {
      issues: issues.map(({ key, summary }) => ({
         id: key,
         key,
         fields: { summary, status: { name: 'Open' }, issuetype: { name: 'Task' }, labels: [] }
      })),
      total: issues.length,
      maxResults: 50
   };
}

describe('JiraService', () => {
   const originalFetch = globalThis.fetch;

   afterEach(() => {
      globalThis.fetch = originalFetch;
   });

   function makeService() {
      return new JiraService(fakeStore({
         'settings.jira.domain': 'example.atlassian.net',
         'settings.jira.email': 'me@example.com',
         'settings.jira.apiToken': 'token123'
      }));
   }

   test('getMyIssues maps Jira issues to structured {key, summary} choices', async () => {
      globalThis.fetch = mock(async () => new Response(
         JSON.stringify(jiraSearchResponse([{ key: 'PROJ-1', summary: 'Fix the bug' }])),
         { status: 200 }
      )) as unknown as typeof fetch;

      const issues = await makeService().getMyIssues();

      expect(issues).toEqual([
         { name: 'PROJ-1 - Fix the bug', value: { key: 'PROJ-1', summary: 'Fix the bug' } }
      ]);
   });

   test('getMyIssuesByKey queries with the given key and reuses the client on repeated calls', async () => {
      const fetchMock = mock((..._args: unknown[]) => Promise.resolve(new Response(
         JSON.stringify(jiraSearchResponse([{ key: 'PROJ-2', summary: 'Another issue' }])),
         { status: 200 }
      )));
      globalThis.fetch = fetchMock as unknown as typeof fetch;

      const service = makeService();
      await service.getMyIssuesByKey('PROJ-2');
      await service.getMyIssuesByKey('PROJ-2');

      expect(fetchMock).toHaveBeenCalledTimes(2);
      const requestedUrl = fetchMock.mock.calls[0][0] as string;
      expect(requestedUrl).toContain(encodeURIComponent('key=PROJ-2'));
   });

   test('surfaces an APIError when the Jira request fails', async () => {
      globalThis.fetch = mock(async () => new Response('nope', { status: 500 })) as unknown as typeof fetch;

      await expect(makeService().getMyIssues()).rejects.toThrow(/Jira API error/);
   });
});
