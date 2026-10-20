// 3차 렌더링 최적화 테스트. 2차 HTML의 사본(source.html)을 그대로 쓰고, 그리는 방식만 바꿔 비교한다.
// 환경변수: PAGES(1|4) FMT(png|jpeg) PIPE(0|1) BAR(html|ffmpeg) DEDUPE(0|1) SCALE(1|0.5) FPS(30|15) PRESET CRF OUT
import { chromium } from '../dtcg_tools/node_modules/playwright-core/index.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const E = process.env;
const PAGES = +(E.PAGES || 1), FMT = E.FMT || 'png', PIPE = E.PIPE === '1', BAR = E.BAR || 'html';
const DEDUPE = E.DEDUPE === '1', SCALE = +(E.SCALE || 1), FPS = +(E.FPS || 30), PRESET = E.PRESET || 'slow', CRF = E.CRF || '17';
const OUT = path.join(HERE, E.OUT || 'out'), DUR = 30, N = FPS * DUR;
fs.mkdirSync(OUT, { recursive: true });
const TK = JSON.parse(fs.readFileSync('/home/user/noraeroutine/design/tokens.json', 'utf8'));
const ACC = TK.color.warm.accent.$value.hex.replace('#', '0x');
const R = TK.format.reelsCover, ml = R.marginLeft.$value, tw = R.textWidth.$value, top = R.safeTop.$value;
const W = Math.round(1080 * SCALE), H = Math.round(1920 * SCALE);
const t0 = Date.now(), stamp = {};

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
async function openPage() {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: SCALE });
  await p.goto('file://' + path.join(HERE, 'source.html'));
  await p.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });
  const ok = await p.evaluate(() => ['500', '700', '800'].every((w) => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Pretendard' && String(f.weight) === w && f.status === 'loaded')));
  if (!ok) throw new Error('Pretendard 미로드');
  if (BAR === 'ffmpeg') await p.evaluate(() => { document.getElementById('bar').style.visibility = 'hidden'; });
  return p;
}
const pages = await Promise.all(Array.from({ length: PAGES }, openPage));

// 프레임 목록. DEDUPE면 화면 상태(인라인 스타일)가 직전과 같은 프레임은 다시 그리지 않는다.
const owner = new Array(N);
if (DEDUPE) {
  let prev = null, last = -1;
  for (let i = 0; i < N; i++) {
    const sig = await pages[0].evaluate((t) => { setT(t); return [...document.querySelectorAll('[style]')].filter((e) => e.id !== 'bar').map((e) => e.style.cssText).join('|'); }, i / FPS);
    if (sig !== prev) { last = i; prev = sig; }
    owner[i] = last;
  }
} else for (let i = 0; i < N; i++) owner[i] = i;
const uniq = [...new Set(owner)];
stamp.plan = Date.now() - t0;

// ffmpeg 인코더 준비
const BG = TK.color.warm.bg.$value.hex.replace('#', '0x');
const bx = Math.round(ml * SCALE), by = Math.round(top * SCALE), bw = Math.round(tw * SCALE), bh = Math.max(2, Math.round(8 * SCALE));
const strip = path.join(OUT, 'bar_strip.png'), mask = path.join(OUT, 'bar_mask.png');
const sh = (args) => new Promise((r, j) => spawn('convert', args).on('close', (c) => (c ? j(new Error('convert')) : r())));
if (BAR === 'ffmpeg') {
  // [끝이 둥근 막대 bw][투명 bw] 띠를 만들고, 시간에 따라 보이는 창을 옮겨 막대가 왼쪽부터 자라게 한다.
  // 왼쪽 끝은 배경색 모서리 가리개(가운데가 투명한 반원)로 둥글게 만든다.
  const r = bh / 2, accHex = '#' + ACC.slice(2), bgHex = '#' + BG.slice(2);
  await sh(['-size', `${bw * 2}x${bh}`, 'xc:none', '-fill', accHex, '-draw', `roundrectangle 0,0 ${bw - 1},${bh - 1} ${r},${r}`, strip]);
  await sh(['-size', `${r}x${bh}`, `xc:${bgHex}`, '(', '-size', `${r * 2}x${bh}`, 'xc:black', '-fill', 'white', '-draw', `circle ${r - 0.5},${r - 0.5} ${r - 0.5},0`, '-crop', `${r}x${bh}+0+0`, '+repage', ')', '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', '-channel', 'A', '-negate', '+channel', mask]);
}
const enc = ['-hide_banner', '-loglevel', 'error', '-y'];
const inArgs = PIPE ? ['-f', 'image2pipe', '-c:v', FMT === 'jpeg' ? 'mjpeg' : 'png', '-framerate', String(FPS), '-i', '-']
  : ['-framerate', String(FPS), '-i', path.join(OUT, 'frames', '%04d.' + (FMT === 'jpeg' ? 'jpg' : 'png'))];
const outFile = path.join(OUT, 'reel.mp4');
const barIn = BAR === 'ffmpeg' ? ['-loop', '1', '-framerate', String(FPS), '-i', strip, '-loop', '1', '-framerate', String(FPS), '-i', mask] : [];
const aIdx = BAR === 'ffmpeg' ? 3 : 1;
const vf = BAR === 'ffmpeg'
  ? ['-filter_complex', `[0:v]format=rgba[base];[1:v]format=rgba,crop=${bw}:${bh}:x='${bw}-${bw}*min(t/${DUR}\\,1)':y=0[bar];[2:v]format=rgba[m];[base][bar]overlay=${bx}:${by}:shortest=1[v1];[v1][m]overlay=${bx}:${by}:shortest=1,format=yuv420p[v]`, '-map', '[v]']
  : ['-vf', 'format=yuv420p', '-map', '0:v'];
const ffArgs = [...enc, ...inArgs, ...barIn, '-f', 'lavfi', '-t', String(DUR), '-i', 'anullsrc=channel_layout=stereo:sample_rate=48000',
  ...vf, '-map', `${aIdx}:a`, '-c:v', 'libx264', '-preset', PRESET, '-crf', CRF, '-profile:v', 'high',
  '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2), '-c:a', 'aac', '-b:a', '128k', '-shortest', '-movflags', '+faststart', outFile];

const shotOpt = FMT === 'jpeg' ? { type: 'jpeg', quality: 95 } : { type: 'png' };
let ff, ffDone;
if (PIPE) { ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] }); ffDone = new Promise((r) => ff.on('close', r)); }
else fs.mkdirSync(path.join(OUT, 'frames'), { recursive: true });

