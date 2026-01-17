import chalk from "chalk";
import JsonStore, { getJSONStore } from "../../../store/JSONStore";
import { validateSettingPath } from "../../../store/utils/validateSettingPath";
import { baseSettingsPath } from "../../../store/constants";


export async function setSettingsAction(path: string, value: string) {
   const store = getJSONStore()

   try {
      if (!validateSettingPath(path)) {
         process.exit(1);
      }
      const fullPath = `${baseSettingsPath}.${path}`;

      await store.updatePath(fullPath as any, value);
      console.log(chalk.green(`✅ Set ${path} = ${value}`));
      process.exit(0);
   } catch (error) {
      console.error(chalk.red(`❌ Failed to set ${path}:`), error);
      process.exit(1);
   }
}