import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { validateSettingPath } from "../../store/utils/validateSettingPath";
import { ConfigError } from "../../errors";
import { showValidPaths } from "../../store/utils/showValidPaths";
import { maskValueAtPath } from "../../store/utils/maskSecrets";
import { fullSettingPath, getSetting } from "../../store/utils/settingAccess";

export class GetSettingsCommand implements CLICommand {
   constructor(
      private ctx: AppContext,
      private path: string,
      private reveal: boolean = false
   ) { }

   public async execute(): Promise<void> {
      const path = this.path;

      if (!validateSettingPath(path)) {
         throw new ConfigError(`Invalid Path ${path}`, showValidPaths)
      }
      const value = getSetting(this.ctx.store, path);
      console.log(this.reveal ? value : maskValueAtPath(fullSettingPath(path), value));
   }
}