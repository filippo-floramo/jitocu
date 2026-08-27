
export interface CLICommand {
   execute(): Promise<void>
}