import { CLICommand } from "../shared/command.interface";
import { getJSONStore } from "../../store/JSONStore";
import { validateSettingPath } from "../../store/utils/validateSettingPath";
import { baseSettingsPath } from "../../store/constants";
import { ConfigError } from "../../errors";
import { showValidPaths } from "../../store/utils/showValidPaths";
import chalk from "chalk";

export class SetSettingsCommand implements CLICommand {
   constructor(
      private path: string,
      private value: string
   ) { }

   public async execute(): Promise<void> {
      const store = getJSONStore();

      if (!validateSettingPath(this.path)) {
         throw new ConfigError(`Invalid Path ${this.path}`, showValidPaths)
      }
      const fullPath = `${baseSettingsPath}.${this.path}`;

      await store.updatePath(fullPath as any, this.value);
      console.log(chalk.green(`✅ Set ${this.path} = ${this.value}`));
   }
}
