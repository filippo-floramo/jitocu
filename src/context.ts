import chalk from "chalk";
import { JiraService } from "./services/jira";
import { ClickUpService } from "./services/clickUp";
import { createStore, defaultConfigFilePath, type Store } from "./store/store";
import { ConfigError } from "./errors";

export interface AppContext {
   jira: JiraService;
   clickUp: ClickUpService;
   store: Store;
}

/**
 * Opening the store reads and parses the config file, which can fail on its own
 * (corrupt JSON, bad permissions). Name the file so the user can act on it.
 */
function openStore(): Store {
   try {
      return createStore();
   } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      const configPath = defaultConfigFilePath();

      throw new ConfigError(`Could not read the config file: ${detail}`, () => {
         console.error(chalk.gray(`File: ${configPath}`));
         console.error(chalk.gray("Fix the file, or delete it to start from a clean configuration."));
      });
   }
}

export async function createContext(): Promise<AppContext> {
   const store = openStore();

   return {
      store,
      jira: new JiraService(store),
      clickUp: new ClickUpService(store),
   };
}
