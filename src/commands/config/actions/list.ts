import { getJSONStore } from "../../../store/JSONStore";

export async function listSettingsAction() {
   const store = getJSONStore();

   const config = await store.getAll();

   console.log(config)
   process.exit(0)
}