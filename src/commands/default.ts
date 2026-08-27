import { search } from "@inquirer/prompts";
import { ClickUpFolder } from "../services/clickUp";
import { JiraIssueChoice } from "../services/jira";
import type { AppContext } from "../context";
import { getMissingRequiredSettings } from "../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../store/utils/showMissingSettingsPaths";
import { withSpinner } from "../helpers/withSpinner";
import { ConfigError } from "../errors";
import fuzzy from 'fuzzy';
import { CLICommand } from "./shared/command.interface";
import { treeSelect } from "../prompts/treeSelect";


export class DefaultCLICommand implements CLICommand {
   constructor(
      private ctx: AppContext
   ) { }

   async execute(): Promise<void> {
      const missing = getMissingRequiredSettings(this.ctx.store);

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

      const jiraSrv = this.ctx.jira;
      const clickUpSrv = this.ctx.clickUp;

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

      const selectedList = await treeSelect({
         message: "Select a ClickUp list:",
         folders: folders,
         pageSize: 14,
      });

      const selectedListId = selectedList.listId;

      const answerLabel = `${answer.key} - ${answer.summary}`;

      console.log(' ');
      await withSpinner(
         async () => await clickUpSrv.createTaskAssignedToMe(answer, selectedListId),
         {
            text: `Creating task: ${answerLabel}`,
            successText: `Task created`,
            failText: `Failed to create task: ${answerLabel}`
         }
      )

      console.log();
      console.log(`✅ Successfully created  task ${answerLabel} in ClickUp!`);
   }
}