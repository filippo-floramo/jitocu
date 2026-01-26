import { CLICommand } from "../shared/command.interface";
import { getJSONStore } from "../../store/JSONStore";
import { confirm } from "@inquirer/prompts";
import chalk from "chalk";

export class ClearStoreCommand implements CLICommand {
   public async execute(): Promise<void> {
      const store = getJSONStore();

      const isSure = await confirm({
         message: chalk.red("[WARNING] This command will clear all data are you sure to continue?")
      });

      if (isSure) {
         await store.clear();
      }
      return
   }
}