import { CLICommand } from "../shared/command.interface";
import { JiraIssueChoice, JiraService } from "../../services/jira";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import { select } from "@inquirer/prompts";
import { ClickUpService } from "../../services/clickUp";
import { withSpinner } from "../../utils/withSpinner";
import { ConfigError } from "../../errors";

interface CreateTicketOptions {
   key: string;
   list: string;
}

export class CreateTicketCommand implements CLICommand {
   private options: CreateTicketOptions;

   constructor(opts: CreateTicketOptions) {
      this.options = opts
   }

   public async execute() {
      const missing = await getMissingRequiredSettings();

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

      const jiraSrv = await JiraService.getInstance();
      const clickUpSrv = await ClickUpService.getInstance();

      const jiraIssues = await withSpinner(
         async () => await jiraSrv.getMyIssuesByKey(this.options.key),
         {
            text: "Fetching Jira issues...",
            successText: "Jira issues found",
            failText: "Failed to fetch Jira issues"
         }
      );

      if (jiraIssues.length === 0) {
         throw new Error("Issue not found")
      }

      const res = await select({ message: "Is this your issue?", choices: jiraIssues })

      const lists = await withSpinner(
         async () => await clickUpSrv.getListByName(this.options.list),
         {
            text: "Fetching ClickUp folders...",
            successText: "ClickUp folders loaded",
            failText: "Failed to fetch ClickUp folders"
         }
      );

      const selectedList = await select({ message: "Found these lists", choices: lists });

      await withSpinner(
         async () => await clickUpSrv.createTaskAssignedToMe(res, selectedList),
         {
            text: `Creating task: ${res}`,
            successText: "Task created",
            failText: `Failed to create task: ${res}`
         }
      );

      console.log(`✅ Successfully created task ${res} in ClickUp!`);
   }
}