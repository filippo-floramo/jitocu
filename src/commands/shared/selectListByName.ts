import { select } from "@inquirer/prompts";
import type { AppContext } from "../../context";
import { CLIError } from "../../errors";
import { fuzzySearch } from "../../helpers/fuzzySearch";
import { withSpinner } from "../../helpers/withSpinner";

const LISTS_SPINNER = {
   text: "Fetching ClickUp folders...",
   successText: "ClickUp folders loaded",
   failText: "Failed to fetch ClickUp folders"
}

/** Fuzzy-match `--list` against every shared list and return the picked list id. */
export async function selectListByName(ctx: AppContext, listName: string): Promise<string> {
   const lists = await withSpinner(
      async () => await ctx.clickUp.getSharedLists(),
      LISTS_SPINNER
   );

   const matches = fuzzySearch(lists, listName, { selector: (list) => list.name });

   if (matches.length === 0) {
      throw new CLIError(
         `No ClickUp list matches "${listName}". Run the command without --list to browse the folder tree.`
      );
   }

   return await select({
      message: "Found these lists",
      choices: matches.map((list) => ({ name: list.name, value: list.id }))
   });
}
