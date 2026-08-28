import { CLICommand } from "../shared/command.interface";
import { assertConfigured } from "../shared/assertConfigured";
import type { AppContext } from "../../context";
import { select } from "@inquirer/prompts";
import { withSpinner } from "../../helpers/withSpinner";
import { CLIError } from "../../errors";
import { selectListByName } from "../shared/selectListByName";

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
      assertConfigured(this.ctx);

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

      const selectedList = await selectListByName(this.ctx, this.options.list);

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