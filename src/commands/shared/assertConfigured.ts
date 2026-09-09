import type { AppContext } from "../../context";
import { ConfigError } from "../../errors";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import type { MandatorySettingsPath } from "../../store/types";

/**
 * Guard for the settings a single command needs: bail out with the list of
 * unset paths before touching Jira or ClickUp. A command that never calls Jira
 * must not ask for Jira credentials.
 */
export function assertConfigured(ctx: AppContext, paths: MandatorySettingsPath[]) {
   const missing = getMissingRequiredSettings(ctx.store, paths);

   if (missing.length > 0) {
      throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
   }
}