// 고유 프레임만 그리고, 순서대로 ffmpeg에 보내거나(PIPE) 파일로 저장
const buf = new Map(); let next = 0, lock = Promise.resolve();
const flush = () => (lock = lock.then(flushNow));
async function flushNow() {
  while (next < N && buf.has(owner[next])) {
    const b = buf.get(owner[next]);
    if (PIPE) { if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); }
    else fs.writeFileSync(path.join(OUT, 'frames', String(next).padStart(4, '0') + (FMT === 'jpeg' ? '.jpg' : '.png')), b);
    if (owner[next + 1] !== owner[next]) buf.delete(owner[next]);
    written.push(owner[next]);
    next++;
  }
}
let cursor = 0; const written = [];
await Promise.all(pages.map(async (p) => {
  while (true) {
    const k = cursor++; if (k >= uniq.length) break;
    const i = uniq[k];
    await p.evaluate((t) => setT(t), i / FPS);
    buf.set(i, await p.screenshot(shotOpt));
    await flush();
  }
}));
await flush();
stamp.render = Date.now() - t0;
await browser.close();
if (PIPE) { ff.stdin.end(); const code = await ffDone; if (code) throw new Error('ffmpeg ' + code); }
else await new Promise((r, j) => spawn('ffmpeg', ffArgs, { stdio: 'inherit' }).on('close', (c) => (c ? j(new Error('ffmpeg ' + c)) : r())));
stamp.total = Date.now() - t0;
const orderOk = written.length === N && written.every((o, i) => o === owner[i]);
if (!orderOk) throw new Error('프레임 순서 불일치');
const meta = { orderOk, PAGES, FMT, PIPE, BAR, DEDUPE, SCALE, FPS, PRESET, CRF, frames: N, rendered: uniq.length, ms: stamp, size: fs.statSync(outFile).size,
  tempDiskBytes: PIPE ? 0 : fs.readdirSync(path.join(OUT, 'frames')).reduce((s, f) => s + fs.statSync(path.join(OUT, 'frames', f)).size, 0) };
fs.writeFileSync(path.join(OUT, 'meta.json'), JSON.stringify(meta, null, 1));
console.log(JSON.stringify(meta));
