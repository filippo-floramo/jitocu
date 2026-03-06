/**
 * Spreadsheet-like Table Prompt
 * Navigate cells on X/Y axis
 */

import { createPrompt, useState, useKeypress, isEnterKey, usePrefix, makeTheme } from '@inquirer/core';
import chalk from 'chalk';
import { DAYS_MAP } from '../helpers';
import { MappedTaskForEntry } from '../helpers/mapTimeEntries';
import { truncate } from '../helpers/truncate';
import { Status } from '@inquirer/core';
interface TimeSheetConfig {
  message: string;
  rows: MappedTaskForEntry[];
}

export interface CellSelection {
  task: MappedTaskForEntry;
  day: number;
  dayName: string;
}
type ExitAction = 'close' | 'add'

export type TimeSheetResult =
  | { type: 'action'; action: ExitAction }
  | { type: 'cell'; selection: CellSelection };



const spreadsheetTable = createPrompt<TimeSheetResult, TimeSheetConfig>((config, done) => {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);
  const [status, setStatus] = useState<{ type: Status, doneMessage: string }>({
    type: 'idle',
    doneMessage: ''
  })
  const theme = makeTheme({
    prefix: {
      idle: "🗒️",
      done: "✔︎︎"
    }
  })
  const prefix = usePrefix({ status: status.type, theme })

  // ANSI escape code to hide cursor
  const hideCursor = '\x1B[?25l';
  const DAYS = Object.keys(DAYS_MAP)
  const selectedDay = DAYS[selectedCol];
  const selectedRowData = config.rows[selectedRow];

  useKeypress((key) => {
    // Table navigation
    switch (key.name) {
      case 'up':
      case 'k':
        setSelectedRow(Math.max(0, selectedRow - 1));
        break;
      case 'down':
      case 'j':
        setSelectedRow(Math.min(config.rows.length - 1, selectedRow + 1));
        break;
      case 'left':
      case 'h':
        setSelectedCol(Math.max(0, selectedCol - 1));
        break;
      case 'right':
      case 'l':
        setSelectedCol(Math.min(DAYS.length - 1, selectedCol + 1));
        break;
      case 'q':
      case 'escape':
        setStatus({
          type: "done",
          doneMessage: 'Exited with no further actions.'
        })
        done({ type: 'action', action: 'close' });
        break;
      case 'a':
        setStatus({
          type: 'done',
          doneMessage: 'Add new time entry from task requested'
        })
        done({ type: 'action', action: 'add' })
        break;
      default:
        if (isEnterKey(key) && config.rows.length > 0) {
          // Return selected cell data
          const cellData = {
            task: selectedRowData,
            day: DAYS_MAP[selectedDay as keyof typeof DAYS_MAP],
            dayName: selectedDay
          };
          setStatus({
            type: 'done',
            doneMessage: `Selected Task:  ${selectedRowData.name}`
          })
          done({ type: 'cell', selection: cellData });
        }
        break;
    }
  });

  if (status.type === 'done') {
    return `${prefix} ${status.doneMessage}`
  }

  let output = `${hideCursor} ${prefix}  ${chalk.bold(config.message)}\n\n`;

  // Calculate column widths
  const MAX_LABEL_WIDTH = 38
  const labelWidth = Math.max(10, ...config.rows.map(r => r.name.length > MAX_LABEL_WIDTH ? MAX_LABEL_WIDTH : r.name.length)) + 2;
  const cellWidth = 8;

  // Header row with days
  output += '  ' + ' '.repeat(labelWidth) + ' │';
  DAYS.forEach((day, colIdx) => {
    const isColSelected = colIdx === selectedCol;
    const dayLabel = day.padStart(Math.floor((cellWidth + day.length) / 2)).padEnd(cellWidth);
    output += isColSelected ? chalk.cyan.bold(dayLabel) : chalk.bold(dayLabel);
    output += '│';
  });
  output += '\n';

  // Separator
  output += '  ' + '─'.repeat(labelWidth) + '─┼' + ('─'.repeat(cellWidth) + '┼').repeat(DAYS.length - 1) + '─'.repeat(cellWidth) + '┤\n';

  // Data rows
  if (config.rows.length === 0) {
    output += chalk.dim('  No rows. Press Ctrl+A to add items.\n');
  } else {
    config.rows.forEach((row, rowIdx) => {
      const isRowSelected = rowIdx === selectedRow;
      const pointer = isRowSelected ? chalk.cyan('❯ ') : '  ';
      const label = truncate(row.name, labelWidth).padEnd(labelWidth);

      output += pointer;
      output += isRowSelected ? chalk.cyan.bold(label) : chalk.dim(label);
      output += ' │';

      DAYS.forEach((day, colIdx) => {
        const isCellSelected = isRowSelected && colIdx === selectedCol;
        const cellValue = row.cells[day];
        const displayValueStr = typeof cellValue === 'number' ? `${cellValue}h` : (cellValue || '-');
        let displayValue = displayValueStr.slice(0, cellWidth - 1).padEnd(cellWidth);

        if (isCellSelected) {
          output += chalk.yellow.bold(displayValue);
        } else {
          output += chalk.dim(displayValue);
        }
        output += '│';
      });
      output += '\n';
    });
  }

  output += '\n Task: ' + chalk.hex("#299549b8").bold(selectedRowData.name) + '\n'

  // Instruction s
  output += '\n';
  output += chalk.dim('  ←↑↓→: Navigate │ Enter: Select cell │ A: Add from Task Mode │  Q/Esc: Done');

  return output;
});



export default spreadsheetTable;
