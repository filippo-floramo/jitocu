import chalk from "chalk";

/** Shell convention for "terminated by SIGINT": 128 + signal number. */
export const CANCELLED_EXIT_CODE = 130;

/**
 * Ctrl+C is not one event. @inquirer/core installs its own `SIGINT` listener on
 * the readline interface, so while a prompt is open the keypress never reaches
 * a process-level handler — it rejects the prompt with an `ExitPromptError`
 * instead. Between prompts (during a spinner, a fetch) there is no readline
 * listener and the same keypress arrives as a real `SIGINT`. Both paths have to
 * end up in `cancel()`.
 *
 * The error is matched by `name`, not `instanceof`: the class lives in
 * @inquirer/core, which can be installed more than once in a dependency tree,
 * and a duplicate copy would fail an identity check.
 */
export function isCancellation(error: unknown): boolean {
   return (
      error instanceof Error &&
      (error.name === "ExitPromptError" || error.name === "AbortPromptError")
   );
}

let cancelling = false;

/**
 * Leave the terminal the way we found it and exit quietly. Cancelling is a
 * normal way to leave an interactive CLI, so it prints a note rather than an
 * error and never a stack trace.
 */
export function cancel(): never {
   // A prompt's rejection and a real SIGINT can both land during teardown;
   // printing twice would look like two failures.
   if (!cancelling) {
      cancelling = true;
      // ora and the custom prompts hide the cursor while they render. Their own
      // exit hooks usually restore it, but not on every path — showing it again
      // is idempotent, and a terminal left without a cursor is unusable. Piped
      // output has no cursor to restore, and the escape would land in the file.
      if (process.stderr.isTTY) {
         process.stderr.write("\x1B[?25h");
      }
      console.error(chalk.gray("\nCancelled."));
   }

   process.exit(CANCELLED_EXIT_CODE);
}

/**
 * Turns the SIGINT that arrives outside a prompt into the same clean exit.
 * Registered once, in `cli.ts`, before any command runs.
 */
export function installCancellationHandler(): void {
   // The project types against bun-types alone, whose `process.on` overload
   // only knows "memoryPressure" — signals do not typecheck without @types/node.
   // Widening to the plain emitter is enough; the listener is wrapped because
   // `cancel` returns `never`, which no listener signature accepts.
   const emitter = process as unknown as NodeJS.EventEmitter;

   emitter.on("SIGINT", () => {
      cancel();
   });
   emitter.on("SIGTERM", () => {
      cancel();
   });
}
