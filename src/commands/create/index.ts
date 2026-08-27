import { Command } from "commander";
import { CreateTicketCommand } from "./default";
import { run } from "../shared/run";
import type { AppContext } from "../../context";



export function createTicketCommand(ctx: AppContext) {
   const create = new Command('create')
      .description("Create ticket directly without interactive mode")
      .requiredOption('-k, --key <ISSUE-KEY>', 'Jira issue key', (value) => value.toUpperCase())
      .requiredOption('-l, --list <LIST-NAME>', "Clickup List name", value => value.trim())
      .action(async (opts) => run(ctx, (c) => new CreateTicketCommand(c, opts)))

   return create
}
