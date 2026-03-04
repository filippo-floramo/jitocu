import { Command } from "commander";
import { DefaultTimeCommand } from "./command";
import { handleError } from "../../errors/handleError";

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

   return time;
}
