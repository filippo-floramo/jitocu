
export interface CLICommand<TOptions = void> {
   execute(): Promise<void>
}