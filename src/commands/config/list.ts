import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { maskSettings } from "../../store/utils/maskSecrets";

export class ListSettingsCommand implements CLICommand {
   constructor(
      private ctx: AppContext,
      private reveal: boolean = false
   ) { }

   public async execute(): Promise<void> {
      const config = this.ctx.store.store;
      console.log(this.reveal ? config : maskSettings(config));
      return
   }
}
