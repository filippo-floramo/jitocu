# jitocu — Architecture

Reference document for the `jitocu` CLI. Written to be read top-to-bottom by a
person or retrieved in fragments by a model. The README covers *how to use* the
tool; this covers *how it is built and why*.

- **Package name:** `jitocu` (published to npm, bin `jitocu` → `./dist/cli.js`)
- **What it does:** copies Jira issues assigned to you into ClickUp lists, and
  manages ClickUp time entries through an interactive terminal UI.
- **Repo layout:** `src/` (all source), `tests/` (bun test), `demo/` (runnable
  prompt demos), `.github/workflows/`. `dist/` (build output, published to npm)
  and `data/` are gitignored.

---

## 1. Runtime and tooling choices

| Concern | Choice | Why |
| --- | --- | --- |
| Dev runtime | **Bun** | Runs TypeScript directly — no build step in dev, no ts-node/tsx layer. `bun --watch` gives reload. |
| Ship target | **Node ≥ 22** | `bun build --target node` produces a single minified `dist/cli.js` with a `#!/usr/bin/env node` banner, so end users need only Node, not Bun. `engines.node: >=22`. |
| Language | **TypeScript**, `strict: true` | `noEmit` — Bun/`bun build` handle transpilation; `tsc` is used purely as a typechecker. |
| CLI framework | **Commander** | Subcommand tree with a default action; mature and dependency-light. |
| Prompts | **@inquirer/prompts** + **@inquirer/core** | Stock prompts (`search`, `select`, `input`, `password`, `confirm`) for ordinary steps; `createPrompt` from `@inquirer/core` for the three custom prompts that stock ones cannot express. |
| Fuzzy search | **fzf** (`fzf-for-js`) | Port of upstream fzf's `FuzzyMatchV2`. Chosen over `fuse.js` for ranking quality on short task/list names, and over the previously-used `fuzzy` package (unmaintained since 2016, weak scoring). See §7. |
| Config storage | **conf** | Atomic JSON writes, XDG-aware directory resolution. |
| Spinners | **ora** | Wrapped once in `withSpinner`, never called directly by commands. |
| Colour | **chalk** | |
| Lint/format | **Biome** | 3-space indent, double quotes, `noExplicitAny` off. |
| Tests | **bun test** | ~84 tests. Pure logic only — no live API calls, no interactive-prompt driving. |

### Deliberate non-choices

- **No dependency injection container.** A hand-built `AppContext` is passed
  down explicitly (§3).
- **No HTTP client library.** Native `fetch`, wrapped once in `apiFetch` (§5).
- **No test framework beyond bun test**, and no prompt-testing harness
  (`@inquirer/testing` is not installed). Interactive prompts are covered by
  unit-testing their extracted pure helpers instead.
- **No `tsc` emit.** `dist/` is produced only by `bun build`.

---

## 2. Layering

Dependencies point downward only. Nothing below reaches upward.

```
cli.ts                     entrypoint: builds Commander tree, creates context
   │
commands/                  one class per user-facing command (CLICommand)
   │                       owns all interaction and orchestration
prompts/                   custom @inquirer/core prompts (pure UI)
   │
services/                  JiraService / ClickUpService — business rules
   │                       lazily construct their API client from the store
services/*/api.ts          HTTP + response mapping, one class per provider
   │
services/shared/apiFetch   fetch wrapper: transport errors → APIError
   │
store/                     conf-backed settings: typed paths, validation, masking
helpers/                   pure utilities, no I/O except withSpinner
errors/                    CLIError hierarchy + terminal handler
```

The rule that matters most: **search, formatting, and prompting live in
`commands/` and `prompts/`, never in `services/`.** A service returns data; the
command layer decides how to filter and present it.

---

## 3. Entrypoint and context

`src/cli.ts` is the only top-level orchestration:

1. Builds the Commander program, version read from `package.json` via a JSON
   import attribute.
2. Calls `createContext()` **inside its own try/catch**, because opening the
   store parses the config file and can fail before any command's error handling
   exists.
3. Registers `config`, `create`, and `time` subcommands, plus a default action.

`src/context.ts` defines the single object threaded through everything:

```ts
interface AppContext {
   jira: JiraService;
   clickUp: ClickUpService;
   store: Store;
}
```

Services are constructed eagerly but hold **no API client** until first use —
see §5. That means `createContext()` never requires credentials, so
`jitocu config` works on a fresh machine.

