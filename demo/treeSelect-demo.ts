#!/usr/bin/env bun
/**
 * Demo for treeSelect prompt
 * Shows hierarchical folder/list selection with search functionality
 */

import { treeSelect } from "../src/prompts/treeSelect";
import { ClickUpFolder } from "../src/services/clickUp";

// Sample data for demo.
// Several list names repeat across folders on purpose ("Backlog", "Roadmap",
// "List") so that searching by list name alone is ambiguous and the parent
// folder name is what disambiguates.
const sampleFolders: ClickUpFolder[] = [
  {
    id: "folder-1",
    name: "Engineering",
    lists: [
      { id: "list-1a", name: "Backlog" },
      { id: "list-1b", name: "Bug Tracker" },
      { id: "list-1c", name: "Tech Debt" },
      { id: "list-1d", name: "Roadmap" },
      { id: "list-1e", name: "List" }, // Will show as "Engineering - list"
    ],
  },
  {
    id: "folder-2",
    name: "Design",
    lists: [
      { id: "list-2a", name: "Backlog" },
      { id: "list-2b", name: "UI Components" },
      { id: "list-2c", name: "Brand Assets" },
      { id: "list-2d", name: "List" }, // Will show as "Design - list"
    ],
  },
  {
    id: "folder-3",
    name: "Marketing",
    lists: [
      { id: "list-3a", name: "Campaigns" },
      { id: "list-3b", name: "Content Calendar" },
      { id: "list-3c", name: "Social Media" },
      { id: "list-3d", name: "Roadmap" },
    ],
  },
  {
    id: "folder-4",
    name: "Operations",
    lists: [
      { id: "list-4a", name: "Planning" },
      { id: "list-4b", name: "Maintenance" },
      { id: "list-4c", name: "List" }, // Will show as "Operations - list"
    ],
  },
];

async function runTreeSelectDemo() {
  console.log("🌳 Tree Select Demo");
  console.log("Features:");
  console.log("- Hierarchical folder/list structure");
  console.log("- Search matches the list name OR its parent folder name");
  console.log("- Space separates terms, which match in any order");
  console.log("- Results keep tree order instead of being ranked");
  console.log("- Keyboard navigation (↑↓, Enter, Esc clears, Backspace deletes)");
  console.log("- Default 'List' items renamed to '(foldername) - list'");
  console.log("");
  console.log("Try typing:");
  console.log("  design            → only the Design folder's lists");
  console.log("  backlog           → Backlog in both Engineering and Design");
  console.log("  design backlog    → narrows to Design › Backlog");
  console.log("  backlog design    → same result, terms are order independent");
  console.log("  engin roadm       → Engineering › Roadmap, on partial terms");
  console.log("  ops list          → the default-named list under Operations");
  console.log("  design - list     → punctuation is searchable too");
  console.log("  !roadmap          → everything except the Roadmap lists");
  console.log("");
  console.log("Note: matching is fuzzy, so short terms like 'eng road' also pull in");
  console.log("loose matches. Rows stay in tree order rather than relevance order,");
  console.log("so the first row is not necessarily the closest match.");
  console.log("");

  try {
    const result = await treeSelect({
      message: "Select a ClickUp list:",
      folders: sampleFolders,
      pageSize: 12,
    });

    console.log("\n✅ Selected:");
    console.log(`   Folder : ${result.folderName} (${result.folderId})`);
    console.log(`   List   : ${result.listName} (${result.listId})`);
    console.log(`   Short  : ${result.folderName} › ${result.listName}`);
  } catch (err) {
    if ((err as any).code === "ERR_USE_AFTER_CLOSE") {
      console.log("\nPrompt cancelled.");
    } else {
      console.error("\nError:", err);
    }
  }
}

// Run the demo
runTreeSelectDemo();
