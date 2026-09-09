import { CLICommand } from "../shared/command.interface";
import type { AppContext } from "../../context";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import { baseSettingsPath, settingPathsMap, settingsFeatures, type SettingsFeature } from "../../store/constants";
import { checkbox, confirm, input, password } from "@inquirer/prompts";
import chalk from "chalk";
import type { MandatorySettingsPath } from "../../store/types";

export class DefaultConfigCommand implements CLICommand {
   constructor(
      private ctx: AppContext
   ) { }

   public async execute(): Promise<void> {
      const store = this.ctx.store;

      const incomplete: { feature: SettingsFeature, missing: MandatorySettingsPath[] }[] = [];

      console.log(chalk.blue("Configuration status:"));
      for (const feature of settingsFeatures) {
         const missing = getMissingRequiredSettings(store, feature.paths);

         if (missing.length === 0) {
            console.log(`   ${chalk.green("✅")} ${feature.label}: ready`);
            continue;
         }
         incomplete.push({ feature, missing });
         console.log(
            `   ${chalk.yellow("○")} ${feature.label}: not configured` +
            chalk.dim(` - needed for ${feature.neededFor}`)
         );
      }
      console.log();

      if (incomplete.length === 0) {
         console.log(chalk.green("✅ All settings are configured!"));
         return
      }

      showMissingSettignsPaths(incomplete.flatMap(entry => entry.missing));

      const isInteractive = await confirm({ message: "Would you like to interactvely set the config?" });
      if (!isInteractive) {
         return
      }

      // A user who only wants the timesheet should not be walked through Jira,
      // so setup is opt-in per feature rather than one list of every path.
      const selected = incomplete.length === 1
         ? incomplete
         : (await checkbox({
            message: "Which features would you like to set up?",
            choices: incomplete.map(entry => ({
               name: `${entry.feature.label} (${entry.feature.neededFor})`,
               value: entry,
               checked: true
            }))
         }));

      for (const { missing } of selected) {
         for (const missingPath of missing) {
            let answer: string;
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
            store.set(`${baseSettingsPath}.${missingPath}`, answer);
         }
      }
      console.log(chalk.green("✅ All selected settings are configured!"));

      return
   }
}
