import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const url = 'http://127.0.0.1:4311/';
async function healthy() {
  try { return (await (await fetch(url + '__campus_health', { signal: AbortSignal.timeout(600) })).json()).app === 'swu-campus-local'; }
  catch { return false; }
}
if (!(await healthy())) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('local-server.mjs', import.meta.url))], { detached: true, stdio: 'ignore', windowsHide: true });
  child.unref();
  for (let i = 0; i < 30 && !(await healthy()); i++) await new Promise(resolve => setTimeout(resolve, 200));
}
if (!(await healthy())) { console.error('Could not start local website. Port 4311 may be in use.'); process.exit(1); }
spawn('explorer.exe', [url], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
