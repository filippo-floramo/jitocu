import { confirm, select } from "@inquirer/prompts";
import type { AppContext } from "../../context";
import { getSelectedDate, getWeeksRange, withSpinner } from "../../helpers";
import { datePrompt } from "../../prompts/datePicker";
import timesheetTable from "../../prompts/timesheetTable";
import { assertConfigured } from "../shared/assertConfigured";
import { CLICommand } from "../shared/command.interface";
import { selectListFromTree, selectTaskFromList, submitTimeEntries } from "./timeEntryFlow";

export class DefaultTimeCommand implements CLICommand {
   constructor(
      private ctx: AppContext
   ) { }

   private async getTimeEntryFromTask() {
      const listId = await selectListFromTree(this.ctx)
      const selectedTask = await selectTaskFromList(this.ctx, listId)
      const targetDate = await datePrompt({
         message: "Select a Date",
         format: "date"
      })

      return { targetDate, selectedTask }
   }

   private async getTimeSheetAnswer() {
      const clickUpSrv = this.ctx.clickUp
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
      assertConfigured(this.ctx);

      while (true) {
         const { timesheetAnswer, selectedRange } = await this.getTimeSheetAnswer()

         if (timesheetAnswer.type === "action") {
            if (timesheetAnswer.action === "close") {
               console.log("Operation Cancelled.")
               return
            }

            const { targetDate, selectedTask } = await this.getTimeEntryFromTask()
            await submitTimeEntries(this.ctx, {
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
         await submitTimeEntries(this.ctx, {
            selectedTask: timesheetAnswer.selection.task,
            targetDate: selectedDate
         })
         return
      }
   }
}
