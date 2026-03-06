#!/usr/bin/env bun
/**
 * Demo for timesheetTable prompt
 * Shows interactive spreadsheet-style time entry table
 */

import spreadsheetTable from "../src/prompts/timesheetTable";
import { MappedTaskForEntry } from "../src/helpers/mapTimeEntries";

// Sample time entries data for demo (matching MappedTaskForEntry interface)
const sampleTimeEntries: MappedTaskForEntry[] = [
  {
    id: "task-1",
    name: "Frontend Development",
    task_url: "https://clickup.com/t/task-1",
    cells: {
      "Mon": 4.5,
      "Tue": 6.0,
      "Wed": 0,
      "Thu": 8.0,
      "Fri": 5.5,
      "Sat": 0,
      "Sun": 0,
    }
  },
  {
    id: "task-2", 
    name: "Backend API",
    task_url: "https://clickup.com/t/task-2",
    cells: {
      "Mon": 3.0,
      "Tue": 0,
      "Wed": 7.5,
      "Thu": 4.0,
      "Fri": 6.0,
      "Sat": 0,
      "Sun": 0,
    }
  },
  {
    id: "task-3",
    name: "Code Review",
    task_url: "https://clickup.com/t/task-3",
    cells: {
      "Mon": 2.0,
      "Tue": 1.5,
      "Wed": 0,
      "Thu": 3.0,
      "Fri": 2.5,
      "Sat": 0,
      "Sun": 0,
    }
  },
  {
    id: "task-4",
    name: "Documentation",
    task_url: "https://clickup.com/t/task-4",
    cells: {
      "Mon": 0,
      "Tue": 2.0,
      "Wed": 1.0,
      "Thu": 0,
      "Fri": 3.0,
      "Sat": 0,
      "Sun": 0,
    }
  },
];

async function runTimesheetTableDemo() {
  console.log("📊 Timesheet Table Demo");
  console.log("Features:");
  console.log("- Spreadsheet-style interface");
  console.log("- Keyboard navigation (↑↓←→, Enter)");
  console.log("- Cell selection for time entry");
  console.log("- Visual highlighting of current cell");
  console.log("- Press Q/Esc to close and export data");
  console.log("- Press A to add new time entry");
  console.log("");

  try {
    const result = await spreadsheetTable({
      message: "Weekly time report - Select a cell to add time entry:",
      rows: sampleTimeEntries,
    });

    // Handle the new result structure
    if (result.type === 'action') {
      if (result.action === 'close') {
        console.log("\n❌ Timesheet closed - No action taken");
      } else if (result.action === 'add') {
        console.log("\n➕ Add new time entry requested");
      }
    } else if (result.type === 'cell') {
      console.log("\n✅ Cell selected:");
      console.log(`   Task    : ${result.selection.task.name} (${result.selection.task.id})`);
      console.log(`   Day     : ${result.selection.dayName} (${result.selection.day})`);
      console.log(`   Current : ${result.selection.task.cells[result.selection.dayName] || 0} hours`);
      console.log(`   Task URL: ${result.selection.task.task_url}`);
    }
  } catch (err) {
    if ((err as any).code === "ERR_USE_AFTER_CLOSE") {
      console.log("\nPrompt cancelled.");
    } else {
      console.error("\nError:", err);
    }
  }
}

// Run the demo
runTimesheetTableDemo();
