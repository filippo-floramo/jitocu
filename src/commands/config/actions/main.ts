import chalk from "chalk";
import { getMissingRequiredSettings } from "../../../store/utils/getMissingRequiredSettings";
import { baseSettingsPath, settingPathsMap } from "../../../store/constants";
import { confirm, input, password } from "@inquirer/prompts";
import JsonStore, { getJSONStore } from "../../../store/JSONStore";
import { showMissingSettignsPaths } from "../../../store/utils/showMissingSettingsPaths";

export async function mainConfigAction() {
   const store = getJSONStore()

   const missing = await getMissingRequiredSettings();
   if (missing.length > 0) {
      showMissingSettignsPaths(missing)

      const isInteractive = await confirm({ message: "Would you like to interactvely set the config?" });

      if (isInteractive) {

         for (const missingPath of missing) {
            let answer;
            switch (missingPath) {
               case "clickUp.apiToken":
               case "jira.apiToken":
                  answer = await password({
                     message: `Please enter ${settingPathsMap[missingPath]}:`,
                     validate: (val) => val.length > 0 ? true : "You must enter a value!"
                  });
                  break;
               default:
                  answer = await input({
                     message: `Please enter ${settingPathsMap[missingPath]}:`,
                     validate: (val) => val.length > 0 ? true : "You must enter a value!"
                  });
                  break;
            }


            await store.updatePath(`${baseSettingsPath}.${missingPath}`, answer)
         }

         console.log(chalk.green("✅ All missing settings are configured!"));
      }


   } else {
      console.log(chalk.green("✅ All settings are configured!"));
   }

   process.exit(0);
}