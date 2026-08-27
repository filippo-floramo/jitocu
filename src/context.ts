import { JiraService } from "./services/jira";
import { ClickUpService } from "./services/clickUp";
import { createStore, type Store } from "./store/store";

export interface AppContext {
   jira: JiraService;
   clickUp: ClickUpService;
   store: Store;
}

export async function createContext(): Promise<AppContext> {
   const store = createStore();

   return {
      store,
      jira: new JiraService(store),
      clickUp: new ClickUpService(store),
   };
}
