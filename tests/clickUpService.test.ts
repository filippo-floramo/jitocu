import { describe, test, expect } from 'bun:test';
import { ClickUpService } from '../src/services/clickUp/service';

function makeService(existingTaskNames: string[]) {
   const service = Object.create(ClickUpService.prototype) as ClickUpService;
   const created: { name: string; markdownContent?: string }[] = [];

   (service as any).api = {
      getAuthorizedUser: async () => ({ id: 1 }),
      getTasksByListId: async () => existingTaskNames.map((name) => ({ name })),
      createTaskByListId: async (name: string, _listId: string, _userId: number, markdownContent?: string) => {
         created.push({ name, markdownContent });
         return { name } as any;
      }
   };

   return { service, created };
}

describe('ClickUpService.createTaskAssignedToMe', () => {
   test('two issues with identical summaries but different keys are both created', async () => {
      const { service, created } = makeService(['PROJ-1 - Fix the bug']);

      await service.createTaskAssignedToMe({ key: 'PROJ-2', summary: 'Fix the bug', url: 'https://acme.atlassian.net/browse/PROJ-2' }, 'list-1');

      expect(created.map((c) => c.name)).toEqual(['PROJ-2 - Fix the bug']);
   });

   test('rejects a duplicate of the same key even after the Jira summary changed', async () => {
      const { service } = makeService(['PROJ-1 - Old summary']);

      await expect(
         service.createTaskAssignedToMe({ key: 'PROJ-1', summary: 'New renamed summary', url: 'https://acme.atlassian.net/browse/PROJ-1' }, 'list-1')
      ).rejects.toThrow('PROJ-1');
   });

   test('does not false-positive on a key that is a prefix of another key', async () => {
      const { service, created } = makeService(['PROJ-11 - Something else']);

      await service.createTaskAssignedToMe({ key: 'PROJ-1', summary: 'Fix the bug', url: 'https://acme.atlassian.net/browse/PROJ-1' }, 'list-1');

      expect(created.map((c) => c.name)).toEqual(['PROJ-1 - Fix the bug']);
   });

   test('links the Jira issue in the task description', async () => {
      const { service, created } = makeService([]);

      await service.createTaskAssignedToMe({ key: 'PROJ-3', summary: 'Add link', url: 'https://acme.atlassian.net/browse/PROJ-3' }, 'list-1');

      expect(created[0]?.markdownContent).toBe('[PROJ-3](https://acme.atlassian.net/browse/PROJ-3)');
   });
});
