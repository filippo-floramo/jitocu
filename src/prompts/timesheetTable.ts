/**
 * Spreadsheet-like Table Prompt
 * Navigate cells on X/Y axis
 */

import { createPrompt, useState, useKeypress, isEnterKey } from '@inquirer/core';
import chalk from 'chalk';
import { DAYS_MAP } from '../helpers';
import { MappedtimeEntry } from '../helpers/mapTimeEntries';
import { truncate } from '../helpers/truncate';

interface TimeSheetConfig {
  message: string;
  rows: MappedtimeEntry[];
}

interface CellSelection {
  task: MappedtimeEntry;
  day: number;
  dayName: string;
}

type TimeSheetResult = MappedtimeEntry[] | CellSelection;



const spreadsheetTable = createPrompt<TimeSheetResult, TimeSheetConfig>((config, done) => {
  const [selectedRow, setSelectedRow] = useState(0);
  const [selectedCol, setSelectedCol] = useState(0);

  // ANSI escape code to hide cursor
  const hideCursor = '\x1B[?25l';
  const DAYS = Object.keys(DAYS_MAP)

  useKeypress((key) => {
    // Table navigation
    if (key.name === 'up' || key.name === 'k') {
      setSelectedRow(Math.max(0, selectedRow - 1));
    } else if (key.name === 'down' || key.name === 'j') {
      setSelectedRow(Math.min(config.rows.length - 1, selectedRow + 1));
    } else if (key.name === 'left' || key.name === 'h') {
      setSelectedCol(Math.max(0, selectedCol - 1));
    } else if (key.name === 'right' || key.name === 'l') {
      setSelectedCol(Math.min(DAYS.length - 1, selectedCol + 1));
    } else if (isEnterKey(key) && config.rows.length > 0) {
      // Return selected cell data
      const selectedDay = DAYS[selectedCol];


      const selectedRowData = config.rows[selectedRow];
      const cellData = {
        task: selectedRowData,
        day: DAYS_MAP[selectedDay as keyof typeof DAYS_MAP],
        dayName: selectedDay
      };
      done(cellData);
    } else if (key.name === 'q' || key.name === 'escape') {
      done(config.rows);
    }
  });

  let output = hideCursor + chalk.bold(config.message) + '\n\n';

  // Calculate column widths
  const MAX_LABEL_WIDTH = 38
  const labelWidth = Math.max(10, ...config.rows.map(r => r.label.length > MAX_LABEL_WIDTH ? MAX_LABEL_WIDTH : r.label.length)) + 2;
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
      const label = truncate(row.label, labelWidth).padEnd(labelWidth);

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

  // Instructions
  output += '\n';
  output += chalk.dim('  ←↑↓→: Navigate │ Enter: Select cell │ Q/Esc: Done');

  return output;
});



export default spreadsheetTable;