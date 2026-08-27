import { Command } from "commander";
import { DefaultConfigCommand } from "./default";
import { SetSettingsCommand } from "./set";
import { GetSettingsCommand } from "./get";
import { ListSettingsCommand } from "./list";
import { ClearStoreCommand } from "./clear";
import { run } from "../shared/run";
import type { AppContext } from "../../context";

export function configCommand(ctx: AppContext): Command {
   const config = new Command('config')
      .description("Configure CLI settings (Jira/ClickUp clients, preferences)")
      .action(async () => run(ctx, (c) => new DefaultConfigCommand(c)));

   config.command('set')
      .description("Set a configuration value")
      .argument("<path>", 'Configuration Path (e.g. jira.domain)')
      .argument("<value>", "Configuration value")
      .action(async (path, value) => run(ctx, (c) => new SetSettingsCommand(c, path, value)));

   config.command('get')
      .description("Get configuration value")
      .argument("<path>", 'Configuration Path (e.g. jira.domain)')
      .option("--reveal", "Show secret values unmasked")
      .action(async (path, options) => run(ctx, (c) => new GetSettingsCommand(c, path, options.reveal)));

   config.command('list')
      .description("List all current configuration settings in raw data format")
      .option("--reveal", "Show secret values unmasked")
      .action(async (options) => run(ctx, (c) => new ListSettingsCommand(c, options.reveal)));

   config.command('clear')
      .description("Clear all data")
      .action(async () => run(ctx, (c) => new ClearStoreCommand(c)));

   return config;
}
