import { select, input } from "@inquirer/prompts";
import { ConfigError } from "../../errors";
import { ClickUpService } from "../../services/clickUp";
import { getMissingRequiredSettings } from "../../store/utils/getMissingRequiredSettings";
import { showMissingSettignsPaths } from "../../store/utils/showMissingSettingsPaths";
import { getWeeksRange, withSpinner, parseRanges, getSelectedDate } from "../../helpers";
import { CLICommand } from "../shared/command.interface";
import spreadsheetTable from "../../prompts/timesheetTable";
import chalk from "chalk";
import { formatDate } from "../../helpers/formatDate";

export class DefaultTimeCommand implements CLICommand {

   async execute() {
      const missing = await getMissingRequiredSettings();

      if (missing.length > 0) {
         throw new ConfigError("Missing configuration:", () => showMissingSettignsPaths(missing))
      }

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
      const selectedCell = await spreadsheetTable({
         message: "Weekly time report",
         rows: timeEntries,
      })

      // If user pressed Q/Esc, return the full data
      if (Array.isArray(selectedCell)) {
         console.log("Operation cancelled.")
         return
      }

      const selectedDate = getSelectedDate(selectedRange.start, selectedCell.day)

      const dslInput = await input({
         message: `Enter time for ${selectedCell.task.label} on ${selectedCell.dayName}:`,
         validate: (input) => {
            if (!input.trim()) return "Time entry cannot be empty"
            try {
               parseRanges(input, selectedDate)
               return true
            } catch (error) {
               return `Invalid time format. Use: "from 9am to 5pm" or "from 9am duration 4h"`
            }
         }
      })
      const result = parseRanges(dslInput, selectedDate)
      for (const entry of result) {
         const timeEntryPayload = {
            tid: selectedCell.task.id,
            start: entry.startMs,
            duration: entry.duration,
            end: entry.endMs,
            stop: entry.stop
         }

         await withSpinner(
            async () => await clickUpSrv.createTimeEntry(timeEntryPayload),
            { text: `Creating time entry for ${selectedCell.task.label} \n Range: from ${chalk.hex('#299549b8').bold(formatDate(entry.start, { hour: true, minute: true }))} to ${chalk.hex('#299549b8').bold(formatDate(entry.end, { hour: true, minute: true }))}` }
         )
      }

      console.log(`✅ Created ${result.length} time entr${(result.length > 1 ? 'ies' : 'y')} for ${selectedCell.task.label} \n On ${chalk.hex('#299549b8').bold(formatDate(selectedDate, { weekday: true, day: true, month: true }))}`)
   }
}