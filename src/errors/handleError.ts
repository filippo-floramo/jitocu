import { CLIError } from '../errors';
import { cancel, isCancellation } from './cancellation';
import chalk from 'chalk';

export function handleError(error: unknown): never {
   // Ctrl+C during a prompt reaches us as a thrown error; it is a deliberate
   // exit, not a failure, so it must not be reported as one.
   if (isCancellation(error)) {
      cancel();
   }

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