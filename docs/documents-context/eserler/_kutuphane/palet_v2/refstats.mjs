import { makeIO, nodeStats } from './lib.mjs'; import { CFG, glbPath } from './palet.mjs'; import fs from 'fs';
const io = await makeIO();
for (const k of Object.keys(CFG)) { const c = CFG[k]; const o = {}; for (const sun of [false, true]) o[sun ? 'sunum' : 'app'] = nodeStats(await io.read(glbPath(c, c.to, sun))); fs.writeFileSync(`bx/ref_${k}.json`, JSON.stringify(o)); }
