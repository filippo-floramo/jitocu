import { Command } from "commander";
import { configCommand } from "./commands/config";
import { createTicketCommand } from "./commands/create";
import { timeCommand } from "./commands/time";
import { DefaultCLICommand } from "./commands/default";
import { createContext } from "./context";
import { run } from "./commands/shared/run";
import packageJson from "../package.json" with { type: "json" };

const program = new Command();

program
  .name("jitocu")
  .description("Copy Jira issues assigned to you to ClickUp")
  .version(packageJson.version);

const ctx = await createContext();

program.addCommand(configCommand(ctx))
program.addCommand(createTicketCommand(ctx))
program.addCommand(timeCommand(ctx))

program.action(async () => run(ctx, (c) => new DefaultCLICommand(c)));

program.parse();
