import { CLICommand } from "../shared/command.interface";
import { getJSONStore } from "../../store/JSONStore";
import { baseSettingsPath } from "../../store/constants";
import { validateSettingPath } from "../../store/utils/validateSettingPath";
import chalk from "chalk";
import { CLIError, ConfigError } from "../../errors";
import { showValidPaths } from "../../store/utils/showValidPaths";

export class GetSettingsCommand implements CLICommand {
   constructor(
      private path: string
   ) { }

   public async execute(): Promise<void> {
      const store = getJSONStore();
      if (!validateSettingPath(this.path)) {
         throw new ConfigError(`Invalid Path ${this.path}`, showValidPaths)
      }
      const fullPath = `${baseSettingsPath}.${this.path}`;
      const value = await store.getPath(fullPath as any);
      console.log(value);
   }
}