`openStore()` converts a corrupt/unreadable config file into a `ConfigError`
that names the file path and tells the user they may delete it.

---

## 4. Command layer

Every command implements one interface:

```ts
interface CLICommand { execute(): Promise<void> }
```

Commands are classes constructed with `(ctx, options?)`. They are never invoked
directly by Commander — `commands/shared/run.ts` wraps them:

```ts
run(ctx, (c) => new SomeCommand(c, opts))
```

`run` executes the command, calls `process.exit(0)` on success, and funnels any
throw into `handleError`. This is why command code contains almost no
error handling: **throwing a `CLIError` is the idiomatic way to fail.**

`commands/shared/assertConfigured.ts` is the shared precondition — every command
that touches an API calls it first, and it throws a `ConfigError` listing the
unset paths.

### Command map

| Invocation | Class | Notes |
| --- | --- | --- |
| `jitocu` | `commands/default.ts` → `DefaultCLICommand` | Fuzzy-search Jira issues → tree-select a ClickUp list → create task. |
| `jitocu config` | `commands/config/default.ts` | Detects missing settings, offers interactive setup (`password` prompt for tokens). |
| `jitocu config set/get/list/clear` | `commands/config/*.ts` | `get`/`list` accept `--reveal`; secrets masked by default. |
| `jitocu create -k KEY -l LIST` | `commands/create/default.ts` | Non-interactive-ish path; still confirms the issue and list. |
| `jitocu time` | `commands/time/default.ts` → `DefaultTimeCommand` | Week range → timesheet table → add entries in a loop. |
| `jitocu time add [-l LIST]` | `commands/time/add.ts` | Skips the timesheet; goes straight to task + date + time entry. |

### Shared command-layer pieces

- **`commands/time/timeEntryFlow.ts`** — the reusable steps of a time entry:
  `selectListFromTree`, `selectTaskFromList`, `submitTimeEntries`. Shared by both
  `time` and `time add`.
- **`commands/shared/selectListByName.ts`** — resolves a `--list` flag. Fetches
  all shared lists, fuzzy-matches, prompts to disambiguate, and throws a
  `CLIError` naming the query when nothing matches. Shared by `create` and
  `time add`.

### The `time` loop

`DefaultTimeCommand.execute()` is a `while (true)` with one shared tail. The
timesheet prompt returns a discriminated union:

- `{ type: 'action', action: 'close' }` — `q`/`Esc` → return.
- `{ type: 'action', action: 'add' }` — `a` → pick task from the folder tree.
- `{ type: 'cell', selection }` — `Enter` → task and day come from the cell.

Both entry paths then submit and hit the same "Add another time entry?" confirm,
so the two keys behave identically. Looping re-asks the week range and refetches,
which is intentional: the table then shows the entry just added.

---

## 5. Service and API layer

Two symmetrical pairs: `JiraService`/`JiraAPI`, `ClickUpService`/`ClickUpAPI`.

**Services** hold the `Store` and lazily build their API client:

```ts
private getApi(): ClickUpAPI {
   if (!this.api) {
      this.api = new ClickUpAPI({
         workspaceId: requireSetting(this.store, "clickUp.workspaceId"),
         apiToken: requireSetting(this.store, "clickUp.apiToken")
      })
   }
   return this.api;
}
```

This lazy read is load-bearing: credentials are only demanded when a call is
actually made, and `requireSetting` throws a `ConfigError` rather than passing
`undefined` typed as `string` into an HTTP header.

**API classes** own URL construction, auth headers, status checks, and mapping
of provider JSON into the app's own types. They never read the store.

Notable behaviours:

- `JiraAPI.fetchJiraIssues(key?)` builds JQL `assignee=currentUser()` (plus
  `AND key=…` when given), `ORDER BY updated DESC`, `maxResults=50`, and maps
  results to `{ name: "KEY - summary", value: { key, summary } }` — i.e. already
  shaped as inquirer choices.
- `ClickUpAPI.getAuthorizedUser()` **caches the user in-memory** per client
  instance; several flows need the user id and would otherwise refetch.
- `ClickUpAPI.getSharedFolders()` flattens ClickUp's `shared.folders` response
  into the app's own `ClickUpFolder` shape, dropping everything unused.
- `ClickUpService.createTaskAssignedToMe()` holds the **duplicate-prevention
  rule**: it rejects an issue whose key already exists in the list, matching
  either the bare key or the key followed by `" - "`. The prefix form is what
  stops `PROJ-1` from false-positiving against `PROJ-11`. Covered by tests.
