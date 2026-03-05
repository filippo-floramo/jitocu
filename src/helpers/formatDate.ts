interface FormatConfig {
   weekday?: boolean;
   month?: boolean;
   day?: boolean;
   hour?: boolean;
   minute?: boolean;
}

export function formatDate(date: Date, config: FormatConfig = {}): string {
   const options: Intl.DateTimeFormatOptions = {
      hourCycle: "h24",
      ...(config.weekday ? { weekday: "long" } : {}),
      ...(config.month ? { month: "short" } : {}),
      ...(config.day ? { day: "numeric" } : {}),
      ...(config.hour ? { hour: "numeric" } : {}),
      ...(config.minute ? { minute: "numeric" } : {}),
   };

   return date.toLocaleDateString("en-US", options);
}

