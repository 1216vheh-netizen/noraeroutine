// 영상·이미지를 만들지 않고 화면 구조만 측정: 장면별 안전 영역·최소 글자·줄 수·넘침
import { chromium, chromePath, fontsDir } from '../lib/env.mjs';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { buildHtml, layout, loadTokens } from '../lib/build.mjs';
import { QUIET_CHROME_ARGS, BLOCK_NETWORK_ARGS } from '../lib/render.mjs';
const spec = (await import(`../specs/${process.argv[2]}.mjs`)).default, ids = (process.argv[3] || '').split(',').filter(Boolean);
const TK = loadTokens(), { area } = layout(TK);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nr-layout-')); const hf = path.join(tmp, 'p.html');
fs.writeFileSync(hf, buildHtml(spec, { fontsDir: fontsDir(), TK }));
const b = await chromium.launch({ executablePath: chromePath(), args: [...QUIET_CHROME_ARGS, ...BLOCK_NETWORK_ARGS] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + hf); await p.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });
const out = { spec: spec.id, scenes: [] };
for (const sc of spec.scenes) {
  await p.evaluate((t) => setT(t), sc.e - 0.4);
  const items = await p.evaluate((a) => measure(a), area);
  const lines = await p.evaluate((ids) => ids.map((id) => { const el = document.querySelector(`[data-check="${id}"]`); if (!el) return null;
    const r = el.getBoundingClientRect(), lh = parseFloat(getComputedStyle(el).lineHeight);
    return { id, lines: Math.round(r.height / lh), height: Math.round(r.height), overflowX: el.scrollWidth > el.clientWidth + 1 }; }).filter(Boolean), ids);
  out.scenes.push({ scene: [sc.s, sc.e], bad: items.filter((i) => !i.inside || i.minFont < 32).map((i) => i.id),
    textBottom: Math.max(...items.filter((i) => !['brand', 'ep'].includes(i.id)).map((i) => i.box[3])), lines });
}
await b.close(); fs.rmSync(tmp, { recursive: true });
console.log(JSON.stringify(out));
