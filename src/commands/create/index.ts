import { Command } from "commander";
import { createTicketAction } from "./actions";


export function createTicketCommand() {
   const create = new Command('create')
      .description("Create ticket directly without interactive mode")
      .requiredOption('-k, --key <ISSUE-KEY>', 'Jira issue key', (value) => value.toUpperCase())
      .requiredOption('-l, --list <LIST-NAME>', "Clickup List name", value => value.trim())
      .action(createTicketAction)

   return create
}