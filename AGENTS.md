# jitocu — agent instructions

Interactive CLI that copies Jira issues assigned to you into ClickUp lists and
manages ClickUp time entries. TypeScript, Bun for development, Node ≥ 22 at
runtime.

**Read [ARCHITECTURE.md](./ARCHITECTURE.md) before non-trivial work.** It covers
the layering, every technical choice and its reasoning, the search abstraction,
the custom prompts, the time-entry DSL, and the known rough edges. This file is
only the always-in-context subset.

## Commands

```bash
bun run dev          # bun --watch src/cli.ts
bun run start        # run the CLI once
bun test             # 84 tests
bunx tsc --noEmit    # typecheck — NOT wired to a script, run it explicitly
bun run lint         # biome
bun run build        # bun build → dist/cli.js
```

Before calling work done: `bunx tsc --noEmit`, `bun test`, and `bun run lint`.
Lint currently reports 29 warnings in `src` — that is the baseline, so compare
against it rather than treating a non-zero count as a regression.

## Architecture in one screen

```
cli.ts → commands/ → services/ → services/*/api.ts → apiFetch
              ↓          ↓
          prompts/     store/            helpers/  errors/
```

Dependencies point downward only. The rule that matters most:
**search, formatting, and prompting belong in `commands/` and `prompts/`, never
in `services/`.** A service returns data; the command layer decides how to
filter and present it.

`AppContext { jira, clickUp, store }` is built once in `cli.ts` and threaded
explicitly — there is no DI container. Services hold no API client until first
use, so `jitocu config` works with no credentials present.

## Conventions

- **Fail by throwing**, never print-and-exit. `throw new CLIError(msg)` /
  `ConfigError` / `APIError`; exit codes are 1/2/3. `commands/shared/run.ts`
  catches everything and calls `handleError`. Pass a callback as the error
  `context` to print extra guidance.
- **Commands are classes** implementing `CLICommand { execute(): Promise<void> }`,
  constructed as `(ctx, opts?)`, always invoked through `run(ctx, make)`.
- **Call `assertConfigured(ctx)` first** in any command that touches an API.
- **Never read the store directly.** Go through
  `store/utils/settingAccess.ts` (`getSetting`/`setSetting`/`hasSetting`/
  `requireSetting`). It is the single place allowed to widen conf's key types.
- **Never echo a setting value** in an error or log — two of the five settings
  are API tokens. Mask via `store/utils/maskSecrets.ts`.
- **Wrap network calls in `withSpinner`**, and route all HTTP through
  `services/shared/apiFetch.ts`.
- **Use the one search helper**, `helpers/fuzzySearch.ts`. Build the searcher
  once with `createFuzzySearcher` and query it per keystroke; do not construct it
  inside a prompt's `source` callback.
- **3-space indentation** (Biome-enforced), double quotes preferred. Existing
  files are inconsistent — match the file you are editing.
- **Comments explain why, not what.** The existing ones document non-obvious
  runtime behaviour (readline key naming, Node vs Bun error shapes, conf's key
  types, fzf's empty-query scoring). Keep that bar; delete nothing that explains
  a workaround.

## Traps

- **Fuzzy matching is subsequence-based, not edit-distance based.** `porject`
  does not match "Project". This is intentional and asserted in tests — do not
  "fix" it without being asked.
- **`treeSelect` results keep tree order, not relevance order**, so the first row
  is not necessarily the best match. That is deliberate: reordering breaks the
  tree's folder headers and connectors.
- **readline reports punctuation with `name: undefined`** and space as
  `name: "space"`. Key handlers must read the raw `sequence`, which is absent
  from `@inquirer/core`'s published `KeypressEvent` type. See `printableChar` in
  `prompts/treeSelect.ts`.
- **`DAYS_MAP` is Mon–Fri only** while `getWeeksRange` builds Sun–Sat ranges, so
  weekend entries are fetched but never shown as columns.
- **`showMissingSettignsPaths` is misspelled** throughout. Leave it unless you
  are asked to rename it — the fix touches several files.

## Testing

`bun test`, pure logic only — no network, no live API calls, no interactive
prompt driving. Services are tested with `Object.create(Service.prototype)` and
a hand-stubbed `api` field. When a prompt contains logic worth testing, extract
it into a pure exported function and test that (see `listCandidates` and
`printableChar`). Manual prompt checks go through `demo/*.ts`, which run against
sample data with no credentials.

## Release

Tag-driven. `.github/workflows/publish.yml` fires on `v*` tags, hard-fails if the
tag does not match `package.json` version, then publishes to npm with provenance
via OIDC. Do not commit or push unless asked.
