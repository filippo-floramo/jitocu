import type { AppContext } from "../../context";
import type { CLICommand } from "./command.interface";
import { handleError } from "../../errors/handleError";

export async function run(ctx: AppContext, make: (ctx: AppContext) => CLICommand): Promise<void> {
   try {
      const command = make(ctx);
      await command.execute();
      process.exit(0);
   } catch (error) {
      handleError(error);
   }
}
