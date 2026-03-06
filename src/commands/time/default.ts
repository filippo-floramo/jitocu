import { select, input, search, confirm } from "@inquirer/prompts";
import { ConfigError } from "../../errors";
import { ClickUpFolder, ClickUpService, ClickUpTask } from "../../services/clickUp";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import { getWeeksRange, withSpinner, parseRanges, getSelectedDate } from "../../helpers";
import { CLICommand } from "../shared/command.interface";
import { formatDate } from "../../helpers/formatDate";
import { SelectedList, treeSelect } from "../../prompts/treeSelect";
import { mapTask } from "./utils";
import { datePrompt } from "../../prompts/datePicker";
import timesheetTable from "../../prompts/timesheetTable";
import chalk from "chalk";
import fuzzy from "fuzzy";

export class DefaultTimeCommand implements CLICommand {

   private async parseAndSubmit({ selectedTask, targetDate }: {
      selectedTask: Pick<ClickUpTask, "id" | "name">,
      targetDate: Date
   }) {

      const clickUpSrv = await ClickUpService.getInstance()
      const dslInput = await input({
         message: `Enter time for ${selectedTask.name} on ${formatDate(targetDate, { weekday: true, day: true, month: true })}:`,
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

   private async getTimeEntryFromTask() {
      const clickUpSrv = await ClickUpService.getInstance()
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

      const tasks: ClickUpTask[] = await withSpinner(
         async () => await clickUpSrv.getTasksByListId(selectedList.listId),
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
            return fuzzySearch.map((el) => mapTask(el.original));
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
      return { targetDate, selectedTask }
   }

   private async getTimeSheetAnswer() {
      const clickUpSrv = await ClickUpService.getInstance()
      const range = getWeeksRange()

      const selectedRange = await select({
         message: 'Select a week range',
         choices: range
      })
      const timeEntries = await withSpinner(
         () => clickUpSrv.getTimeEntries(selectedRange),
         {
            text: "Fetching Time entries...",
            successText: "Time entries fetched",
         }
      )

      // Get selected cell from timesheet table
      const timesheetAnswer = await timesheetTable({
         message: "Weekly time report",
         rows: timeEntries,
      })
      return { timesheetAnswer, selectedRange }
   }

   async execute() {
      const missing = await getMissingRequiredSettings();

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

      while (true) {
         const { timesheetAnswer, selectedRange } = await this.getTimeSheetAnswer()

         if (timesheetAnswer.type === "action") {
            if (timesheetAnswer.action === "close") {
               console.log("Operation Cancelled.")
               return
            }

            const { targetDate, selectedTask } = await this.getTimeEntryFromTask()
            await this.parseAndSubmit({
               targetDate,
               selectedTask
            })

            const repeat = await confirm({
               message: "Do you want to repeat?"
            })

            if (repeat) {
               continue
            }

            console.log("have a nice day!")
            return
         }

         const selectedDate = getSelectedDate(selectedRange.start, timesheetAnswer.selection.day)
         await this.parseAndSubmit({
            selectedTask: timesheetAnswer.selection.task,
            targetDate: selectedDate
         })
         return
      }
   }
}