import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { baseSettingsPath } from "../../store/constants";
import { validateSettingPath } from "../../store/utils/validateSettingPath";
import { ConfigError } from "../../errors";
import { showValidPaths } from "../../store/utils/showValidPaths";
import { maskValueAtPath } from "../../store/utils/maskSecrets";

export class GetSettingsCommand implements CLICommand {
   constructor(
      private ctx: AppContext,
      private path: string,
      private reveal: boolean = false
   ) { }

   public async execute(): Promise<void> {
      if (!validateSettingPath(this.path)) {
         throw new ConfigError(`Invalid Path ${this.path}`, showValidPaths)
      }
      const fullPath = `${baseSettingsPath}.${this.path}`;
      const value = this.ctx.store.get(fullPath as any);
      console.log(this.reveal ? value : maskValueAtPath(fullPath, value));
   }
}