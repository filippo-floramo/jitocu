type RangeType = {
   type: "range" | "duration"
   startMs: number
   endMs: number
   start: Date
   end: Date
   duration: number,
   stop: number
}

export function parseRanges(input: string, baseDate: Date): RangeType[] {
   const tokens = input.toLowerCase().trim().split(/\s+/);

   let { value, nextIndex } = parseRange(tokens, 0, baseDate);
   const ranges = [value];

   while (nextIndex < tokens.length) {
      if (tokens[nextIndex] !== "and") {
         throw new Error(`Expected 'AND' at ${nextIndex}`);
      }

      const result = parseRange(tokens, nextIndex + 1, baseDate);
      ranges.push(result.value);
      nextIndex = result.nextIndex;
   }

   return ranges;
}

function parseRange(tokens: string[], index: number, baseDate: Date) {
   if (tokens[index] !== "from") {
      throw new Error(`Expected 'from' at ${index}`);
   }

   const start = parseTimeEntry(tokens[index + 1], baseDate);

   const rangeType = tokens[index + 2];

   switch (rangeType) {
      case "to": {
         const end = parseTimeEntry(tokens[index + 3], baseDate);

         if (end.getTime() <= start.getTime()) {
            end.setDate(end.getDate() + 1);
         }

         const startMs = start.getTime()
         const endMs = end.getTime()
         return {
            value: {
               type: "range" as const,
               startMs,
               endMs,
               stop: endMs,
               duration: endMs - startMs,
               start,
               end
            },
            nextIndex: index + 4
         };
      }
      case "duration": {
         const durationStr = tokens[index + 3];
         let durationMs = 0;

         if (durationStr.includes('h') && durationStr.includes('m')) {
            const parts = durationStr.match(/(\d+)h(\d+)m/);
            if (!parts) {
               throw new Error(`Invalid duration format: ${durationStr}. Expected format: "3h20m"`);
            }
            const hours = Number(parts[1]);
            const minutes = Number(parts[2]);
            if (Number.isNaN(hours) || Number.isNaN(minutes)) {
               throw new Error(`Invalid duration values: ${durationStr}`);
            }
            durationMs = (hours * 60 * 60 * 1000) + (minutes * 60 * 1000);
         } else if (durationStr.endsWith('h') && !durationStr.includes('m')) {
            const hours = Number(durationStr.slice(0, -1)); // Remove 'h' suffix
            if (Number.isNaN(hours) || hours <= 0) {
               throw new Error(`Invalid duration hours: ${durationStr}`);
            }
            durationMs = hours * 60 * 60 * 1000;
         } else {
            throw new Error(`Invalid duration format: ${durationStr}. Expected format: "4h" or "3h20m"`);
         }
         const startMs = start.getTime()
         const endMs = startMs + durationMs
         return {
            value: {
               type: "duration" as const,
               startMs,
               start,
               end: new Date(endMs),
               endMs,
               stop: endMs,
               duration: durationMs
            },
            nextIndex: index + 4
         };
      }
      default:
         throw new Error(`Expected 'to' or 'duration' at ${index + 2}, got '${rangeType}'`);
   }
}

function parseTimeEntry(timeEntry: string, baseDate: Date): Date {
   let hour = 0;
   let minutes = 0;

   if (timeEntry.includes(":")) {
      const splitted = timeEntry.split(":")
      hour = Number(splitted[0])
      minutes = Number(splitted[1])
   } else {
      hour = Number(timeEntry)
   }

   if (Number.isNaN(hour) || Number.isNaN(minutes)) {
      throw new Error(`Invalid time entry: ${timeEntry}`);
   }

   const date = new Date(baseDate);
   date.setHours(hour, minutes, 0, 0);
   return date;
}
