import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { createStore, type Store } from '../src/store/store';
import { getMissingRequiredSettings } from '../src/store/utils/getMissingRequiredSettings';
import { clickUpSettingsPaths, jiraSettingsPaths, settingsFeatures } from '../src/store/constants';

describe('required settings', () => {
   let store: Store;
   let tmpDir: string;

   beforeEach(async () => {
      tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'jitocu-required-test-'));
      store = createStore({ cwd: tmpDir });
   });

   afterEach(async () => {
      await fs.rm(tmpDir, { recursive: true, force: true });
   });

   function configureClickUp() {
      store.set('settings.clickUp.apiToken' as any, 'token');
      store.set('settings.clickUp.workspaceId' as any, '1234567');
   }

   test('reports every requested path when nothing is set', () => {
      expect(getMissingRequiredSettings(store, clickUpSettingsPaths)).toEqual(clickUpSettingsPaths);
   });

   test('ignores paths outside the requested set', () => {
      configureClickUp();

      expect(getMissingRequiredSettings(store, clickUpSettingsPaths)).toEqual([]);
      expect(getMissingRequiredSettings(store, jiraSettingsPaths)).toEqual(jiraSettingsPaths);
   });

   test('a ClickUp-only setup leaves the combined requirement incomplete', () => {
      configureClickUp();

      const missing = getMissingRequiredSettings(store, [...clickUpSettingsPaths, ...jiraSettingsPaths]);
      expect(missing).toEqual(jiraSettingsPaths);
   });

   test('every mandatory path belongs to exactly one feature', () => {
      const grouped = settingsFeatures.flatMap(feature => feature.paths);

      expect(new Set(grouped).size).toBe(grouped.length);
      expect(grouped.sort()).toEqual([...clickUpSettingsPaths, ...jiraSettingsPaths].sort());
   });
});