- `ClickUpService.getSharedLists()` returns lists flattened out of folders as
  `{ id, name: "Folder -> List" }`. It does **no matching** — that moved to
  `commands/shared/selectListByName.ts`.

### `services/shared/apiFetch.ts`

All HTTP goes through it. Its job is transport failures: offline, DNS, refused,
timeout. Node reports these as `TypeError: fetch failed` with the real cause
buried in `.cause`, while Bun surfaces it directly — `describeFailure` prefers
whichever is real, so the same message appears on both runtimes. Host-resolution
failures get a hint naming the setting to re-check. Everything becomes an
`APIError`, so a dropped connection reads as a real message instead of an
unexpected crash.

HTTP-level failures (non-`ok` responses) are checked by each API method and also
raised as `APIError` with status and body.

---

## 6. Store layer (`src/store/`)

`conf` instance at `$XDG_CONFIG_HOME/jitocu/config.json` (falling back to
`~/.config/jitocu/`). All settings live under a single `settings` key.

**Five mandatory paths**, encoded as a string-literal union:

```
jira.domain  jira.email  jira.apiToken  clickUp.workspaceId  clickUp.apiToken
```

`MandatorySettingsPath` is the source of truth; `settingPathsMap` gives each a
human label, and `Record<SettingPath, …>` keys the validation rules — so adding
a setting is a type error until every table is updated.

Four concerns, deliberately separated:

1. **`utils/settingAccess.ts` — typed access.** `conf`'s dot-notation key types
   only reach the top level of the store shape, so nested paths are unreachable
   through them. This file is the *single* place that widens the key type (via a
   local `NestedPathStore` interface); every other caller uses
   `getSetting`/`setSetting`/`hasSetting`/`requireSetting` with a `SettingPath`.
   No casts elsewhere.
2. **`utils/validateSettingPath.ts` — narrowing.** `path is SettingPath` type
   guard over `settingPathsMap`, so a raw CLI string reaches the typed helpers
   without a cast.
3. **`utils/validateSettingValue.ts` — normalize + validate.**
   `normalizeSettingValue` trims and, for `jira.domain`, strips a pasted
   `https://` and trailing slashes (the API layer prepends the scheme itself).
   `validateSettingValue` returns a message or `null` and **never echoes the
   value**, so tokens stay out of error output.
4. **`utils/maskSecrets.ts` — masking.** `SECRET_PATHS` lists the two token
   paths. Handles a secret leaf, a *parent* of a secret (`config get
   settings.jira` must mask the token inside), and whole-tree masking for
   `config list`. Format `••••••••1234`, fully masked under 8 characters so a
   short value never exposes itself entirely.

---

## 7. Search (`src/helpers/fuzzySearch.ts`)

One helper backs every fuzzy search in the app:

```ts
createFuzzySearcher<T>(items, { selector, limit?, extendedSearch? }) → (query) => T[]
fuzzySearch<T>(items, query, opts) → T[]      // one-shot wrapper
```

- **`createFuzzySearcher` indexes once** and returns a query function, so an
  interactive prompt does not rebuild the index on every keystroke. Callers hoist
  it out of the prompt's `source` callback (or memoize it).
- **Blank query returns everything in original order.** fzf scores all candidates
  0 for an empty query, which would let tiebreakers reshuffle the whole list;
  the helper short-circuits instead. This is what makes prompts open showing the
  full list.
- **Tiebreakers `[byLengthAsc, byStartAsc]`** — score, then shorter candidate,
  then earlier match.
- **Internally indexes `{ position, text }` entries** and maps results back by
  position. Two reasons: fzf's option type is conditional on the element type and
  cannot resolve behind a free type parameter (this avoids a cast), and duplicate
  display names still resolve to distinct items.
- **`extendedSearch: true`** enables fzf's `extendedMatch`: whitespace splits the
  query into AND-terms matched in any order. Used where the haystack concatenates
  several fields. Side effect: `!`, `^`, `$`, `'`, `|` become operators rather
  than literal characters.

**Matching is subsequence-based, not edit-distance based.** `porject` does *not*
match "Project". This is an accepted trade-off — asserted in tests so it is
documented rather than surprising. Switching to typo tolerance means replacing
fzf with `fuse.js` or `fast-fuzzy`, and is a one-file change to this helper.

