import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { validateSettingPath } from "../../store/utils/validateSettingPath";
import { baseSettingsPath } from "../../store/constants";
import { ConfigError } from "../../errors";
import { showValidPaths } from "../../store/utils/showValidPaths";
import chalk from "chalk";

export class SetSettingsCommand implements CLICommand {
   constructor(
      private ctx: AppContext,
      private path: string,
      private value: string
   ) { }

   public async execute(): Promise<void> {
      if (!validateSettingPath(this.path)) {
         throw new ConfigError(`Invalid Path ${this.path}`, showValidPaths)
      }
      const fullPath = `${baseSettingsPath}.${this.path}`;

      this.ctx.store.set(fullPath as any, this.value);
      console.log(chalk.green(`✅ Set ${this.path} = ${this.value}`));
   }
}
