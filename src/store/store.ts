import Conf from 'conf';
import * as os from 'os';
import * as path from 'path';
import type { Settings } from './types';

interface AppData {
   settings?: Settings;
}

function defaultConfigDir(): string {
   const xdg = process.env.XDG_CONFIG_HOME ?? path.join(os.homedir(), '.config');
   return path.join(xdg, 'jitocu');
}

export function createStore(options?: { cwd?: string }) {
   return new Conf<AppData>({ projectName: 'jitocu', cwd: options?.cwd ?? defaultConfigDir() });
}

export type Store = ReturnType<typeof createStore>;
