// 얼굴 위치 검증 (설계안 시제품). 영상·이미지를 만들지 않고, 장면 정의의 글자 상자와 .face.json의 얼굴 상자만 비교한다.
// 사용법: node tools/face_check.mjs <spec 이름> <얼굴 배치 JSON>
//   얼굴 배치 JSON: [{ "scene": 시작초, "face": "…face.json 경로" }, …]
// 규칙(DESIGN_SYSTEM v2.3 변경안 6-3):
//   R1 얼굴 상자는 캐릭터 영역(가로 80~940, 세로 1040~1480) 안
//   R2 얼굴 상자 높이 ≥ 200px (휴대폰 390px 폭에서 약 72px)
//   R3 화면에 보이는 글자 상자와 얼굴 상자 사이 간격 ≥ 24px (겹침 금지)
//   R4 얼굴 위치 파일의 클립 체크섬 형식·필수 항목 확인
import { chromium, chromePath, fontsDir } from '../lib/env.mjs';
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { buildHtml, layout, loadTokens } from '../lib/build.mjs';
import { QUIET_CHROME_ARGS, BLOCK_NETWORK_ARGS } from '../lib/render.mjs';

export const ZONE = { x0: 80, y0: 1040, x1: 940, y1: 1480 }, MIN_FACE_H = 200, GAP = 24;
const spec = (await import(`../specs/${process.argv[2]}.mjs`)).default;
const plan = JSON.parse(fs.readFileSync(process.argv[3], 'utf8'));
const TK = loadTokens();
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'nr-face-')); const hf = path.join(tmp, 'p.html');
fs.writeFileSync(hf, buildHtml(spec, { fontsDir: fontsDir(), TK }));
const b = await chromium.launch({ executablePath: chromePath(), args: [...QUIET_CHROME_ARGS, ...BLOCK_NETWORK_ARGS] });
const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
await p.goto('file://' + hf); await p.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });

const lerp = (k, t) => { let i = 0; while (i < k.length - 2 && k[i + 1].t <= t) i++;
  const a = k[i], c = k[i + 1], u = Math.min(1, Math.max(0, (t - a.t) / (c.t - a.t))); return a.box.map((v, j) => v + (c.box[j] - v) * u); };
const report = [];
for (const item of plan) {
  const sc = spec.scenes.find((s) => s.s === item.scene); const f = JSON.parse(fs.readFileSync(item.face, 'utf8'));
  const v = [];
  for (const k of ['clip', 'clipSha256', 'fps', 'size', 'placement', 'keyframes', 'annotatedBy', 'checkedBy']) if (f[k] === undefined) v.push(`R4 필수 항목 없음: ${k}`);
  if (f.clipSha256 && !/^[0-9a-f]{64}$/.test(f.clipSha256)) v.push('R4 클립 체크섬 형식 오류');
  for (let t = sc.s + 0.2; t <= sc.e - 0.2 + 1e-9; t += 0.1) {
    const fb = lerp(f.keyframes, t - sc.s).map((x, j) => (j % 2 ? f.placement.y : f.placement.x) + x * f.placement.scale);
    if (fb[0] < ZONE.x0 || fb[2] > ZONE.x1 || fb[1] < ZONE.y0 || fb[3] > ZONE.y1) v.push(`R1 영역 밖 t=${t.toFixed(1)} 얼굴 ${fb.map(Math.round)}`);
    if (fb[3] - fb[1] < MIN_FACE_H) v.push(`R2 얼굴이 작음 t=${t.toFixed(1)} 높이 ${Math.round(fb[3] - fb[1])}px`);
    await p.evaluate((t) => setT(t), t);
    const texts = await p.evaluate(() => [...document.querySelectorAll('[data-check]')].filter((el) => { let n = el; while (n && !n.classList?.contains('scene')) n = n.parentElement;
      return (!n || +n.style.opacity > 0.01) && +getComputedStyle(el).opacity > 0.01; }).map((el) => { const r = el.getBoundingClientRect(); return { id: el.dataset.check, box: [r.left, r.top, r.right, r.bottom] }; }));
    for (const tx of texts) { const [a0, b0, a1, b1] = tx.box;
      if (a0 < fb[2] + GAP && a1 > fb[0] - GAP && b0 < fb[3] + GAP && b1 > fb[1] - GAP) v.push(`R3 글자와 간격 부족 t=${t.toFixed(1)} '${tx.id}' 아래끝 ${Math.round(b1)} / 얼굴 위끝 ${Math.round(fb[1])}`); }
  }
  const uniq = [...new Set(v.map((s) => s.replace(/ t=[\d.]+.*/, '')))];
  report.push({ scene: [sc.s, sc.e], face: path.basename(item.face), pass: v.length === 0, violations: uniq, firstExamples: v.slice(0, 3) });
}
await b.close(); fs.rmSync(tmp, { recursive: true });
console.log(JSON.stringify(report, null, 1));
process.exit(report.every((r) => r.pass) ? 0 : 1);
