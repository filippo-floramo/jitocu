#!/usr/bin/env bun

import { Command } from "commander";
import { getJiraClient, type JiraIssueChoice } from "./clients/jira";
import { getClickUpClient, type ClickUpFolder } from "./clients/clickUp";
import { select } from "@inquirer/prompts";
import checkboxPlusPrompt from "inquirer-checkbox-plus-plus";
import ora from "ora";
import fuzzy from 'fuzzy';
import { createConfigCommand } from "./commands/config";
import { getMissingRequiredSettings } from "./store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "./store/utils/showMissingSettingsPaths";
import JsonStore, { getJSONStore } from "./store/JSONStore";

const program = new Command();

program
  .name("jitocu")
  .description("Copy Jira issues assigned to you to ClickUp")
  .version("1.0.0");

program.addCommand(createConfigCommand())

program.action(async () => {
  const store = getJSONStore()

  const missing = await getMissingRequiredSettings();

  if (missing.length > 0) {
    showMissingSettignsPaths(missing)
    process.exit(1);
  }

  const jiraClient = await getJiraClient(store);
  const clickUpClient = await getClickUpClient(store);

  const jiraSpinner = ora("Fetching Jira issues...").start();
  let jiraIssues: JiraIssueChoice[];
  try {
    jiraIssues = await jiraClient.fetchMyJiraIssues();
    jiraSpinner.succeed("Jira issues loaded");
  } catch (error) {
    jiraSpinner.fail("Failed to fetch Jira issues");
    throw error;
  }
  const answers = await checkboxPlusPrompt({
    message: "Select Jira issues",
    searchable: true,
    pageSize: 20,
    highlight: true,
    validate: (answer: JiraIssueChoice[]) => {
      if (answer.length === 0) {
        return 'You must choose at least one issue.';
      }
      return true;
    },
    source: async (_, input) => {
      input = input || "";
      const fuzzySearch = fuzzy.filter(input, jiraIssues, {
        extract: (item) => item.name
      });
      return fuzzySearch.map((el) => el.original);
    }
  });

  const foldersSpinner = ora("Fetching ClickUp folders...").start();
  let folders: ClickUpFolder[];
  try {
    folders = await clickUpClient.getSharedFolders();
    foldersSpinner.succeed("ClickUp folders loaded");
  } catch (error) {
    foldersSpinner.fail("Failed to fetch ClickUp folders");
    throw error;
  }

  const selectedFolderId = await select({
    message: "Select ClickUp shared folder",
    choices: folders.map((folder) => ({ name: folder.name, value: folder.id }))
  });

  const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
  if (!selectedFolder) {
    console.error("❌ Selected folder not found");
    process.exit(1);
  }

  const selectedListId = await select({
    message: "Select list",
    choices: selectedFolder.lists.map((list) => ({ name: list.name, value: list.id }))
  });

  console.log(' ');
  for (const ans of answers) {
    const taskSpinner = ora(`Creating task: ${ans}`).start();
    try {
      await clickUpClient.createTask(ans, selectedListId);
      taskSpinner.succeed(`Task created: ${ans}`);
    } catch (error) {
      taskSpinner.fail(`Failed to create task: ${ans}`);
      throw error;
    }
  }

  console.log();
  console.log(`✅ Successfully created ${answers.length} task${answers.length > 1 ? 's' : ''} in ClickUp!`);
  process.exit(0)
});

program.parse();
