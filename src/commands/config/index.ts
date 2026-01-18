import { Command } from "commander";
import {
   getSettingsAction,
   setSettingsAction,
   listSettingsAction,
   mainConfigAction,
   clearAllAction
} from "./actions"

export function configCommand(): Command {

   const config = new Command('config')
      .description("Configure CLI settings (Jira/ClickUp clients, preferences)")
      .action(mainConfigAction);


   config.command('set')
      .description("Set a configuration value")
      .argument("<path>", 'Configuration Path (e.g. jira.domain)')
      .argument("<value>", "Configuration value")
      .action(setSettingsAction);

   config.command('get')
      .description("Get configuration value")
      .argument("<path>", 'Configuration Path (e.g. jira.domain)')
      .action(getSettingsAction);


   config.command('list')
      .description("List all current configuration settings in raw data format")
      .action(listSettingsAction);


   config.command('clear')
      .description("Clear all data")
      .action(clearAllAction);

   return config
}