import {
   createPrompt,
   useMemo,
   useState,
   useKeypress,
   usePrefix,
   usePagination,
   isUpKey,
   isDownKey,
   isEnterKey,
   isBackspaceKey,
   makeTheme,
   type Theme,
   type KeypressEvent,
   Status,
} from "@inquirer/core";
import chalk from "chalk";
import { createFuzzySearcher } from "../helpers/fuzzySearch";
import { ClickUpFolder } from "../services/clickUp";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SelectedList {
   folderId: string;
   folderName: string;
   listId: string;
   listName: string;
}

// ─── Flat row model ───────────────────────────────────────────────────────────

type FolderRow = {
   kind: "folder";
   label: string;
};

type ListRow = {
   kind: "list";
   label: string;
   value: SelectedList;
   short: string;
};

type Row = FolderRow | ListRow;

function getDisplayListName(folderName: string, listName: string): string {
   return listName === "List" ? `${folderName} - list` : listName;
}

// ─── Search index ─────────────────────────────────────────────────────────────

type ListCandidate = {
   listId: string;
   /** Parent folder name and list name together, so either one can be typed. */
   haystack: string;
};

/** Exported for tests. */
export function listCandidates(folders: ClickUpFolder[]): ListCandidate[] {
   return folders.flatMap((folder) =>
      folder.lists.map((list) => ({
         listId: list.id,
         haystack: `${folder.name} ${getDisplayListName(folder.name, list.name)}`
      }))
   );
}

// ─── Search input ─────────────────────────────────────────────────────────────

/**
 * readline reports punctuation with no `name` at all and reports space as the
 * named key "space", so neither can be recognised from `name`. The raw sequence
 * is the only reliable source, and it is absent from the published event type.
 */
type RawKeypressEvent = KeypressEvent & { sequence?: string; meta?: boolean };

/**
 * The character a keypress should append to the query, or null if it is a
 * control key. Exported for tests.
 */
export function printableChar(key: KeypressEvent): string | null {
   const { sequence, meta } = key as RawKeypressEvent;

   if (key.ctrl || meta) return null;
   if (typeof sequence !== "string" || sequence.length !== 1) return null;
   // Leaves out escape, enter and backspace/delete.
   if (sequence < " " || sequence === "\x7f") return null;

   return sequence;
}

// ─── Tree flattener ───────────────────────────────────────────────────────────

function flattenFolders(folders: ClickUpFolder[]): Row[] {
   const rows: Row[] = [];

   folders.forEach((folder, fi) => {
      const isLastFolder = fi === folders.length - 1;
      const folderConnector = isLastFolder ? "└─" : "├─";

      rows.push({
         kind: "folder",
         label: `${folderConnector} 📁 ${folder.name}`,
      });

      folder.lists.forEach((list, li) => {
         const isLastList = li === folder.lists.length - 1;
         const verticalBar = isLastFolder ? "  " : "│ ";
         const listConnector = isLastList ? "└─" : "├─";
         const displayName = getDisplayListName(folder.name, list.name);

         rows.push({
            kind: "list",
            label: `${verticalBar} ${listConnector} 📋 ${displayName}`,
            value: {
               folderId: folder.id,
               folderName: folder.name,
               listId: list.id,
               listName: list.name,
            },
            short: `${folder.name} › ${displayName}`,
         });
      });
   });

   return rows;
}

// Returns the flat-row indices that are selectable (list rows only)
function selectableIndices(rows: Row[]): number[] {
   return rows.reduce<number[]>((acc, row, i) => {
      if (row.kind === "list") acc.push(i);
      return acc;
   }, []);
}

// ─── Prompt config ────────────────────────────────────────────────────────────

interface TreeSelectConfig {
   message: string;
   folders: ClickUpFolder[];
   pageSize?: number;
   theme?: Partial<Theme>;
}

// ─── Custom @inquirer/core prompt ────────────────────────────────────────────

