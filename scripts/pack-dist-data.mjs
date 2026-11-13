import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';
import { packCampus, unpackCampus, packTerrain, unpackTerrain } from '../src/data-pack.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
for(const [name,pack,unpack] of [['campus',packCampus,unpackCampus],['terrain',packTerrain,unpackTerrain]]){
  const sourceBytes=fs.readFileSync(path.join(root,'public/data',`${name}.json`));
  const source=JSON.parse(sourceBytes.toString('utf8'));
  const packed=pack(source);
  if(!isDeepStrictEqual(unpack(packed),source))throw new Error(`${name} packing changed source data`);
  const output=JSON.stringify(packed);
  fs.writeFileSync(path.join(root,'dist/data',`${name}.json`),output);
  console.log(`${name}.json: ${sourceBytes.length} -> ${Buffer.byteLength(output)} bytes`);
}

// Include project terms and attribution alongside the static website.
for (const name of ['LICENSE', 'NOTICE.md']) {
  fs.copyFileSync(path.join(root, name), path.join(root, 'dist', name));
}
