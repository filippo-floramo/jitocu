import type { AppContext } from "../../context";
import { ConfigError } from "../../errors";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";

/**
 * Every command needs the same guard: bail out with the list of unset paths
 * before touching Jira or ClickUp.
 */
export function assertConfigured(ctx: AppContext) {
   const missing = getMissingRequiredSettings(ctx.store);

   if (missing.length > 0) {
      throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
   }
}
