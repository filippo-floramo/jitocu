import { Command } from "commander";
import { configCommand } from "./commands/config";
import { createTicketCommand } from "./commands/create";
import { timeCommand } from "./commands/time";
import { DefaultCLICommand } from "./commands/default";
import { createContext, type AppContext } from "./context";
import { run } from "./commands/shared/run";
import { handleError } from "./errors/handleError";
import packageJson from "../package.json" with { type: "json" };

const program = new Command();

program
  .name("jitocu")
  .description("Copy Jira issues assigned to you to ClickUp")
  .version(packageJson.version);

// Store setup can fail on its own (unreadable or corrupt config file), and it
// runs before any command's own error handling, so it needs its own.
let ctx: AppContext;
try {
  ctx = await createContext();
} catch (error) {
  handleError(error);
}

program.addCommand(configCommand(ctx))
program.addCommand(createTicketCommand(ctx))
program.addCommand(timeCommand(ctx))

program.action(async () => run(ctx, (c) => new DefaultCLICommand(c)));

program.parse();
