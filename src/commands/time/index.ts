import { Command } from "commander";
import { DefaultTimeCommand } from "./default";
import { AddTimeEntryCommand } from "./add";
import { run } from "../shared/run";
import type { AppContext } from "../../context";

export function timeCommand(ctx: AppContext) {
   const time = new Command('time')
      .description("Manage time entries in ClickUp")
      .action(async () => run(ctx, (c) => new DefaultTimeCommand(c)));

   time.command('add')
      .description('Add a time entry manually')
      .option('-l, --list <LIST-NAME>', "Clickup List name", value => value.trim())
      .action(async (opts) => run(ctx, (c) => new AddTimeEntryCommand(c, opts)))

   return time;
}
