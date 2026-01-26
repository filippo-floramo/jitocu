import { Command } from "commander";
import { DefaultConfigCommand } from "./default";
import { SetSettingsCommand } from "./set";
import { GetSettingsCommand } from "./get";
import { ListSettingsCommand } from "./list";
import { ClearStoreCommand } from "./clear";
import { handleError } from "../../errors/handleError";

export function configCommand(): Command {
   const config = new Command('config')
      .description("Configure CLI settings (Jira/ClickUp clients, preferences)")
      .action(async () => {
         try {
            const command = new DefaultConfigCommand();
            await command.execute();
            process.exit(0);
         } catch (error) {
            handleError(error);
         }
      });

   config.command('set')
      .description("Set a configuration value")
      .argument("<path>", 'Configuration Path (e.g. jira.domain)')
      .argument("<value>", "Configuration value")
      .action(async (path, value) => {
         try {
            const command = new SetSettingsCommand(path, value);
            await command.execute();
            process.exit(0);
         } catch (error) {
            handleError(error);
         }
      });

   config.command('get')
      .description("Get configuration value")
      .argument("<path>", 'Configuration Path (e.g. jira.domain)')
      .action(async (path) => {
         try {
            const command = new GetSettingsCommand(path);
            await command.execute();
            process.exit(0);
         } catch (error) {
            handleError(error)
         }
      });

   config.command('list')
      .description("List all current configuration settings in raw data format")
      .action(async () => {
         try {
            const command = new ListSettingsCommand();
            await command.execute();
            process.exit(0);
         } catch (error) {
            handleError(error);
         }
      });

   config.command('clear')
      .description("Clear all data")
      .action(async () => {
         try {
            const command = new ClearStoreCommand();
            await command.execute();
            process.exit(0);
         } catch (error) {
            handleError(error);
         }
      });

   return config;
}