export const treeSelect = createPrompt<SelectedList, TreeSelectConfig>(
   (config, done) => {
      const { message, folders, pageSize = 12 } = config;
      const theme = makeTheme(config.theme);

      const hideCursor = '\x1B[?25l';
      const [activeSelectableIdx, setActiveSelectableIdx] = useState(0);
      const [status, setStatus] = useState<Status>('idle');
      const [searchQuery, setSearchQuery] = useState("");
      const prefix = usePrefix({ theme, status });
      const rows = useMemo(() => flattenFolders(folders), [folders]);
      const normalizedQuery = searchQuery.trim().toLowerCase();

      // Indexed once per folder set, then queried on every keystroke.
      const searchLists = useMemo(
         () => createFuzzySearcher(listCandidates(folders), {
            selector: (candidate) => candidate.haystack,
            extendedSearch: true
         }),
         [folders]
      );

      // Filter rows based on search query. Matching runs over the flat candidate
      // list, but the surviving lists are regrouped so the tree keeps its own
      // order rather than being reshuffled by relevance.
      const filteredRows = useMemo(
         () => {
            if (!normalizedQuery) return rows;

            const matchedListIds = new Set(
               searchLists(normalizedQuery).map((candidate) => candidate.listId)
            );

            return flattenFolders(
               folders
                  .map((folder) => ({
                     ...folder,
                     lists: folder.lists.filter((list) => matchedListIds.has(list.id)),
                  }))
                  .filter((folder) => folder.lists.length > 0)
            );
         },
         [normalizedQuery, folders, rows, searchLists]
      );

      const filteredSelectable = useMemo(() => selectableIndices(filteredRows), [filteredRows]);
      const safeSelectableIdx = filteredSelectable.length === 0
         ? 0
         : Math.min(activeSelectableIdx, filteredSelectable.length - 1);
      const activeFlatIndex = filteredSelectable[safeSelectableIdx] ?? -1;

      const page = usePagination({
         items: filteredRows,
         active: Math.max(activeFlatIndex, 0),
         renderItem({ item, isActive }) {
            if (item.kind === "folder") {
               return chalk.dim(item.label);
            }

            return isActive
               ? chalk.cyan(`❯ ${item.label}`)
               : `  ${item.label}`;
         },
         pageSize,
         loop: false,
      });

      useKeypress((key) => {
         if (status === 'done') return;

         if (isUpKey(key)) {
            if (filteredSelectable.length > 0) {
               setActiveSelectableIdx((safeSelectableIdx - 1 + filteredSelectable.length) % filteredSelectable.length);
            }
         } else if (isDownKey(key)) {
            if (filteredSelectable.length > 0) {
               setActiveSelectableIdx((safeSelectableIdx + 1) % filteredSelectable.length);
            }
         } else if (isEnterKey(key)) {
            if (activeFlatIndex !== -1) {
               const selected = filteredRows[activeFlatIndex] as ListRow;
               setStatus('done');
               done(selected.value);
            }
         } else if (isBackspaceKey(key)) {
            setSearchQuery(searchQuery.slice(0, -1));
            setActiveSelectableIdx(0);
         } else if (key.name === 'escape') {
            setSearchQuery("");
            setActiveSelectableIdx(0);
         } else {
            const char = printableChar(key);
            if (char !== null) {
               setSearchQuery(searchQuery + char);
               setActiveSelectableIdx(0);
            }
         }
      });

      // ── Completed state ──────────────────────────────────────────────────────
      if (status === 'done') {
         const selected = filteredRows[activeFlatIndex] as ListRow;
         return selected
            ? `${prefix} List Selected: ${chalk.yellow(selected.short)}`
            : `${prefix} List Selected`;
      }

      const header = `${prefix} ${(theme.style.message(message, 'idle'))}`;

      const searchLine = searchQuery
         ? `${chalk.cyan("❯")} Search: ${chalk.yellow(searchQuery)}`
         : `${chalk.dim("❯")} Search: ${chalk.dim("(type to filter lists)")}`;

      const instructions = searchQuery
         ? chalk.dim("  (↑↓ navigate, Enter select, Esc clear, Backspace delete)")
         : chalk.dim("  (↑↓ navigate, Enter select, type to search)");

      const body = filteredRows.length === 0
         ? chalk.dim("  No matching lists found")
         : page;

      return [
         `${hideCursor}${header}`,
         searchLine,
         body,
         instructions
      ].join('\n');
   }
);