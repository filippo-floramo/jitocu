import { select } from "@inquirer/prompts";
import type { AppContext } from "../../context";
import { withSpinner } from "../../helpers/withSpinner";
import { datePrompt } from "../../prompts/datePicker";
import { assertConfigured } from "../shared/assertConfigured";
import { CLICommand } from "../shared/command.interface";
import { selectListFromTree, selectTaskFromList, submitTimeEntries } from "./timeEntryFlow";

interface CreateTicketOptions {
   list: string;
}

export class AddTimeEntryCommand implements CLICommand {
   private options: CreateTicketOptions;

   constructor(
      private ctx: AppContext,
      opts: CreateTicketOptions
   ) {
      this.options = opts
   }

   /** With --list, disambiguate by name; otherwise browse the folder tree. */
   private async resolveListId(): Promise<string> {
      if (!this.options.list) {
         return await selectListFromTree(this.ctx)
      }

      const lists = await withSpinner(
         async () => await this.ctx.clickUp.getListByName(this.options.list),
         {
            text: "Fetching ClickUp folders...",
            successText: "ClickUp folders loaded",
            failText: "Failed to fetch ClickUp folders"
         }
      );

      return await select({ message: "Found these lists", choices: lists });
   }

   public async execute() {
      assertConfigured(this.ctx);

      const listId = await this.resolveListId()
      const selectedTask = await selectTaskFromList(this.ctx, listId)
      const targetDate = await datePrompt({
         message: "Select a Date",
         format: "date"
      })

      await submitTimeEntries(this.ctx, { selectedTask, targetDate })
   }
}
