import chalk from "chalk";
import JsonStore, { getJSONStore } from "../../../store/JSONStore";
import { confirm } from "@inquirer/prompts";


export async function clearAllAction() {
   const store = getJSONStore();

   const isSure = await confirm({
      message: chalk.red("[WARNING] This command will clear all data are you sure to continue?")
   })

   if (isSure) {
      await store.clear()
      process.exit(0)
   }

   process.exit(0)
}