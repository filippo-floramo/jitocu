import { input, search } from "@inquirer/prompts";
import chalk from "chalk";
import type { AppContext } from "../../context";
import { CLIError } from "../../errors";
import { createFuzzySearcher, parseRanges, withSpinner } from "../../helpers";
import { formatDate } from "../../helpers/formatDate";
import { truncate } from "../../helpers/truncate";
import { SelectedList, treeSelect } from "../../prompts/treeSelect";
import { ClickUpFolder, ClickUpTask } from "../../services/clickUp";
import { mapTask } from "./utils";

const FOLDERS_SPINNER = {
   text: "Fetching ClickUp folders...",
   successText: "ClickUp folders loaded",
   failText: "Failed to fetch ClickUp folders"
}

const TASKS_SPINNER = {
   text: "Fetching tasks...",
   successText: "Tasks loaded",
   failText: "Failed to fetch tasks"
}

const HIGHLIGHT = chalk.hex('#299549b8')

/** Browse the shared folder tree and return the id of the picked list. */
export async function selectListFromTree(ctx: AppContext): Promise<string> {
   const folders: ClickUpFolder[] = await withSpinner(
      async () => await ctx.clickUp.getMySharedFolders(),
      FOLDERS_SPINNER
   )

   const selectedList: SelectedList = await treeSelect({
      message: "Select a ClickUp list:",
      folders: folders,
      pageSize: 14,
   });

   return selectedList.listId
}

/** Fuzzy-search the tasks of a list and return the picked one. */
export async function selectTaskFromList(ctx: AppContext, listId: string): Promise<ClickUpTask> {
   const tasks: ClickUpTask[] = await withSpinner(
      async () => await ctx.clickUp.getTasksByListId(listId),
      TASKS_SPINNER
   )

   if (tasks.length === 0) {
      throw new CLIError("No tasks found.")
   }

   const taskChoices = tasks.map((task) => ({ name: (task.name), value: task }))

   const searchTasks = createFuzzySearcher(taskChoices, {
      selector: (choice) => choice.name
   });

   return await search({
      message: "Select ClickUp task",
      pageSize: 20,
      source: async (input) => searchTasks(input ?? "").map(mapTask),
      theme: {
         style: {
            highlight: chalk.rgb(0, 136, 255)
         }
      }
   });
}

/**
 * Ask for the time DSL, then create one ClickUp time entry per parsed range.
 */
export async function submitTimeEntries(ctx: AppContext, { selectedTask, targetDate }: {
   selectedTask: Pick<ClickUpTask, "id" | "name">,
   targetDate: Date
}) {
   const clickUpSrv = ctx.clickUp

   const dslInput = await input({
      message: `Enter time for ${truncate(selectedTask.name, 30)} on ${formatDate(targetDate, { weekday: true, day: true, month: true })}:`,
      validate: (input) => {
         if (!input.trim()) return "Time entry cannot be empty"
         try {
            parseRanges(input, targetDate)
            return true
         } catch {
            return `Invalid time format. Use: "from 9:00 to 17:00" or "from 9:00 duration 4h"`
         }
      }
   })

   const result = parseRanges(dslInput, targetDate)

   for (const entry of result) {
      const timeEntryPayload = {
         tid: selectedTask.id,
         start: entry.startMs,
         duration: entry.duration,
         end: entry.endMs,
         stop: entry.stop
      }

      await withSpinner(
         async () => await clickUpSrv.createTimeEntry(timeEntryPayload),
         { text: `Creating time entry for ${selectedTask.name} \n Range: from ${HIGHLIGHT.bold(formatDate(entry.start, { hour: true, minute: true }))} to ${HIGHLIGHT.bold(formatDate(entry.end, { hour: true, minute: true }))}` }
      )
   }

   console.log(`✅ Created ${result.length} time entr${(result.length > 1 ? 'ies' : 'y')} for ${selectedTask.name} \n On ${HIGHLIGHT.bold(formatDate(targetDate, { weekday: true, day: true, month: true }))}`)
}
