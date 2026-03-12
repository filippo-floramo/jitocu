import { Command } from "commander";
import { DefaultTimeCommand } from "./default";
import { handleError } from "../../errors/handleError";
import { AddTimeEntryCommand } from "./add";

export function timeCommand() {
   const time = new Command('time')
      .description("Manage time entries in ClickUp")
      .action(async () => {
         try {
            const command = new DefaultTimeCommand();
            await command.execute();
            process.exit(0);
         } catch (error) {
            handleError(error);
         }
      });

   time.command('add')
      .description('Add a time entry manually')
      .option('-l, --list <LIST-NAME>', "Clickup List name", value => value.trim())
      .action(async (opts) => {
         try {
            const command = new AddTimeEntryCommand(opts);
            await command.execute()
            process.exit(0)
         } catch (error) {
            handleError(error);
         }
      })

   return time;
}
