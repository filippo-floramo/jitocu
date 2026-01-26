import { Command } from "commander";
import { CreateTicketCommand } from "./command";
import { handleError } from "../../errors/handleError";



export function createTicketCommand() {
   const create = new Command('create')
      .description("Create ticket directly without interactive mode")
      .requiredOption('-k, --key <ISSUE-KEY>', 'Jira issue key', (value) => value.toUpperCase())
      .requiredOption('-l, --list <LIST-NAME>', "Clickup List name", value => value.trim())
      .action(async (opts) => {
         try {  
            const command = new CreateTicketCommand(opts)
            await command.execute()
            process.exit(0)
         } catch (error) {
            handleError(error)
         }
      })

   return create
}