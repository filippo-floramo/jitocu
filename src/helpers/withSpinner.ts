// src/utils/spinner.ts
import ora from 'ora';
import { isCancellation } from '../errors/cancellation';

export async function withSpinner<T>(
  operation: () => Promise<T>,
  options: {
    text: string, 
    successText?: string;
    failText?: string;
  }
): Promise<T> {
  const spinner = ora(options.text).start();
  
  try {
    const result = await operation();
    spinner.succeed(options?.successText);
    return result;
  } catch (error) {
    // A cancelled prompt is not a failed operation: stopping clears the line so
    // the only thing left on screen is the "Cancelled." note.
    if (isCancellation(error)) {
      spinner.stop();
    } else {
      spinner.fail(options?.failText);
    }
    throw error;
  }
}