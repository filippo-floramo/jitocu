import JsonStore from "../../../store/JSONStore";

export async function listSettingsAction() {
   const store = JsonStore.getInstance()

   const config = await store.getAll();

   console.log(config)
   process.exit(0)
}