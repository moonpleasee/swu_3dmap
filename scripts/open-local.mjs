import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ports = [4311, 4312];
async function healthy(url) {
  try { const health=await (await fetch(url + '__campus_health', { signal: AbortSignal.timeout(600) })).json();return health.app === 'swu-campus-local'&&health.backend===true; }
  catch { return false; }
}
let url;
for (const port of ports) {
  const candidate = `http://127.0.0.1:${port}/`;
  if (await healthy(candidate)) { url = candidate; break; }
  const child = spawn(process.execPath, [fileURLToPath(new URL('local-server.mjs', import.meta.url))], { detached: true, stdio: 'ignore', windowsHide: true, env: { ...process.env, PORT: String(port) } });
  child.unref();
  for (let i = 0; i < 30 && !(await healthy(candidate)); i++) await new Promise(resolve => setTimeout(resolve, 200));
  if (await healthy(candidate)) { url = candidate; break; }
}
if (!url) { console.error('Could not start local website on ports 4311 or 4312.'); process.exit(1); }
console.log(`Opening campus website: ${url}`);
const browser = spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true });
browser.once('error', error => { console.error(`Could not open browser: ${error.message}`); process.exitCode = 1; });
browser.unref();
