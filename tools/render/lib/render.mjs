// 노래루틴 릴스 렌더링 파이프라인 (제작 시스템 v2).
// 프로필
//   legacy : v1 방식 재현 (화면 1개, PNG 파일 저장, 진행 막대 HTML, x264 slow) — 비교용
//   final  : 최종본 D' (1080×1920·30fps, PNG 캡처, 화면 병렬, 바로 전달, 막대 ffmpeg 합성, 같은 프레임 생략, x264 medium)
//   draft  : 빠른 시안 E (540×960·15fps, JPEG 캡처, 나머지는 final과 같음, x264 veryfast)
// 3차 테스트에서 고친 문제 3건을 포함한다.
//   ① 프레임 순서: 여러 화면이 동시에 ffmpeg로 보낼 때 순서가 엇갈리던 문제 → 전송을 하나씩 직렬화하고 순서를 검증
//   ② 진행 막대 시간: drawbox의 t는 시간이 아니라 선 두께 → 막대 이미지를 시간식(crop x)으로 잘라 보이게 함
//   ③ 회색 띠: 왼쪽 덮개 사각형의 색이 색 범위 변환에서 틀어짐 → 배경색 모서리 가리개(RGBA)로 왼쪽 끝을 둥글게 처리
import { chromium, chromePath, fontsDir as defaultFontsDir, envInfo } from './env.mjs';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { buildHtml, layout, loadTokens } from './build.mjs';

export const PROFILES = {
  legacy: { scale: 1, fps: 30, fmt: 'png', pipe: false, bar: 'html', dedupe: false, preset: 'slow', crf: 17, pages: 1 },
  final:  { scale: 1, fps: 30, fmt: 'png', pipe: true, bar: 'ffmpeg', dedupe: true, preset: 'medium', crf: 17, pages: 'auto' },
  draft:  { scale: 0.5, fps: 15, fmt: 'jpeg', pipe: true, bar: 'ffmpeg', dedupe: true, preset: 'veryfast', crf: 23, pages: 'auto' },
};

// 크롬의 불필요한 백그라운드 통신을 끄는 설정. 로컬 파일만 읽는 렌더링에는 영향이 없다(검증 스크립트로 확인).
export const QUIET_CHROME_ARGS = [
  '--disable-background-networking', '--disable-component-update', '--disable-sync', '--disable-default-apps',
  '--disable-domain-reliability', '--disable-client-side-phishing-detection', '--disable-breakpad', '--no-pings',
  '--metrics-recording-only', '--safebrowsing-disable-auto-update', '--no-first-run', '--no-default-browser-check',
  '--disable-features=OptimizationHints,Translate,MediaRouter,AutofillServerCommunication,CertificateTransparencyComponentUpdater,InterestFeedContentSuggestions',
];
// 위 설정만으로는 계정·시간 동기화 등 일부 통신이 남는다(검증: 외부 접속 시도 10건 → 7건).
// 렌더링은 로컬 파일만 읽으므로 주소 찾기 자체를 막아 외부 접속을 0건으로 만든다(검증: 0건, 화면 해시 동일).
export const BLOCK_NETWORK_ARGS = ['--no-proxy-server', '--host-resolver-rules=MAP * ~NOTFOUND , EXCLUDE localhost'];

// 화면 수: 'auto'면 남은 메모리가 6GB 이상일 때 4개, 아니면 2개 (3차 측정: 4개일 때 최대 약 2.1GB)
export function pickPages(req) {
  if (req !== 'auto') return Number(req);
  const avail = Number((fs.readFileSync('/proc/meminfo', 'utf8').match(/MemAvailable:\s+(\d+)/) || [])[1] || 0) / 1048576;
  return avail >= 6 ? 4 : 2;
}

const run = (cmd, args, opts = {}) => new Promise((res, rej) => {
  const p = spawn(cmd, args, { stdio: ['ignore', 'inherit', 'inherit'], ...opts });
  p.on('close', (c) => (c ? rej(new Error(`${cmd} 실패 (${c})`)) : res()));
});

// 오디오 싱크 검증용 신호음: 각 장면 시작 시각(0초 제외)에 1kHz 60ms
export async function makeSyncTone(spec, file) {
  const starts = spec.scenes.map((s) => s.s).filter((s) => s > 0);
  const gate = starts.map((s) => `between(t,${s},${(s + 0.06).toFixed(2)})`).join('+');
  await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i',
    `aevalsrc='0.3*sin(2*PI*1000*t)*(${gate})':s=48000:d=${spec.duration}`, '-ac', '2', file]);
  return starts;
}

