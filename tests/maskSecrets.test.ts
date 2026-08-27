import { describe, test, expect } from 'bun:test';
import { maskValue, maskSettings, maskValueAtPath } from '../src/store/utils/maskSecrets';

describe('maskSecrets', () => {
   const fullData = {
      settings: {
         jira: {
            domain: 'example.atlassian.net',
            email: 'me@example.com',
            apiToken: 'ATATT3xFfGF0abcdef1234567890'
         },
         clickUp: {
            apiToken: 'pk_1234567890abcdef',
            workspaceId: '12345'
         }
      }
   };

   describe('maskValue', () => {
      test('masks and keeps the last 4 characters for long values', () => {
         expect(maskValue('ATATT3xFfGF0abcdef1234567890')).toBe('••••••••7890');
      });

      test('fully masks short values', () => {
         expect(maskValue('short')).toBe('••••••••');
      });
   });

   describe('config list — maskSettings', () => {
      test('masks jira and clickUp tokens, leaves other fields untouched', () => {
         const masked = maskSettings(fullData);
         expect(masked.settings.jira.apiToken).toBe('••••••••7890');
         expect(masked.settings.clickUp.apiToken).toBe('••••••••cdef');
         expect(masked.settings.jira.domain).toBe('example.atlassian.net');
         expect(masked.settings.clickUp.workspaceId).toBe('12345');
      });

      test('does not mutate the original object', () => {
         maskSettings(fullData);
         expect(fullData.settings.jira.apiToken).toBe('ATATT3xFfGF0abcdef1234567890');
      });
   });

   describe('config get settings.jira.apiToken', () => {
      test('masks a direct secret leaf', () => {
         const value = maskValueAtPath('settings.jira.apiToken', fullData.settings.jira.apiToken);
         expect(value).toBe('••••••••7890');
      });
   });

   describe('config get settings.jira', () => {
      test('masks the secret field nested inside a parent object', () => {
         const value = maskValueAtPath('settings.jira', fullData.settings.jira);
         expect(value).toEqual({
            domain: 'example.atlassian.net',
            email: 'me@example.com',
            apiToken: '••••••••7890'
         });
      });

      test('does not mutate the original object', () => {
         maskValueAtPath('settings.jira', fullData.settings.jira);
         expect(fullData.settings.jira.apiToken).toBe('ATATT3xFfGF0abcdef1234567890');
      });
   });

   test('non-secret paths pass through untouched', () => {
      const value = maskValueAtPath('settings.jira.domain', fullData.settings.jira.domain);
      expect(value).toBe('example.atlassian.net');
   });
});
