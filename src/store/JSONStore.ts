import * as fs from 'fs/promises';
import * as path from 'path';
import type { DottedPaths, PathValue, Settings } from './types';

interface AppData {
   settings?: Settings;
}

class JsonStore {
   private static instance: JsonStore;
   private filePath: string;
   private cache: AppData | null = null;
   private filename = "data/store.json"

   constructor(filename?: string) {
      if (filename) {
         this.filePath = path.isAbsolute(filename)
            ? filename
            : path.join(process.cwd(), filename);
      } else {
         this.filePath = path.join(process.cwd(), this.filename);
      }
   }

   public static getInstance(filename?: string): JsonStore {
      if (!JsonStore.instance) {
         JsonStore.instance = new JsonStore(filename)
      }
      return JsonStore.instance
   }

   /**
    * Load data from JSON file
    */
   async load(): Promise<AppData> {
      if (this.cache) {
         return this.cache;
      }

      try {
         const fileExists = await fs.access(this.filePath)
            .then(() => true)
            .catch(() => false);

         if (!fileExists) {
            this.cache = {};
            return this.cache;
         }

         const content = await fs.readFile(this.filePath, 'utf-8');
         this.cache = JSON.parse(content);
         return this.cache!;
      } catch (error) {
         console.error('Error loading data:', error);
         this.cache = {};
         return this.cache;
      }
   }

   /**
    * Save data to JSON file
    */
   async save(data: AppData): Promise<void> {
      try {
         this.cache = data;
         // Ensure directory exists
         const dir = path.dirname(this.filePath);
         await fs.mkdir(dir, { recursive: true });

         await fs.writeFile(
            this.filePath,
            JSON.stringify(data, null, 2),
            'utf-8'
         );
      } catch (error) {
         console.error('Error saving data:', error);
         throw error;
      }
   }

   /**
    * Get a specific key from the data (top-level only)
    */
   async get<T = any>(key: keyof AppData): Promise<T | undefined> {
      const data = await this.load();
      return data[key] as T;
   }

   /**
    * Get a value at a nested path with type safety
    * Example: getPath('settings.jira.domain')
    */
   async getPath<P extends DottedPaths<AppData>>(
      path: P
   ): Promise<PathValue<AppData, P> | undefined> {
      const data = await this.load();
      const keys = path.split('.');
      let current: any = data;

      for (const key of keys) {
         if (current == null || !(key in current)) {
            return undefined;
         }
         current = current[key];
      }

      return current;
   }

   /**
    * Set a specific key in the data (top-level only)
    */
   async set<K extends keyof AppData>(key: K, value: AppData[K]): Promise<void> {
      const data = await this.load();
      data[key] = value;
      await this.save(data);
   }

   /**
    * Atomically update a nested property using a type-safe path
    * Example: updatePath('settings.jira.domain', 'example.atlassian.net')
    */
   async updatePath<P extends DottedPaths<AppData>>(
      path: P,
      value: PathValue<AppData, P>
   ): Promise<void> {
      const data = await this.load();
      const keys = path.split('.');
      let current: any = data;

      // Navigate to the parent of the target property
      for (let i = 0; i < keys.length - 1; i++) {
         if (!(keys[i] in current)) {
            current[keys[i]] = {};
         }
         current = current[keys[i]];
      }

      // Set the final property
      current[keys[keys.length - 1]] = value;
      await this.save(data);
   }

   /**
    * Atomically merge an object into a nested path
    * Example: mergePath('settings.jira', { domain: 'x', email: 'y' })
    */
   async mergePath<P extends DottedPaths<AppData>>(
      path: P,
      value: Partial<PathValue<AppData, P>>
   ): Promise<void> {
      const data = await this.load();
      const keys = path.split('.');
      let current: any = data;

      // Navigate to the target
      for (const key of keys) {
         if (!(key in current)) {
            current[key] = {};
         }
         current = current[key];
      }

      // Merge the value
      Object.assign(current, value);
      await this.save(data);
   }

   /**
    * Delete a specific key from the data
    */
   async delete(key: keyof AppData): Promise<void> {
      const data = await this.load();
      delete data[key];
      await this.save(data);
   }

   /**
    * Check if a key exists (top-level only)
    */
   async has(key: string): Promise<boolean> {
      const data = await this.load();
      return key in data;
   }

   /**
    * Check if a nested path exists with type safety
    * Example: hasPath('settings.jira.domain')
    */
   async hasPath<P extends DottedPaths<AppData>>(path: P): Promise<boolean> {
      const data = await this.load();
      const keys = path.split('.');
      let current: any = data;

      for (const key of keys) {
         if (current == null || !(key in current)) {
            return false;
         }
         current = current[key];
      }

      return true;
   }

   /**
    * Clear all data
    */
   async clear(): Promise<void> {
      await this.save({});
   }

   /**
    * Get all data
    */
   async getAll(): Promise<AppData> {
      return await this.load();
   }

   /**
    * Clear cache (useful for testing or forcing reload)
    */
   clearCache(): void {
      this.cache = null;
   }
}

export default JsonStore;