Call sites: `commands/default.ts` (Jira issues), `commands/time/timeEntryFlow.ts`
(ClickUp tasks), `commands/shared/selectListByName.ts` (`--list` flag, plain
matching), `prompts/treeSelect.ts` (`extendedSearch`).

---

## 8. Custom prompts (`src/prompts/`)

Three prompts built with `createPrompt` from `@inquirer/core`, because stock
prompts cannot express them. Each is pure UI: it receives data, returns a
selection, and performs no I/O.

### `treeSelect.ts` — folder/list tree picker

Renders folders and their lists as a box-drawing tree with type-to-filter.
Returns `SelectedList { folderId, folderName, listId, listName }`.

- Lists literally named `"List"` (ClickUp's default) display as
  `"Folder - list"` via `getDisplayListName`.
- **Search matches list name *and* parent folder name.** `listCandidates()`
  builds a haystack of `` `${folder.name} ${displayName}` `` per list, so typing
  a folder name surfaces all of its lists.
- **Results keep tree order, not relevance order.** Matching runs over the flat
  candidate list; surviving list ids go into a `Set` and the folders are
  regrouped from it, so headers and connectors stay coherent. Consequence worth
  knowing: **the first row is not necessarily the best match.**
- **`printableChar(key)` handles search input.** Necessary because readline
  reports punctuation with `name: undefined` entirely and reports space as the
  named key `"space"` — neither is recognisable from `name`, so the raw
  `sequence` (absent from `@inquirer/core`'s published `KeypressEvent` type) is
  the only reliable source. Single printable characters through; control keys,
  multi-character escape sequences, and ctrl/meta combos rejected.

### `timesheetTable.ts` — spreadsheet-like week grid

Rows are tasks, columns are `Mon`–`Fri` (`DAYS_MAP`). Navigation with arrows or
`hjkl`. Returns a discriminated union:

```ts
type TimeSheetResult =
   | { type: 'action'; action: 'close' | 'add' }
   | { type: 'cell'; selection: CellSelection }
```

`Enter` selects a cell, `a` requests task-mode add, `q`/`Esc` closes. The union is
what lets `DefaultTimeCommand` treat both add paths uniformly (§4).

### `datePicker.ts` — calendar picker

Returns a `Date`; supports `format: "date" | "datetime"`.

---

## 9. Time-entry DSL (`src/helpers/parseTimeRangeInput.ts`)

A hand-written recursive-descent tokenizer — no parser library — for input like:

```
from 9:00 to 17:00
from 9:30 duration 2h30m
from 9:00 to 12:00 and from 13:00 duration 4h
```

Grammar: `range ("and" range)*` where `range = "from" TIME ("to" TIME | "duration" DURATION)`.

- `parseRanges(input, baseDate)` lowercases, splits on whitespace, parses one
  range, then requires literal `and` between further ranges.
- Every failure is a `CLIError` naming the token index.
- **Overnight ranges**: if the end time is `<=` the start, the end rolls to the
  next day — this is how `from 22:00 to 2:00` works.
- **Duration requires hours**: `4h` and `3h20m` are valid, `30m` is not.
- Returns `{ type, start, end, startMs, endMs, stop, duration }` per range; the
  command layer turns each into one ClickUp time entry.

Heaviest-tested file in the repo (25 tests), which is appropriate — it is the
one piece of real parsing.

---

## 10. Errors (`src/errors/`)

```
CLIError    (code 1)  — base; message is user-facing
ConfigError (code 2)  — misconfiguration
APIError    (code 3)  — provider/transport failure
```

The `code` becomes the process exit code. `context` is either a value (JSON-dumped)
or — the more common idiom — **a callback that prints extra guidance**:

```ts
throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
```

`handleError(error): never` prints `❌ message`, invokes the context callback if
present, and exits. Non-`CLIError` throws become "Unexpected error" with exit 1.

Practical consequence: **command code should throw, not print-and-exit.**

---

## 11. Helpers (`src/helpers/`)

Pure except `withSpinner`. Barrel-exported from `index.ts`.

| File | Purpose |
| --- | --- |
| `fuzzySearch.ts` | The single search abstraction (§7). |
| `parseTimeRangeInput.ts` | Time DSL parser (§9). |
| `mapTimeEntries.ts` | Groups ClickUp time entries by task into `{ id, name, task_url, cells: Record<dayName, hours> }` for the timesheet. Sums same-day durations; hours rounded to 1 decimal. |
| `getWeeksRange.ts` | Current week (Sun–Sat) plus the previous four, as `select` choices. |
| `getSelectedDate.ts` | Week start + day offset → midnight `Date`. |
| `constants.ts` | `DAYS_MAP` (`Mon`–`Fri` → 1–5). Weekend columns are intentionally absent. |
| `withSpinner.ts` | Wraps an async op with ora; succeeds/fails the spinner and **rethrows**, so `run`'s handler still sees the error. |
| `formatDate.ts`, `truncate.ts` | Display formatting. |

---

## 12. Testing

`bun test`, ~84 tests in `tests/`. The strategy is **test pure logic, extract
what is worth testing out of the interactive layer.**

| File | Covers |
| --- | --- |
| `parseTimeRangeInput.test.ts` | The DSL: formats, errors, overnight, edge cases. |
| `settingValue.test.ts` | Normalization, validation, path narrowing. |
| `maskSecrets.test.ts` | Leaf/parent/whole-tree masking, `config get`/`list` behaviour. |
| `store.test.ts` | Store construction and typed access. |
| `clickUpService.test.ts` | The duplicate-key rule, via a hand-stubbed `api` on a prototype-created service. |
| `jiraService.test.ts` | Service delegation. |
| `fuzzySearch.test.ts` | Blank query, ranking, duplicates, limit, and the documented lack of typo tolerance. |
| `treeSelectSearch.test.ts` | `listCandidates` haystacks, folder-name search, term order independence, and `printableChar` key handling. |

Services are tested by `Object.create(Service.prototype)` and assigning a stub
`api` — no HTTP mocking library, no network.

**Not covered by automated tests:** the interactive prompts end-to-end, and any
flow that writes to ClickUp. Prompts *can* be driven by passing
`{ input, output }` streams as `createPrompt`'s second argument (a `PassThrough`
plus a `Writable` collecting frames, then stripping ANSI) — useful for manual
verification, but no such harness is committed. `demo/` is the intended manual
path.

---

## 13. Demos (`demo/`)

Standalone runnable scripts exercising each custom prompt against sample data —
no credentials, no network:

```bash
bun run demo/treeSelect-demo.ts
bun run demo/datePicker-demo.ts
bun run demo/timesheetTable-demo.ts
```

`treeSelect-demo.ts` deliberately duplicates list names across folders
(`Backlog` in two, `Roadmap` in two) so that searching by list name alone is
ambiguous and folder-name matching is observable.

---

## 14. Build and release

```bash
bun run dev      # bun --watch src/cli.ts
bun run start    # bun run src/cli.ts
bun run build    # bun build → dist/cli.js, minified, node target, shebang banner
bun run lint     # biome lint .
bun run test     # bun test
bunx tsc --noEmit  # typecheck (not wired to a script)
```

`prepublishOnly` runs the build, so `dist/` is always fresh when published.
`files: ["dist", "README.md"]` — source is not shipped.

**Release** is tag-driven (`.github/workflows/publish.yml`, on `push` of `v*`):
checkout → Bun + Node 22 → `bun install --frozen-lockfile` → **verify the tag
matches `package.json` version** (hard fail on mismatch) → build → upgrade npm
(trusted publishing needs ≥ 11.5.1) → `npm publish --provenance` via OIDC in the
`npm-publish` environment. No npm token is stored.

---

## 15. Conventions worth matching

- 3-space indentation (Biome-enforced); double quotes preferred, but existing
  files mix — match the file you are in.
- Commands are classes implementing `CLICommand`, always invoked through `run`.
- Fail by `throw new CLIError(...)`; do not print-and-exit in command code.
- Use `withSpinner` for anything that hits the network.
- Never read the store outside `store/utils/settingAccess.ts`'s helpers.
- Never put search, formatting, or prompting into `services/`.
- Comments explain *why*, not *what* — the existing ones document non-obvious
  runtime behaviour (readline key naming, Node vs Bun error shapes, conf's key
  types, fzf's empty-query scoring). Keep that bar.

## 16. Known rough edges

- `showMissingSettignsPaths` is misspelled throughout (`Settigns`); renaming it
  touches several files.
- A stray `data/store.json` exists locally (gitignored) and is unrelated to the
  real config location, `~/.config/jitocu/config.json`.
- `tsconfig.json` carries `jsx`/`jsxImportSource: react` settings the project
  does not use.
- The `time` loop re-asks the week range on every iteration.
- `getWeeksRange` builds Sun–Sat ranges while `DAYS_MAP` only exposes Mon–Fri, so
  weekend entries are fetched but never displayed as columns.
