interface WeekRangeChoice {
  name: string;
  value: { start: number, end: number }
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
    name: `${formatDate(sunday)} - ${formatDate(saturday)}`,
    value: { start: sunday.getTime(), end: saturday.getTime() }
  })

  for (let i = 0; i < 4; i++) {
    sunday.setDate(sunday.getDate() - 7)
    saturday.setDate(saturday.getDate() - 7)
    ranges.push({
      name: `${formatDate(sunday)} - ${formatDate(saturday)}`,
      value: { start: sunday.getTime(), end: saturday.getTime() }
    })

  }

  return ranges;
}
