import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs/promises';
import * as path from 'path';
import JsonStore, { getJSONStore } from '../src/store/JSONStore';


describe('JsonStore', () => {
   let store: JsonStore;
   const testFilePath = path.join(process.cwd(), 'data/test-store.json');

   beforeEach(async () => {
      const testDir = path.dirname(testFilePath);
      await fs.mkdir(testDir, { recursive: true });

      store = getJSONStore(testFilePath);
      store.clearCache();
   });

   afterEach(async () => {
      try {
         await fs.unlink(testFilePath);
      } catch {
      }
   });

   describe('Singleton Pattern', () => {
      test('should return the same instance', () => {
         const instance1 = getJSONStore(testFilePath);
         const instance2 = getJSONStore(testFilePath);
         expect(instance1).toBe(instance2);
      });
   });

   describe('Basic Operations', () => {
      test('should load empty data when file does not exist', async () => {
         const data = await store.load();
         expect(data).toEqual({});
      });

      test('should save and load data', async () => {
         const testData = {
            settings: {
               jira: {
                  domain: 'test.atlassian.net',
                  email: 'test@example.com',
                  apiToken: 'token123'
               },
               clickUp: {
                  apiToken: 'clickup-token',
                  workspaceId: '12345'
               }
            }
         };

         await store.save(testData);
         const loaded = await store.load();
         expect(loaded).toEqual(testData);
      });

      test('should cache loaded data', async () => {
         const testData = { settings: { clickUp: { apiToken: 'token', workspaceId: '123' } } };
         await store.save(testData);

         const data1 = await store.load();
         const data2 = await store.load();
         expect(data1).toBe(data2); // Same reference = cached
      });

      test('should clear cache', async () => {
         const testData = { settings: { clickUp: { apiToken: 'token', workspaceId: '123' } } };
         await store.save(testData);

         await store.load();
         store.clearCache();
         const data = await store.load();
         expect(data).toEqual(testData);
      });
   });

   describe('Top-level Methods', () => {
      test('get() should retrieve top-level property', async () => {
         await store.save({
            settings: {
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         });

         const settings = await store.get('settings');
         expect(settings).toEqual({
            clickUp: { apiToken: 'token', workspaceId: '123' }
         });
      });

      test('get() should return undefined for non-existent key', async () => {
         await store.save({});
         const result = await store.get('settings');
         expect(result).toBeUndefined();
      });

      test('set() should set top-level property', async () => {
         await store.set('settings', {
            clickUp: { apiToken: 'token', workspaceId: '123' }
         } as any);

         const data = await store.load();
         expect(data.settings).toEqual({
            clickUp: { apiToken: 'token', workspaceId: '123' }
         });
      });

      test('has() should check if top-level key exists', async () => {
         await store.save({
            settings: {
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         });

         expect(await store.has('settings')).toBe(true);
         expect(await store.has('nonexistent')).toBe(false);
      });

      test('delete() should remove top-level property', async () => {
         await store.save({
            settings: {
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         });

         await store.delete('settings');
         const data = await store.load();
         expect(data.settings).toBeUndefined();
      });
   });

   describe('Nested Path Methods', () => {
      beforeEach(async () => {
         await store.save({
            settings: {
               jira: {
                  domain: 'test.atlassian.net',
                  email: 'test@example.com',
                  apiToken: 'jira-token'
               },
               clickUp: {
                  apiToken: 'clickup-token',
                  workspaceId: '12345'
               }
            }
         });
      });

      describe('getPath()', () => {
         test('should get nested value', async () => {
            const domain = await store.getPath('settings.jira.domain');
            expect(domain).toBe('test.atlassian.net');
         });

         test('should get deeply nested value', async () => {
            const email = await store.getPath('settings.jira.email');
            expect(email).toBe('test@example.com');
         });

         test('should return undefined for non-existent path', async () => {
            const result = await store.getPath('settings.jira.nonexistent' as any);
            expect(result).toBeUndefined();
         });

         test('should return undefined for partially non-existent path', async () => {
            const result = await store.getPath('settings.nonexistent.field' as any);
            expect(result).toBeUndefined();
         });

         test('should handle null/undefined in path', async () => {
            await store.save({ settings: undefined });
            const result = await store.getPath('settings.jira.domain');
            expect(result).toBeUndefined();
         });
      });

      describe('hasPath()', () => {
         test('should return true for existing path', async () => {
            expect(await store.hasPath('settings.jira.domain')).toBe(true);
         });

         test('should return false for non-existent path', async () => {
            expect(await store.hasPath('settings.jira.nonexistent' as any)).toBe(false);
         });

         test('should return false for partially non-existent path', async () => {
            expect(await store.hasPath('settings.nonexistent.field' as any)).toBe(false);
         });

         test('should handle null/undefined in path', async () => {
            await store.save({ settings: undefined });
            expect(await store.hasPath('settings.jira.domain')).toBe(false);
         });
      });

      describe('updatePath()', () => {
         test('should update existing nested value', async () => {
            await store.updatePath('settings.jira.domain', 'new.atlassian.net');
            const domain = await store.getPath('settings.jira.domain');
            expect(domain).toBe('new.atlassian.net');
         });

         test('should create path if it does not exist', async () => {
            await store.save({});
            await store.updatePath('settings.jira.domain', 'created.atlassian.net');
            const domain = await store.getPath('settings.jira.domain');
            expect(domain).toBe('created.atlassian.net');
         });

         test('should not affect other properties', async () => {
            await store.updatePath('settings.jira.domain', 'new.atlassian.net');
            const email = await store.getPath('settings.jira.email');
            const clickUp = await store.getPath('settings.clickUp.apiToken');

            expect(email).toBe('test@example.com');
            expect(clickUp).toBe('clickup-token');
         });

         test('should handle deep path creation', async () => {
            await store.save({});
            await store.updatePath('settings.jira.domain', 'deep.atlassian.net');

            const data = await store.load();
            expect(data.settings?.jira?.domain).toBe('deep.atlassian.net');
         });
      });

      describe('mergePath()', () => {
         test('should merge object at path', async () => {
            await store.mergePath('settings.jira', {
               domain: 'merged.atlassian.net',
               email: 'merged@example.com'
            });

            const jira = await store.getPath('settings.jira');
            expect(jira).toEqual({
               domain: 'merged.atlassian.net',
               email: 'merged@example.com',
               apiToken: 'jira-token' // Original value preserved
            });
         });

         test('should create path and merge if not exists', async () => {
            await store.save({});
            await store.mergePath('settings.jira', {
               domain: 'new.atlassian.net',
               email: 'new@example.com'
            } as any);

            const jira = await store.getPath('settings.jira');
            expect(jira).toEqual({
               domain: 'new.atlassian.net',
               email: 'new@example.com'
            } as any);
         });

         test('should not affect sibling properties', async () => {
            await store.mergePath('settings.jira', {
               domain: 'merged.atlassian.net'
            });

            const clickUp = await store.getPath('settings.clickUp');
            expect(clickUp).toEqual({
               apiToken: 'clickup-token',
               workspaceId: '12345'
            });
         });
      });
   });

   describe('Utility Methods', () => {
      test('clear() should remove all data', async () => {
         await store.save({
            settings: {
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         });

         await store.clear();
         const data = await store.load();
         expect(data).toEqual({});
      });

      test('getAll() should return all data', async () => {
         const testData = {
            settings: {
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         };

         await store.save(testData);
         const all = await store.getAll();
         expect(all).toEqual(testData);
      });
   });

   describe('Atomicity', () => {
      test('updatePath should be atomic (load once, save once)', async () => {
         await store.save({
            settings: {
               jira: {
                  domain: 'original.atlassian.net',
                  email: 'original@example.com',
                  apiToken: 'token'
               },
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         });

         // Update one field
         await store.updatePath('settings.jira.domain', 'updated.atlassian.net');

         // Verify entire structure is preserved
         const data = await store.load();
         expect(data.settings?.jira).toEqual({
            domain: 'updated.atlassian.net',
            email: 'original@example.com',
            apiToken: 'token'
         });
         expect(data.settings?.clickUp).toEqual({
            apiToken: 'token',
            workspaceId: '123'
         });
      });

      test('mergePath should be atomic', async () => {
         await store.save({
            settings: {
               jira: {
                  domain: 'original.atlassian.net',
                  email: 'original@example.com',
                  apiToken: 'token'
               },
               clickUp: { apiToken: 'token', workspaceId: '123' }
            }
         });

         // Merge partial update
         await store.mergePath('settings.jira', {
            domain: 'merged.atlassian.net'
         });

         // Verify merge preserved other fields
         const jira = await store.getPath('settings.jira');
         expect(jira).toEqual({
            domain: 'merged.atlassian.net',
            email: 'original@example.com',
            apiToken: 'token'
         });
      });
   });

   describe('Edge Cases', () => {
      test('should handle empty string values', async () => {
         await store.updatePath('settings.jira.domain', '');
         const domain = await store.getPath('settings.jira.domain');
         expect(domain).toBe('');
      });

      test('should handle special characters in values', async () => {
         const specialValue = 'test@#$%^&*()_+-={}[]|:";\'<>?,./';
         await store.updatePath('settings.jira.domain', specialValue);
         const domain = await store.getPath('settings.jira.domain');
         expect(domain).toBe(specialValue);
      });

      test('should handle unicode characters', async () => {
         await store.updatePath('settings.jira.domain', '测试.atlassian.net');
         const domain = await store.getPath('settings.jira.domain');
         expect(domain).toBe('测试.atlassian.net');
      });
   });
});
