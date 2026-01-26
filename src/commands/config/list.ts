import { CLICommand } from "../shared/command.interface";
import { getJSONStore } from "../../store/JSONStore";

export class ListSettingsCommand implements CLICommand {
   public async execute(): Promise<void> {
      const store = getJSONStore();

      const config = await store.getAll();
      console.log(config);
      return
   }
}