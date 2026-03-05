import chalk from "chalk";

interface WeekRangeChoice {
  name: string;
  value: { start: number, end: number }
}

function formatRangeDate(date: Date): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate().toString();
  return `${month} ${day.padStart(2, ' ')}`;
}

export function getWeeksRange(): WeekRangeChoice[] {
  const ranges: WeekRangeChoice[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const sunday = new Date(today)
  const saturday = new Date(today)

  const daysFromSunday = today.getDay()
  const daysToSaturday = 6 - today.getDay()

  sunday.setDate(today.getDate() - daysFromSunday)
  saturday.setDate(today.getDate() + daysToSaturday)

  ranges.push({
    name: `${formatRangeDate(sunday)} - ${formatRangeDate(saturday)} ${chalk.dim("<- Current")}`,
    value: { start: sunday.getTime(), end: saturday.getTime() }
  })

  for (let i = 0; i < 4; i++) {
    sunday.setDate(sunday.getDate() - 7)
    saturday.setDate(saturday.getDate() - 7)
    ranges.push({
      name: `${formatRangeDate(sunday)} - ${formatRangeDate(saturday)}`,
      value: { start: sunday.getTime(), end: saturday.getTime() }
    })

  }

  return ranges;
}
