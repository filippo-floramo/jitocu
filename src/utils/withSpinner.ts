// src/utils/spinner.ts
import ora from 'ora';

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
    spinner.fail(options?.failText);
    throw error;
  }
}