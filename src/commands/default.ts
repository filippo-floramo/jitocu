import { search, select } from "@inquirer/prompts";
import { ClickUpFolder, ClickUpService } from "../services/clickUp";
import { JiraIssueChoice, JiraService } from "../services/jira";
import { getMissingRequiredSettings } from "../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../store/utils/showMissingSettingsPaths";
import { withSpinner } from "../utils/withSpinner";
import { ConfigError } from "../errors";
import fuzzy from 'fuzzy';
import { CLICommand } from "./shared/command.interface";


export class DefaultCLICommand implements CLICommand {

   async execute(): Promise<void> {
      const missing = await getMissingRequiredSettings();

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

      const jiraSrv = await JiraService.getInstance();
      const clickUpSrv = await ClickUpService.getInstance();

      const jiraIssues: JiraIssueChoice[] = await withSpinner(
         async () => await jiraSrv.getMyIssues(),
         {
            text: "Fetching jira issues",
            successText: "Jira issues",
            failText: "Failed to fetch Jira issues"
         }
      )

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

      const folders: ClickUpFolder[] = await withSpinner(
         async () => await clickUpSrv.getMySharedFolders(),
         {
            text: "Fetching ClickUp folders...",
            successText: "ClickUp folders loaded",
            failText: "Failed to fetch ClickUp folders"
         }
      )

      const selectedFolderId = await select({
         message: "Select ClickUp shared folder",
         choices: folders.map((folder) => ({ name: folder.name, value: folder.id }))
      });

      const selectedFolder = folders.find((folder) => folder.id === selectedFolderId);
      if (!selectedFolder) {
         console.error("❌ Selected folder not found");
         process.exit(0);
      }

      const selectedListId = await select({
         message: "Select list",
         choices: selectedFolder.lists.map((list) => ({ name: list.name, value: list.id }))
      });

      console.log(' ');
      await withSpinner(
         async () => await clickUpSrv.createTaskAssignedToMe(answer, selectedListId),
         {
            text: `Creating task: ${answer}`,
            successText: `Task created`,
            failText: `Failed to create task: ${answer}`
         }
      )

      console.log();
      console.log(`✅ Successfully created  task ${answer} in ClickUp!`);
   }
}