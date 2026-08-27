import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createStore, type Store } from '../src/store/store';

describe('store', () => {
   let store: Store;
   let tmpDir: string;

   beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jitocu-store-test-'));
      store = createStore({ cwd: tmpDir });
   });

   afterEach(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true });
   });

   test('two stores with different cwds do not share data', () => {
      store.set('settings.jira.domain' as any, 'a.atlassian.net');

      const otherDir = tmpDir + '-other';
      const other = createStore({ cwd: otherDir });
      expect(other.has('settings.jira.domain' as any)).toBe(false);
   });

   test('get/set round-trips a nested value', () => {
      store.set('settings.jira.domain' as any, 'example.atlassian.net');
      expect(store.get('settings.jira.domain' as any)).toBe('example.atlassian.net');
   });

   test('get returns undefined for a missing nested value', () => {
      expect(store.get('settings.jira.domain' as any)).toBeUndefined();
   });

   test('has reflects presence of a nested value', () => {
      expect(store.has('settings.jira.domain' as any)).toBe(false);
      store.set('settings.jira.domain' as any, 'example.atlassian.net');
      expect(store.has('settings.jira.domain' as any)).toBe(true);
   });

   test('merging into a nested path preserves sibling fields', () => {
      store.set('settings.jira' as any, {
         domain: 'example.atlassian.net',
         email: 'me@example.com',
         apiToken: 'token'
      });

      store.set('settings.jira' as any, { ...store.get('settings.jira' as any), domain: 'new.atlassian.net' });

      expect(store.get('settings.jira' as any)).toEqual({
         domain: 'new.atlassian.net',
         email: 'me@example.com',
         apiToken: 'token'
      });
   });

   test('clear removes all data', () => {
      store.set('settings.jira.domain' as any, 'example.atlassian.net');
      store.clear();
      expect(store.store).toEqual({});
   });

   test('store getter returns the full data object', () => {
      store.set('settings.jira.domain' as any, 'example.atlassian.net');
      expect(store.store).toEqual({
         settings: { jira: { domain: 'example.atlassian.net' } }
      } as any);
   });

   test('a second store reading the same cwd sees persisted data', () => {
      store.set('settings.jira.domain' as any, 'example.atlassian.net');

      const reopened = createStore({ cwd: tmpDir });
      expect(reopened.get('settings.jira.domain' as any)).toBe('example.atlassian.net');
   });
});
