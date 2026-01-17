import chalk from "chalk";
import { getJSONStore } from "../../../store/JSONStore";
import { validateSettingPath } from "../../../store/utils/validateSettingPath";
import { baseSettingsPath } from "../../../store/constants";

export async function getSettingsAction(path: string) {
   const store = getJSONStore()

   try {
      if (!validateSettingPath(path)) {
         process.exit(1);
      }

      const fullPath = `${baseSettingsPath}.${path}`;

      const value = await store.getPath(fullPath as any);
      console.log(value);
      process.exit(0);
   } catch (error) {
      console.error(chalk.red(`❌ Failed to get ${path}`), error);
      process.exit(1);
   }
}