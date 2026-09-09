# 001: Per-command required settings instead of one global mandatory list

- **Date**: 2026-09-09
- **Status**: accepted
- **Tags**: architecture
- **Author**: Filippo Floramo <filifloramo@gmail.com>

## Context

All five settings paths (jira.domain, jira.email, jira.apiToken, clickUp.workspaceId, clickUp.apiToken) were listed in a single module-level array in store/utils/getMissingRequiredSettings.ts, and commands/shared/assertConfigured.ts applied that list to every command. Result: `jitocu time`, which only calls ClickUp, refused to run without Jira credentials. plans/DIRECTION.md section 1 identified this as ~15 lines of coupling, not an architectural problem.

## Decision

getMissingRequiredSettings(store, paths) and assertConfigured(ctx, paths) now take the setting paths the caller needs. store/constants exports clickUpSettingsPaths, jiraSettingsPaths and a settingsFeatures list (label, neededFor, paths). time and time add require ClickUp only; the default command and create require both groups. jitocu config reports readiness per feature and lets the user choose which incomplete features to set up interactively.

## Consequences

A ClickUp-only setup is now enough for the timesheet commands. Services already build their API client lazily, so nothing below the command layer changed. Adding a setting now means adding it to MandatorySettingsPath, settingPathsMap and one of the two path groups; a path in no group would be required by nobody, which tests/requiredSettings.test.ts guards by asserting the groups cover exactly the mandatory paths. assertConfigured call sites must state their requirement explicitly.

## What would end this

The assumption this leans on, and the observation that would make it wrong.

## Alternatives Considered

1. assertConfigured(ctx, featureKeys) taking group names instead of paths: reads nicer at call sites but is less flexible and diverges from the DIRECTION.md spec
1. A TaskSource interface with requiredSettings per source (DIRECTION.md section 2): deferred, justified only when a second issue source exists
1. Leave the global list and special-case time: keeps the false coupling
