import {
   createPrompt,
   useState,
   useKeypress,
   usePrefix,
   isUpKey,
   isDownKey,
   isEnterKey,
   isBackspaceKey,
   makeTheme,
   type Theme,
} from "@inquirer/core";
import chalk from "chalk";
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
      const prefix = usePrefix({ theme });

      const hideCursor = '\x1B[?25l';
      const rows = flattenFolders(folders);

      const [cursorPos, setCursorPos] = useState(0);
      const [isDone, setIsDone] = useState(false);
      const [searchQuery, setSearchQuery] = useState("");
      const normalizedQuery = searchQuery.trim().toLowerCase();

      // Filter rows based on search query
      const filteredRows = normalizedQuery
         ? flattenFolders(
            folders
               .map((folder) => {
                  const filteredLists = folder.lists.filter((list) => {
                     const displayName = getDisplayListName(folder.name, list.name);
                     return displayName.toLowerCase().includes(normalizedQuery);
                  });

                  return {
                     ...folder,
                     lists: filteredLists,
                  };
               })
               .filter((folder) => folder.lists.length > 0)
         )
         : rows;

      const filteredSelectable = selectableIndices(filteredRows);

      const activeFlatIndex = filteredSelectable[cursorPos];

      useKeypress((key) => {
         if (isDone) return;

         if (isUpKey(key)) {
            setCursorPos((cursorPos - 1 + filteredSelectable.length) % filteredSelectable.length);
         } else if (isDownKey(key)) {
            setCursorPos((cursorPos + 1) % filteredSelectable.length);
         } else if (isEnterKey(key)) {
            if (filteredSelectable.length > 0) {
               const selected = filteredRows[activeFlatIndex] as ListRow;
               setIsDone(true);
               done(selected.value);
            }
         } else if (isBackspaceKey(key)) {
            setSearchQuery(searchQuery.slice(0, -1));
            setCursorPos(0);
         } else if (key.name === 'escape') {
            setSearchQuery("");
            setCursorPos(0);
         } else if (key.name && key.name.length === 1 && !key.ctrl) {
            setSearchQuery(searchQuery + key.name);
            setCursorPos(0);
         }
      });

      // ── Completed state ──────────────────────────────────────────────────────
      if (isDone) {
         const selected = filteredRows[activeFlatIndex] as ListRow;
         return `${prefix} ${message} ${selected.short}`;
      }

      // ── Windowed rendering ───────────────────────────────────────────────────
      const half = Math.floor(pageSize / 2);

      // Calculate window start, ensuring it doesn't go negative
      let windowStart = Math.max(0, activeFlatIndex - half);

      // Ensure window doesn't exceed the total rows
      if (windowStart + pageSize > filteredRows.length) {
         windowStart = Math.max(0, filteredRows.length - pageSize);
      }

      const windowEnd = Math.min(filteredRows.length, windowStart + pageSize);
      const visibleRows = filteredRows.slice(windowStart, windowEnd);

      const lines = visibleRows.map((row, wi) => {
         const absoluteIndex = windowStart + wi;

         if (row.kind === "folder") {
            // Folder rows: dimmed, never highlighted
            return chalk.dim(row.label);
         }

         const isActive = absoluteIndex === activeFlatIndex;
         return isActive
            ? chalk.cyan(`❯ ${row.label}`)
            : `  ${row.label}`;
      });

      const header = `${prefix} ${(theme.style.message(message, 'idle'))}`;

      const searchLine = searchQuery
         ? `${chalk.cyan("❯")} Search: ${chalk.yellow(searchQuery)}`
         : `${chalk.dim("❯")} Search: ${chalk.dim("(type to filter lists)")}`;

      const instructions = searchQuery
         ? chalk.dim("  (↑↓ navigate, Enter select, Esc clear, Backspace delete)")
         : chalk.dim("  (↑↓ navigate, Enter select, type to search)");

      return [
         `${hideCursor}${header}`,
         searchLine,
         ...lines,
         instructions
      ].join('\n');
   }
);