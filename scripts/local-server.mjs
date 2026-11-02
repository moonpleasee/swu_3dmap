// Preserve the existing launcher while serving the persistent community API.
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const env=fileURLToPath(new URL('../.env',import.meta.url));
if(existsSync(env))process.loadEnvFile(env);
await import('../server/start.mjs');
