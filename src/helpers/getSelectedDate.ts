export function getSelectedDate(weekStart: number, dayNum: number): Date {
  const selectedDate = new Date(weekStart)
  selectedDate.setDate(selectedDate.getDate() + dayNum)
  selectedDate.setHours(0, 0, 0, 0)
  return selectedDate
}