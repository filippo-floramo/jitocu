import { Command } from "commander";
import { getJiraClient, type JiraIssueChoice } from "./clients/jira";
import { getClickUpClient, type ClickUpFolder } from "./clients/clickUp";
import { search, select } from "@inquirer/prompts";
import ora from "ora";
import fuzzy from 'fuzzy';
import { configCommand } from "./commands/config";
import { getMissingRequiredSettings } from "./store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "./store/utils/showMissingSettingsPaths";
import { getJSONStore } from "./store/JSONStore";
import { createTicketCommand } from "./commands/create";

const program = new Command();

program
  .name("jitocu")
  .description("Copy Jira issues assigned to you to ClickUp")
  .version("0.1.0");

program.addCommand(configCommand())
program.addCommand(createTicketCommand())

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
    jiraIssues = await jiraClient.fetchJiraIssues();
    jiraSpinner.succeed("Jira issues loaded");
  } catch (error) {
    jiraSpinner.fail("Failed to fetch Jira issues");
    throw error;
  }
  const answer = await search({
    message: "Select Jira issues",
    pageSize: 20,
    source: async (input) => {
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
  const taskSpinner = ora(`Creating task: ${answer}`).start();
  try {
    await clickUpClient.createTask(answer, selectedListId);
    taskSpinner.succeed(`Task created: ${answer}`);
  } catch (error) {
    taskSpinner.fail(`Failed to create task: ${answer}`);
    throw error;
  }

  console.log();
  console.log(`✅ Successfully created  task ${answer} in ClickUp!`);
  process.exit(0)
});

program.parse();