export async function renderReel({ spec, profile = 'final', pages: pagesReq, out, quietChrome = true, proxy = null, audio = 'sync', fontsDir = defaultFontsDir() }) {
  const P = { ...PROFILES[profile] };
  const TK = loadTokens();
  const { top, ml, tw, area } = layout(TK);
  const DUR = spec.duration, FPS = P.fps, N = Math.round(FPS * DUR), SCALE = P.scale;
  const PAGES = pickPages(pagesReq ?? P.pages);
  fs.mkdirSync(out, { recursive: true });
  const t0 = Date.now(), ms = {};
  const html = buildHtml(spec, { fontsDir, TK });
  const hf = path.join(out, 'reel.html'); fs.writeFileSync(hf, html);

  const browser = await chromium.launch({ executablePath: chromePath(),
    args: quietChrome ? [...QUIET_CHROME_ARGS, ...(proxy ? [] : BLOCK_NETWORK_ARGS)] : [], ...(proxy ? { proxy: { server: proxy } } : {}) });
  const open = async () => {
    const p = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: SCALE });
    await p.goto('file://' + hf);
    await p.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });
    const ok = await p.evaluate(() => ['500', '700', '800'].every((w) => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Pretendard' && String(f.weight) === w && f.status === 'loaded')));
    if (!ok) throw new Error('Pretendard 미로드 — 제작 중단');
    if (P.bar === 'ffmpeg') await p.evaluate(() => { document.getElementById('bar').style.visibility = 'hidden'; });
    return p;
  };
  const pages = await Promise.all(Array.from({ length: PAGES }, open));

  // 안전 영역·글자 크기 측정: 장면마다 모든 요소가 들어온 시점(장면 끝 0.4초 전)
  const checks = [];
  for (const sc of spec.scenes) {
    const t = +(sc.e - 0.4).toFixed(2);
    await pages[0].evaluate((t) => setT(t), t);
    checks.push({ scene: [sc.s, sc.e], t, items: await pages[0].evaluate((a) => measure(a), area) });
  }

  // 프레임 계획: 같은 화면(진행 막대 제외)이 이어지면 다시 그리지 않음
  const owner = new Array(N);
  if (P.dedupe) {
    let prev = null, last = -1;
    for (let i = 0; i < N; i++) {
      const sig = await pages[0].evaluate((t) => { setT(t); return [...document.querySelectorAll('[style]')].filter((e) => e.id !== 'bar').map((e) => e.style.cssText).join('|'); }, i / FPS);
      if (sig !== prev) { last = i; prev = sig; }
      owner[i] = last;
    }
  } else for (let i = 0; i < N; i++) owner[i] = i;
  const uniq = [...new Set(owner)];
  ms.plan = Date.now() - t0;

  // 오디오
  const wav = path.join(out, 'audio.wav');
  let toneStarts = [];
  if (audio === 'sync') toneStarts = await makeSyncTone(spec, wav);
  else await run('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'lavfi', '-i', `anullsrc=channel_layout=stereo:sample_rate=48000`, '-t', String(DUR), wav]);

  // ffmpeg 인코더
  const BG = TK.color.warm.bg.$value.hex, ACC = TK.color.warm.accent.$value.hex;
  const bx = Math.round(ml * SCALE), by = Math.round(top * SCALE), bw = Math.round(tw * SCALE), bh = Math.max(2, Math.round(8 * SCALE));
  const strip = path.join(out, 'bar_strip.png'), mask = path.join(out, 'bar_mask.png');
  if (P.bar === 'ffmpeg') {
    const r = bh / 2;
    await run('convert', ['-size', `${bw * 2}x${bh}`, 'xc:none', '-fill', ACC, '-draw', `roundrectangle 0,0 ${bw - 1},${bh - 1} ${r},${r}`, strip]);
    await run('convert', ['-size', `${r}x${bh}`, `xc:${BG}`, '(', '-size', `${r * 2}x${bh}`, 'xc:black', '-fill', 'white', '-draw', `circle ${r - 0.5},${r - 0.5} ${r - 0.5},0`, '-crop', `${r}x${bh}+0+0`, '+repage', ')', '-alpha', 'off', '-compose', 'CopyOpacity', '-composite', '-channel', 'A', '-negate', '+channel', mask]);
  }
  const ext = P.fmt === 'jpeg' ? 'jpg' : 'png';
  const framesDir = path.join(out, 'frames');
  const inArgs = P.pipe ? ['-f', 'image2pipe', '-c:v', P.fmt === 'jpeg' ? 'mjpeg' : 'png', '-framerate', String(FPS), '-i', '-']
    : ['-framerate', String(FPS), '-i', path.join(framesDir, `%05d.${ext}`)];
  const barIn = P.bar === 'ffmpeg' ? ['-loop', '1', '-framerate', String(FPS), '-i', strip, '-loop', '1', '-framerate', String(FPS), '-i', mask] : [];
  const aIdx = P.bar === 'ffmpeg' ? 3 : 1;
  const vf = P.bar === 'ffmpeg'
    ? ['-filter_complex', `[0:v]format=rgba[base];[1:v]format=rgba,crop=${bw}:${bh}:x='${bw}-${bw}*min(t/${DUR}\\,1)':y=0[bar];[2:v]format=rgba[m];[base][bar]overlay=${bx}:${by}:shortest=1[v1];[v1][m]overlay=${bx}:${by}:shortest=1,format=yuv420p[v]`, '-map', '[v]']
    : ['-vf', 'format=yuv420p', '-map', '0:v'];
  const outFile = path.join(out, 'reel.mp4');
  const ffArgs = ['-hide_banner', '-loglevel', 'error', '-y', ...inArgs, ...barIn, '-i', wav, ...vf, '-map', `${aIdx}:a`,
    '-c:v', 'libx264', '-preset', P.preset, '-crf', String(P.crf), '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-g', String(FPS * 2),
    '-c:a', 'aac', '-b:a', '128k', '-t', String(DUR), '-movflags', '+faststart', outFile];

  let ff, ffDone;
  if (P.pipe) { ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] }); ffDone = new Promise((r) => ff.on('close', r)); }
  else fs.mkdirSync(framesDir, { recursive: true });

  // ① 순서 보장: 전송은 한 번에 하나씩(lock), 보낸 순서를 기록해 마지막에 검증
  const shot = P.fmt === 'jpeg' ? { type: 'jpeg', quality: 95 } : { type: 'png' };
  const buf = new Map(), written = []; let next = 0, lock = Promise.resolve();
  const flushNow = async () => {
    while (next < N && buf.has(owner[next])) {
      const b = buf.get(owner[next]);
      if (P.pipe) { if (!ff.stdin.write(b)) await new Promise((r) => ff.stdin.once('drain', r)); }
      else fs.writeFileSync(path.join(framesDir, String(next).padStart(5, '0') + '.' + ext), b);
      if (owner[next + 1] !== owner[next]) buf.delete(owner[next]);
      written.push(owner[next]); next++;
    }
  };
  const flush = () => (lock = lock.then(flushNow));
  let cursor = 0;
  await Promise.all(pages.map(async (p) => {
    for (;;) {
      const k = cursor++; if (k >= uniq.length) break;
      const i = uniq[k];
      await p.evaluate((t) => setT(t), i / FPS);
      buf.set(i, await p.screenshot(shot));
      await flush();
    }
  }));
  await flush();
  ms.render = Date.now() - t0;
  await browser.close();
  if (P.pipe) { ff.stdin.end(); const c = await ffDone; if (c) throw new Error('ffmpeg 실패 ' + c); }
  else await run('ffmpeg', ffArgs);
  ms.total = Date.now() - t0;

  const orderOk = written.length === N && written.every((o, i) => o === owner[i]);
  const meta = { spec: spec.id, profile, ...P, pages: PAGES, quietChrome, duration: DUR, frames: N, rendered: uniq.length, orderOk,
    width: Math.round(1080 * SCALE), height: Math.round(1920 * SCALE), toneStarts, ms, size: fs.statSync(outFile).size,
    tempDiskBytes: P.pipe ? 0 : fs.readdirSync(framesDir).reduce((s, f) => s + fs.statSync(path.join(framesDir, f)).size, 0), env: envInfo() };
  fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify(meta, null, 1));
  fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify({ area, checks }, null, 1));
  if (!orderOk) throw new Error('프레임 순서 불일치 — 결과물을 쓰지 마세요');
  return meta;
}
