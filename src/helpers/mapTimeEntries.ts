import { ClickUpTimeEntry } from "../services/clickUp";
export interface MappedTaskForEntry {
   id: string,
   name: string,
   task_url: string
   cells: Record<string, number>
}

export function mapTimeEntries(entries: ClickUpTimeEntry[]): MappedTaskForEntry[] {
   const teMap = new Map()
   for (const entry of entries) {
      const { task, task_url, start, duration } = entry

      if (!task || !task.id) continue

      const { dayName, hours } = getDateInfo(Number(start), Number(duration))

      const inserted = teMap.get(task.id)
      if (!inserted) {
         teMap.set(task.id, {
            id: task.id,
            name: task.name,
            task_url,
            cells: { [dayName]: hours }
         })
      } else {
         const insertedDayHours = inserted.cells[dayName] || 0
         teMap.set(task.id, {
            ...inserted,
            cells: { ...inserted.cells, [dayName]: insertedDayHours + hours }
         })
      }
   }
   return Array.from(teMap.values())
}
function getDateInfo(start: number, duration: number) {
   const dayName = new Date(start).toLocaleDateString('en-US', { weekday: 'short' })
   const hours = Math.round((duration / 1000 / 3600) * 10) / 10 // Round to 1 decimal
   return { dayName, hours }
}