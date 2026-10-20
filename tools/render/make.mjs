// 사용법: node make.mjs <spec 이름> <legacy|final|draft> <출력 폴더> [--pages=auto|1|2|4] [--loud-chrome] [--proxy=http://127.0.0.1:포트] [--silent]
import path from 'node:path';
import { renderReel } from './lib/render.mjs';

const [specName, profile = 'final', out] = process.argv.slice(2);
const flag = (k) => (process.argv.find((a) => a.startsWith(`--${k}`)) || '').split('=')[1];
const has = (k) => process.argv.includes(`--${k}`);
const spec = (await import(`./specs/${specName}.mjs`)).default;
const meta = await renderReel({ spec, profile, out: path.resolve(out), pages: flag('pages'), quietChrome: !has('loud-chrome'),
  proxy: flag('proxy') || null, audio: has('silent') ? 'silent' : 'sync' });
console.log(JSON.stringify(meta));
