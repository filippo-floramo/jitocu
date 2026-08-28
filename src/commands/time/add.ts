import type { AppContext } from "../../context";
import { datePrompt } from "../../prompts/datePicker";
import { assertConfigured } from "../shared/assertConfigured";
import { CLICommand } from "../shared/command.interface";
import { selectListByName } from "../shared/selectListByName";
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

      return await selectListByName(this.ctx, this.options.list)
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
