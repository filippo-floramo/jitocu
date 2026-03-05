import { CLICommand } from "../shared/command.interface";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import { input, search, select } from "@inquirer/prompts";
import { ClickUpFolder, ClickUpService, ClickUpTask } from "../../services/clickUp";
import { withSpinner } from "../../helpers/withSpinner";
import { ConfigError } from "../../errors";
import { datePrompt } from "../../prompts/datePicker";
import { parseRanges } from "../../helpers";
import { truncate } from "../../helpers/truncate";
import { formatDate } from "../../helpers/formatDate";
import { treeSelect, SelectedList } from "../../prompts/treeSelect";
import * as fuzzy from "fuzzy"
import chalk from "chalk";


interface CreateTicketOptions {
   list: string;
}

export class AddTimeEntryCommand implements CLICommand {
   private options: CreateTicketOptions;

   constructor(opts: CreateTicketOptions) {
      this.options = opts
   }

   mapTask(task: { name: string, value: ClickUpTask }) {
      return {
         value: task.value,
         name: `${chalk.hex(task.value.status.color).bold(`[${task.value.status.status}]`)} - ${task.name}`
      }
   }


   public async execute() {
      const missing = await getMissingRequiredSettings();

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

      const clickUpSrv = await ClickUpService.getInstance();
      let listId = ''

      if (this.options.list) {
         const lists = await withSpinner(
            async () => await clickUpSrv.getListByName(this.options.list),
            {
               text: "Fetching ClickUp folders...",
               successText: "ClickUp folders loaded",
               failText: "Failed to fetch ClickUp folders"
            }
         );
         const selectedList = await select({ message: "Found these lists", choices: lists });
         listId = selectedList
      } else {
         const folders: ClickUpFolder[] = await withSpinner(
            async () => await clickUpSrv.getMySharedFolders(),
            {
               text: "Fetching ClickUp folders...",
               successText: "ClickUp folders loaded",
               failText: "Failed to fetch ClickUp folders"
            }
         )

         const selectedList: SelectedList = await treeSelect({
            message: "Select a ClickUp list:",
            folders: folders,
            pageSize: 14,
         });

         listId = selectedList.listId
      }

      const tasks: ClickUpTask[] = await withSpinner(
         async () => await clickUpSrv.getTasksByListId(listId),
         {
            text: "Fetching tasks...",
            successText: "Tasks loaded",
            failText: "Failed to fetch tasks"
         }
      )

      const taskChoices = tasks.map((task) => ({ name: (task.name), value: task }))

      const selectedTask = await search({
         message: "Select ClickUp task",
         pageSize: 20,
         source: async (input) => {
            input = input || "";
            const fuzzySearch = fuzzy.filter(input, taskChoices, {
               extract: (item) => item.name
            });
            return fuzzySearch.map((el) => this.mapTask(el.original));
         },
         theme: {
            style: {
               highlight: chalk.rgb(0, 136, 255)
            }
         }
      });
      const targetDate = await datePrompt({
         message: "Select a Date",
         format: "date"
      })
      const dslInput = await input({
         message: `Enter time for ${truncate(selectedTask.name, 30)} on ${formatDate(targetDate, { weekday: true, day: true, month: true })}:`,
         validate: (input) => {
            if (!input.trim()) return "Time entry cannot be empty"
            try {
               parseRanges(input, targetDate)
               return true
            } catch (error) {
               return `Invalid time format. Use: "from 9am to 5pm" or "from 9am duration 4h"`
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
            { text: `Creating time entry for ${selectedTask.name} \n Range: from ${chalk.hex('#299549b8').bold(formatDate(entry.start, { hour: true, minute: true }))} to ${chalk.hex('#299549b8').bold(formatDate(entry.end, { hour: true, minute: true }))}` }
         )
      }

      console.log(`✅ Created ${result.length} time entr${(result.length > 1 ? 'ies' : 'y')} for ${selectedTask.name} \n On ${chalk.hex('#299549b8').bold(formatDate(targetDate, { weekday: true, day: true, month: true }))}`)
   }
}