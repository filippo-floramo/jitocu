import chalk from "chalk";
import { settingPathsMap } from "../constants";


export function showValidPaths() {
   console.log(chalk.dim("Valid paths:"));
   Object.keys(settingPathsMap).forEach(validPath => {
      console.log(chalk.dim(`   - ${validPath}`));
   });
}