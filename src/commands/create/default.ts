import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import { select } from "@inquirer/prompts";
import { withSpinner } from "../../helpers/withSpinner";
import { CLIError, ConfigError } from "../../errors";

interface CreateTicketOptions {
   key: string;
   list: string;
}

export class CreateTicketCommand implements CLICommand {
   private options: CreateTicketOptions;

   constructor(
      private ctx: AppContext,
      opts: CreateTicketOptions
   ) {
      this.options = opts
   }

   public async execute() {
      const missing = getMissingRequiredSettings(this.ctx.store);

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

      const jiraSrv = this.ctx.jira;
      const clickUpSrv = this.ctx.clickUp;

      const jiraIssues = await withSpinner(
         async () => await jiraSrv.getMyIssuesByKey(this.options.key),
         {
            text: "Fetching Jira issues...",
            successText: "Jira issues found",
            failText: "Failed to fetch Jira issues"
         }
      );

      if (jiraIssues.length === 0) {
         throw new CLIError(`No Jira issue assigned to you found for key "${this.options.key}".`)
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

      const resLabel = `${res.key} - ${res.summary}`;

      await withSpinner(
         async () => await clickUpSrv.createTaskAssignedToMe(res, selectedList),
         {
            text: `Creating task: ${resLabel}`,
            successText: "Task created",
            failText: `Failed to create task: ${resLabel}`
         }
      );

      console.log(`✅ Successfully created task ${resLabel} in ClickUp!`);
   }
}