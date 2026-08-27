import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { validateSettingPath } from "../../store/utils/validateSettingPath";
import { ConfigError } from "../../errors";
import { showValidPaths } from "../../store/utils/showValidPaths";
import { fullSettingPath, setSetting } from "../../store/utils/settingAccess";
import { normalizeSettingValue, validateSettingValue } from "../../store/utils/validateSettingValue";
import { maskValueAtPath } from "../../store/utils/maskSecrets";
import chalk from "chalk";

export class SetSettingsCommand implements CLICommand {
   constructor(
      private ctx: AppContext,
      private path: string,
      private value: string
   ) { }

   public async execute(): Promise<void> {
      const path = this.path;

      if (!validateSettingPath(path)) {
         throw new ConfigError(`Invalid Path ${path}`, showValidPaths)
      }

      const value = normalizeSettingValue(path, this.value);
      const error = validateSettingValue(path, value);

      if (error) {
         throw new ConfigError(error);
      }

      setSetting(this.ctx.store, path, value);
      console.log(chalk.green(`✅ Set ${path} = ${maskValueAtPath(fullSettingPath(path), value)}`));
   }
}
