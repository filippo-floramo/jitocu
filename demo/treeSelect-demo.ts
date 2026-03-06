#!/usr/bin/env bun
/**
 * Demo for treeSelect prompt
 * Shows hierarchical folder/list selection with search functionality
 */

import { treeSelect } from "../src/prompts/treeSelect";
import { ClickUpFolder } from "../src/services/clickUp";

// Sample data for demo
const sampleFolders: ClickUpFolder[] = [
  {
    id: "folder-1",
    name: "Engineering",
    lists: [
      { id: "list-1a", name: "Sprint Backlog" },
      { id: "list-1b", name: "Bug Tracker" },
      { id: "list-1c", name: "Tech Debt" },
      { id: "list-1d", name: "List" }, // Will show as "Engineering - list"
    ],
  },
  {
    id: "folder-2",
    name: "Design",
    lists: [
      { id: "list-2a", name: "UI Components" },
      { id: "list-2b", name: "Brand Assets" },
      { id: "list-2c", name: "List" }, // Will show as "Design - list"
    ],
  },
  {
    id: "folder-3",
    name: "Marketing",
    lists: [
      { id: "list-3a", name: "Campaigns" },
      { id: "list-3b", name: "Content Calendar" },
      { id: "list-3c", name: "Social Media" },
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
  console.log("- Search functionality (type to filter)");
  console.log("- Keyboard navigation (↑↓, Enter)");
  console.log("- Default 'List' items renamed to '(foldername) - list'");
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
