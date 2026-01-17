import chalk from "chalk";
import { settingPathsMap } from "../constants";
import { MandatorySettingsPath } from "../types";

export function showMissingSettignsPaths(missing: MandatorySettingsPath[]) {
   console.log(chalk.red("❌ Missing configuration:"));
   missing.forEach(path =>
      console.log(`   - ${settingPathsMap[path]}` + chalk.dim(` path: ${path}`))
   );
   console.log();
   console.log(chalk.blue("Set these values with:"));
   console.log("   jitocu config set <path> <value>");
   console.log();
   console.log(chalk.blue("Example:"));
   console.log("   jitocu config set jira.domain 'example.atlassian.net'", "\n");
} 