import chalk from "chalk";
import { ClickUpTask } from "../../services/clickUp";

export function mapTask(task: { name: string, value: ClickUpTask }) {
   return {
      value: task.value,
      name: `${chalk.hex(task.value.status.color).bold(`[${task.value.status.status}]`)} - ${task.name}`
   }
}