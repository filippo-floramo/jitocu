import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";

export class ClearStoreCommand implements CLICommand {
   constructor(
      private ctx: AppContext
   ) { }

   public async execute(): Promise<void> {
      const isSure = await confirm({
         message: chalk.red("[WARNING] This command will clear all data are you sure to continue?")
      });

      if (isSure) {
         this.ctx.store.clear();
      }
      return
   }
}