# Architecture Decision Records

Every decision this project has taken, newest first. The numbered files in
this directory are the source of truth; this index is generated from them by
`webidoo_process_adr`, so editing it by hand is work the next call throws away.

## Index

| # | Title | Date | Status | Tags |
|---|-------|------|--------|------|
| [001](001-per-command-required-settings-instead-of-one-global-mandatory-list.md) | Per-command required settings instead of one global mandatory list | 2026-09-09 | accepted | architecture |

## What each decision says

The opening sentence of each decision and of what it cost, lifted from the
file. Where a line stops short the rest is in the ADR.

| ADR | Decision | Consequence |
|-----|----------|-------------|
| [001](001-per-command-required-settings-instead-of-one-global-mandatory-list.md) | getMissingRequiredSettings(store, paths) and assertConfigured(ctx, paths) now take the setting paths the caller needs. store/constants exports clickUpSettingsPaths, jiraSettingsPaths and a settingsFeatures list (label,... | A ClickUp-only setup is now enough for the timesheet commands. |

## By theme

Tags carried by 3 or more decisions. A decision appears under every
theme it carries, and the early ADRs that predate the tag field are listed last.

## Operating rules

- Record a structural decision with `webidoo_process_adr`, when it is taken.
- Never rewrite an accepted decision. Supersede it with a new one that says why.
- Never edit this file. Edit the ADR and let the next call regenerate it.
