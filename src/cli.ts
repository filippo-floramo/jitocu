import { Command } from "commander";
import { configCommand } from "./commands/config";
import { createTicketCommand } from "./commands/create";
import { DefaultCLICommand } from "./commands/default";
import { handleError } from "./errors/handleError";

const program = new Command();

program
  .name("jitocu")
  .description("Copy Jira issues assigned to you to ClickUp")
  .version("0.1.0");

program.addCommand(configCommand())
program.addCommand(createTicketCommand())

program.action(async () => {
  try {
    const command = new DefaultCLICommand();
    await command.execute()
    process.exit(0)
  } catch (error) {
    handleError(error)
  }
});

program.parse();
