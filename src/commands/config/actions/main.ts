import chalk from "chalk";
import { getMissingRequiredSettings } from "../../../store/utils/getMissingRequiredSettings";
import { baseSettingsPath, settingPathsMap } from "../../../store/constants";
import { confirm, input } from "@inquirer/prompts";
import JsonStore from "../../../store/JSONStore";
import { showMissingSettignsPaths } from "../../../store/utils/showMissingSettingsPaths";

export async function mainConfigAction() {
   const store = JsonStore.getInstance();

   const missing = await getMissingRequiredSettings();
   if (missing.length > 0) {
      showMissingSettignsPaths(missing)

      const isInteractive = await confirm({ message: "Would you like to interactvely set the config?" });

      if (isInteractive) {
         for (const missingPath of missing) {
            const ans = await input({
               message: `Please enter ${settingPathsMap[missingPath]}:`,
               validate: (val) => val.length > 0 ? true : "You must enter a value!"
            })
            await store.updatePath(`${baseSettingsPath}.${missingPath}`, ans)
         }

         console.log(chalk.green("✅ All missing settings are configured!"));
      }


   } else {
      console.log(chalk.green("✅ All settings are configured!"));
   }

   process.exit(0);
}