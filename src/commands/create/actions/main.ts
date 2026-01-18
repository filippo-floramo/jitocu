import ora from "ora";
import { getClickUpClient } from "../../../clients/clickUp";
import { getJiraClient, JiraIssueChoice } from "../../../clients/jira";
import { getJSONStore } from "../../../store/JSONStore";
import { getMissingRequiredSettings } from "../../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../../store/utils/showMissingSettingsPaths";
import { select } from "@inquirer/prompts";

interface createTicketOptions {
   key: string;
   list: string;
}

export async function createTicketAction(options: createTicketOptions) {
   const store = getJSONStore();
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
      jiraIssues = await jiraClient.fetchJiraIssues(options.key);
      if (jiraIssues.length === 0) {
         throw Error("Issue not found")
      }
      jiraSpinner.succeed("Jira issues found");
   } catch (error) {
      jiraSpinner.fail("Failed to fetch Jira issues");
      throw error;
   }

   const res = await select({ message: "Is this your issue?", choices: jiraIssues })

   const foldersSpinner = ora("Fetching ClickUp folders...").start();
   let lists: { name: string, value: string }[];
   try {
      lists = await clickUpClient.getListByName(options.list);
      foldersSpinner.succeed("ClickUp folders loaded");
   } catch (error) {
      foldersSpinner.fail("Failed to fetch ClickUp folders");
      throw error;
   }

   const selectedList = await select({ message: "Found these lists", choices: lists });

   const taskSpinner = ora(`Creating task: ${res}`).start();
   try {
      await clickUpClient.createTask(res, selectedList);
      taskSpinner.succeed(`Task created: ${res}`);
   } catch (error) {
      taskSpinner.fail(`Failed to create task: ${res}`);
      throw error;
   }

   process.exit(0)
}