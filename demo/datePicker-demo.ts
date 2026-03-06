#!/usr/bin/env bun
/**
 * Demo for datePicker prompt
 * Shows date selection with calendar interface
 */

import { datePrompt } from "../src/prompts/datePicker";

async function runDatePickerDemo() {
  console.log("📅 Date Picker Demo");
  console.log("Features:");
  console.log("- Calendar interface");
  console.log("- Keyboard navigation (↑↓←→, Enter)");
  console.log("- Month/year navigation");
  console.log("- Today highlighting");
  console.log("");

  try {
    const selectedDate = await datePrompt({
      message: "Select a date:",
      format: "datetime"
    });

    console.log("\n✅ Selected date:");
    console.log(`   Date     : ${selectedDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`);
    console.log(`   ISO      : ${selectedDate.toISOString()}`);
    console.log(`   Timestamp: ${selectedDate.getTime()}`);
  } catch (err) {
    if ((err as any).code === "ERR_USE_AFTER_CLOSE") {
      console.log("\nPrompt cancelled.");
    } else {
      console.error("\nError:", err);
    }
  }
}

// Run the demo
runDatePickerDemo();
