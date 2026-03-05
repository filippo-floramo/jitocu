import {
   createPrompt,
   useState,
   useKeypress,
   usePrefix,
   isEnterKey,
   isUpKey,
   isDownKey,
   type KeypressEvent,
} from "@inquirer/core";
import chalk from "chalk";

// ─── Types ────────────────────────────────────────────────────────────────────

type DateField = "year" | "month" | "day" | "hour" | "minute";
type Format = "date" | "datetime";
type Status = "active" | "done";

interface FieldValues {
   year: number;
   month: number;
   day: number;
   hour: number;
   minute: number;
}

interface FieldRange {
   min: number;
   max: number;
}

export interface DatePromptConfig {
   /** Label displayed before the picker */
   message: string;
   /**
    * "date"     → year / month / day  (default)
    * "datetime" → year / month / day / hour / minute
    */
   format?: Format;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DATE_FIELDS: readonly DateField[] = ["day", "month", "year"] as const;
const DATETIME_FIELDS: readonly DateField[] = [
   "year",
   "month",
   "day",
   "hour",
   "minute",
] as const;

const FIELD_RANGES: Record<DateField, FieldRange> = {
   year: { min: 1900, max: 2100 },
   month: { min: 1, max: 12 },
   day: { min: 1, max: 31 }, // tightened dynamically per month/year
   hour: { min: 0, max: 23 },
   minute: { min: 0, max: 59 },
};

const FIELD_LABELS: Record<DateField, string> = {
   year: "Year",
   month: "Month",
   day: "Day",
   hour: "Hour",
   minute: "Minute",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (value: number, length = 2): string =>
   String(value).padStart(length, "0");

/** Returns the number of days in a given month (month is 1-based). */
const getDaysInMonth = (year: number, month: number): number =>
   new Date(year, month, 0).getDate();

/** Wraps a value around [min, max] instead of clamping. */
const wrap = (value: number, min: number, max: number): number => {
   if (value > max) return min;
   if (value < min) return max;
   return value;
};

/** Renders all fields, highlighting the active one. */
function renderFields(
   values: FieldValues,
   fields: readonly DateField[],
   activeIdx: number
): string {
   return fields
      .map((field, i) => {
         const len = field === "year" ? 4 : 2;
         const text = `${FIELD_LABELS[field]}: ${pad(values[field], len)}`;
         return i === activeIdx
            ? chalk.cyan.bold(`[${text}]`)
            : chalk.dim(` ${text} `);
      })
      .join(chalk.gray(" │ "));
}

/** Formats the confirmed value for the "done" line. */
function formatResult(values: FieldValues, format: Format): string {
   const { year, month, day, hour, minute } = values;
   const base = `${pad(day)}-${pad(month)}-${year}`;
   return format === "datetime" ? `${base} ${pad(hour)}:${pad(minute)}` : base;
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

/**
 * An interactive date (or date-time) picker built on @inquirer/core.
 *
 * @example
 * ```ts
 * import { datePrompt } from "./date-prompt";
 *
 * const date = await datePrompt({ message: "Pick a date:" });
 * const dateTime = await datePrompt({ message: "Pick a date & time:", format: "datetime" });
 * ```
 */
export const datePrompt = createPrompt<Date, DatePromptConfig>(
   (config, done) => {
      const format: Format = config.format ?? "date";
      const fields = format === "datetime" ? DATETIME_FIELDS : DATE_FIELDS;

      const now = new Date();
      const [values, setValues] = useState<FieldValues>({
         year: now.getFullYear(),
         month: now.getMonth() + 1,
         day: now.getDate(),
         hour: now.getHours(),
         minute: now.getMinutes(),
      });
      const [activeIdx, setActiveIdx] = useState<number>(0);
      const [status, setStatus] = useState<Status>("active");

      const prefix = usePrefix({});

      useKeypress((key: KeypressEvent) => {
         if (status !== "active") return;

         // ── Confirm ────────────────────────────────────────────────────────────
         if (isEnterKey(key)) {
            setStatus("done");
            const { year, month, day, hour, minute } = values;
            const date =
               format === "datetime"
                  ? new Date(year, month - 1, day, hour, minute, 0, 0)
                  : new Date(year, month - 1, day, 0, 0, 0, 0);
            done(date);
            return;
         }

         // ── Navigate fields (← / →) ────────────────────────────────────────────
         if (key.name === "left") {
            setActiveIdx((activeIdx - 1 + fields.length) % fields.length);
            return;
         }
         if (key.name === "right") {
            setActiveIdx((activeIdx + 1) % fields.length);
            return;
         }

         // ── Direct number input for month and day ─────────────────────────────
         if (key.name && key.name.length === 1 && !key.ctrl) {
            const field = fields[activeIdx];
            const num = parseInt(key.name);

            if (!isNaN(num) && (field === "month" || field === "day")) {
               if (num === 0) return;

               const currentValues = values;
               const currentValue = currentValues[field];
               const range: FieldRange = { ...FIELD_RANGES[field] };

               // Tighten the day ceiling based on the current month/year
               if (field === "day") {
                  range.max = getDaysInMonth(currentValues.year, currentValues.month);
               }

               // If current value is at max or 0, start new number, otherwise append
               let newValue: number;
               if (currentValue >= range.max || currentValue === 0) {
                  newValue = num;
               } else {
                  const appendedValue = currentValue * 10 + num;
                  newValue = appendedValue <= range.max ? appendedValue : num;
               }

               const next: FieldValues = {
                  ...currentValues,
                  [field]: newValue,
               };

               setValues(next);

               // Auto-advance to next field if we've entered a complete value
               if (field === "month" && (newValue >= 10 || (newValue >= 1 && num !== undefined))) {
                  setActiveIdx((activeIdx + 1) % fields.length);
               } else if (field === "day" && (newValue >= 10 || (newValue >= 3 && num !== undefined))) {
                  setActiveIdx((activeIdx + 1) % fields.length);
               }
            }
            return;
         }

         // ── Change value (↑ / ↓) ───────────────────────────────────────────────
         if (isUpKey(key) || isDownKey(key)) {
            const field = fields[activeIdx];
            const delta = isUpKey(key) ? 1 : -1;

            const currentValues = values;
            const range: FieldRange = { ...FIELD_RANGES[field] };

            // Tighten the day ceiling based on the current month/year
            if (field === "day") {
               range.max = getDaysInMonth(currentValues.year, currentValues.month);
            }

            const next: FieldValues = {
               ...currentValues,
               [field]: wrap(currentValues[field] + delta, range.min, range.max),
            };

            // If month/year changed, clamp day to the new month's ceiling
            const maxDay = getDaysInMonth(next.year, next.month);
            if (next.day > maxDay) next.day = maxDay;

            setValues(next);
         }
      });

      // ── Render ─────────────────────────────────────────────────────────────────
      if (status === "done") {
         return `${prefix} ${chalk.bold(config.message)} ${chalk.green(
            formatResult(values, format)
         )}`;
      }

      const hint = chalk.gray("  ←/→ switch field   ↑/↓ change value   Enter confirm");
      const hideCursor = '\x1B[?25l';
      return [
         `${hideCursor}${prefix} ${chalk.bold(config.message)}`,
         `  ${renderFields(values, fields, activeIdx)}`,
         hint,
      ].join("\n");
      
   }
)