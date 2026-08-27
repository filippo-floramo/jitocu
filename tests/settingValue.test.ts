import { describe, test, expect } from 'bun:test';
import { normalizeSettingValue, validateSettingValue } from '../src/store/utils/validateSettingValue';
import { validateSettingPath } from '../src/store/utils/validateSettingPath';

describe('normalizeSettingValue', () => {
   test('trims surrounding whitespace', () => {
      expect(normalizeSettingValue('jira.email', '  me@example.com \n')).toBe('me@example.com');
   });

   test('strips a pasted protocol and trailing slash from the Jira domain', () => {
      expect(normalizeSettingValue('jira.domain', 'https://example.atlassian.net/')).toBe('example.atlassian.net');
      expect(normalizeSettingValue('jira.domain', 'HTTP://example.atlassian.net')).toBe('example.atlassian.net');
   });

   test('leaves other paths untouched beyond trimming', () => {
      expect(normalizeSettingValue('clickUp.apiToken', 'pk_123_ABC')).toBe('pk_123_ABC');
   });
});

describe('validateSettingValue', () => {
   test('rejects an empty value for every path', () => {
      const paths = ['jira.domain', 'jira.email', 'jira.apiToken', 'clickUp.workspaceId', 'clickUp.apiToken'] as const;

      for (const path of paths) {
         expect(validateSettingValue(path, '')).toContain('cannot be empty');
      }
   });

   test('accepts well-formed values', () => {
      expect(validateSettingValue('jira.domain', 'example.atlassian.net')).toBeNull();
      expect(validateSettingValue('jira.email', 'me@example.com')).toBeNull();
      expect(validateSettingValue('jira.apiToken', 'ATATT3xFfGF0')).toBeNull();
      expect(validateSettingValue('clickUp.workspaceId', '9012345678')).toBeNull();
      expect(validateSettingValue('clickUp.apiToken', 'pk_123_ABC')).toBeNull();
   });

   test('rejects a Jira domain that is not a bare host', () => {
      expect(validateSettingValue('jira.domain', 'not a domain')).toContain('bare host');
      expect(validateSettingValue('jira.domain', 'localhost')).toContain('bare host');
   });

   test('rejects a malformed email', () => {
      expect(validateSettingValue('jira.email', 'me-at-example.com')).toContain('email address');
   });

   test('rejects a non-numeric ClickUp workspace id', () => {
      expect(validateSettingValue('clickUp.workspaceId', 'my-workspace')).toContain('numeric workspace id');
   });

   test('rejects a token containing whitespace', () => {
      expect(validateSettingValue('clickUp.apiToken', 'pk_123 ABC')).toContain('no spaces');
   });

   test('does not echo the rejected value back', () => {
      const message = validateSettingValue('jira.apiToken', 'secret token');
      expect(message).not.toContain('secret');
   });
});

describe('validateSettingPath', () => {
   test('accepts known paths and rejects unknown ones', () => {
      expect(validateSettingPath('jira.domain')).toBe(true);
      expect(validateSettingPath('jira.nope')).toBe(false);
      expect(validateSettingPath('')).toBe(false);
   });

   test('does not treat inherited Object properties as valid paths', () => {
      expect(validateSettingPath('toString')).toBe(false);
      expect(validateSettingPath('constructor')).toBe(false);
   });
});
