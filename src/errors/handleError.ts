import { CLIError } from '../errors';
import chalk from 'chalk';

export function handleError(error: unknown): never {
   if (error instanceof CLIError) {
      console.error(chalk.red(`❌ ${error.message}`));
      if (error.context) {
         if (typeof error.context === "function") {
            error.context()
         } else {
            console.error(chalk.gray(`Context: ${JSON.stringify(error.context)}`));
         }
      }
      process.exit(error.code);
   }

   if (error instanceof Error) {
      console.error(chalk.red(`❌ Unexpected error: ${error.message}`));
      process.exit(1);
   }

   console.error(chalk.red('❌ Unknown error occurred'));
   process.exit(1);
}