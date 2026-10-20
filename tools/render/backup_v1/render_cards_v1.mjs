// 노래루틴 테스트 렌더러: design/tokens.json 값을 그대로 CSS 변수로 옮겨 HTML을 PNG로 출력하고,
// 안전 영역·최소 글자 크기·넘침을 측정한다.
import { chromium } from '../dtcg_tools/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const TOKENS = JSON.parse(fs.readFileSync('/home/user/noraeroutine/design/tokens.json', 'utf8'));
const OUT = process.env.OUT || path.join(HERE, 'out');
fs.mkdirSync(OUT, { recursive: true });

const hex = (t) => t.$value.hex;
const C = {
  bg: hex(TOKENS.color.warm.bg), text: hex(TOKENS.color.warm.text), surface: hex(TOKENS.color.warm.surface),
  accent: hex(TOKENS.color.warm.accent), muted: hex(TOKENS.color.warm.muted),
  navy: hex(TOKENS.color.night.label), ivory: hex(TOKENS.color.night.labelText),
};
const F = TOKENS.format, T = TOKENS.sns.type, R = TOKENS.radius;
const v = (t) => t.$value;
const CAP = process.env.CAPTION ? Number(process.env.CAPTION) : null;
const fontFaces = ['Medium:500', 'Bold:700', 'ExtraBold:800'].map((s) => {
  const [name, w] = s.split(':');
  return `@font-face{font-family:Pretendard;font-weight:${w};src:url("file://${HERE}/fonts/Pretendard-${name}.otf");}`;
}).join('\n');

const base = (w, h) => `
${fontFaces}
:root{--bg:${C.bg};--text:${C.text};--surface:${C.surface};--accent:${C.accent};--muted:${C.muted};--navy:${C.navy};--ivory:${C.ivory};
--r-card:${v(R.card).value}px;--r-pill:${v(R.pill).value}px;}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:${w}px;height:${h}px;overflow:hidden;background:var(--bg);color:var(--text);
font-family:Pretendard,"Noto Sans KR",sans-serif;font-weight:500;-webkit-font-smoothing:antialiased;word-break:keep-all}
.abs{position:absolute}
.brand{display:flex;align-items:center;gap:14px;font-weight:800;font-size:${(CAP ?? v(T.caption.sizeMin))}px;color:var(--accent)}
.brand .dot{width:44px;height:44px;border-radius:50%;background:var(--surface);display:flex;align-items:center;justify-content:center}
.pill{display:inline-block;border-radius:var(--r-pill);background:var(--surface);color:var(--accent);font-weight:800;
font-size:${(CAP ?? v(T.caption.sizeMin))}px;padding:10px 24px;line-height:1.4}
.mark{background:linear-gradient(transparent 58%, var(--surface) 58%)}
.guide{position:absolute;border:3px dashed #2B6CB0;pointer-events:none}
.guide.ban{background:rgba(220,38,38,.18);border-color:#DC2626}
.guide span{position:absolute;left:8px;top:6px;font:700 22px Pretendard;color:#1E3A8A;background:rgba(255,255,255,.85);padding:2px 8px}
`;
const mic = `<svg width="22" height="26" viewBox="0 0 22 26"><rect x="6" y="1" width="10" height="15" rx="5" fill="${C.accent}"/><path d="M2 12a9 9 0 0 0 18 0M11 21v4" stroke="${C.accent}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;

// ---------- 카드뉴스 C2 (1080×1350) ----------
function cardC2(guide) {
  const c = F.card, W = v(c.width), H = v(c.height), mx = v(c.marginX), my = v(c.marginY);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${base(W, H)}
.title{font-weight:800;font-size:${v(T.title.sizeMax)}px;line-height:${v(T.title.lineHeight)};letter-spacing:${v(T.title.letterSpacingPercent)/100}em}
.body{font-size:${v(T.body.sizeMax)}px;line-height:${v(T.body.lineHeight)};color:var(--muted)}
.cap{font-size:${(CAP ?? v(T.caption.sizeMin))}px;color:var(--muted);font-weight:700}
</style></head><body>
<div class="abs" style="right:-120px;top:-120px;width:420px;height:420px;border-radius:50%;background:var(--surface)"></div>
<div data-check="brand" class="abs brand" style="left:${mx}px;top:${my}px"><span class="dot">${mic}</span>노래루틴</div>
<div data-check="page" class="abs pill" style="right:${mx}px;top:${my}px;background:#fff;color:var(--muted)">2 / 6</div>
<div class="abs" style="left:${mx}px;top:420px;width:${v(c.contentWidth)}px">
  <div data-check="title" data-min="${v(T.title.sizeMin)}" class="title">고음은 세게 내는 게<br>아니라 <span class="mark">편하게</span><br>내는 거예요</div>
  <div data-check="body" data-min="${v(T.body.sizeFloor)}" class="body" style="margin-top:56px">목에 힘이 들어가면<br>소리는 오히려 좁아져요.</div>
</div>
<div data-check="account" data-min="${(CAP ?? v(T.caption.sizeMin))}" class="abs cap" style="left:${mx}px;bottom:${my}px">@noraeroutine</div>
${guide ? `<div class="guide" style="left:${mx}px;top:${my}px;width:${v(c.contentWidth)}px;height:${v(c.contentHeight)}px"><span>콘텐츠 영역 920×1158</span></div>` : ''}
</body></html>`;
}

// ---------- 인스타 스토리 (1080×1920) ----------
function story(guide) {
  const s = F.story, W = v(s.width), H = v(s.height), mx = v(s.marginX);
  const iy0 = v(s.infoStartY), iy1 = v(s.infoEndY), sy0 = v(s.stickerStartY), sy1 = v(s.stickerEndY);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${base(W, H)}
.title{font-weight:800;font-size:${v(T.title.sizeMin)}px;line-height:${v(T.title.lineHeight)};letter-spacing:${v(T.title.letterSpacingPercent)/100}em}
.step{display:flex;gap:20px;align-items:flex-start;font-size:${v(T.body.sizeMax)}px;line-height:${v(T.body.lineHeight)}}
.step b{flex:none;width:56px;height:56px;border-radius:50%;background:var(--surface);color:var(--accent);font-weight:800;font-size:30px;display:flex;align-items:center;justify-content:center;margin-top:2px}
</style></head><body>
<div class="abs" style="left:-140px;bottom:-140px;width:460px;height:460px;border-radius:50%;background:var(--surface)"></div>
<div class="abs" style="left:${mx}px;top:${iy0}px;width:${v(s.contentWidth)}px;height:${iy1 - iy0}px">
  <div style="display:flex;justify-content:space-between;align-items:center">
    <span data-check="label" class="pill">발성 기초</span>
    <span data-check="brand" class="brand"><span class="dot">${mic}</span>노래루틴</span>
  </div>
  <div data-check="title" data-min="${v(T.title.sizeMin)}" class="title" style="margin-top:44px">목 조임 풀기<br><span class="mark">5분 루틴</span></div>
  <div style="margin-top:48px;display:flex;flex-direction:column;gap:26px">
    <div data-check="step1" data-min="${v(T.body.sizeFloor)}" class="step"><b>1</b><span>하품하듯 입 안을 넓혀요</span></div>
    <div data-check="step2" data-min="${v(T.body.sizeFloor)}" class="step"><b>2</b><span>'우' 모음으로 낮은 음부터</span></div>
    <div data-check="step3" data-min="${v(T.body.sizeFloor)}" class="step"><b>3</b><span>조이면 한 음 내려서 다시</span></div>
  </div>
</div>
${guide ? `
<div class="guide ban" style="left:0;top:0;width:${W}px;height:${v(s.safeTop)}px"><span>위 금지 구역 250 [임시 기준]</span></div>
<div class="guide ban" style="left:0;bottom:0;width:${W}px;height:${v(s.safeBottom)}px"><span>아래 금지 구역 340 [임시 기준]</span></div>
<div class="guide" style="left:${mx}px;top:${iy0}px;width:${v(s.contentWidth)}px;height:${iy1 - iy0}px"><span>정보 영역 250~1060</span></div>
<div class="guide" style="left:${mx}px;top:${sy0}px;width:${v(s.contentWidth)}px;height:${sy1 - sy0}px;border-color:#9E4561"><span style="color:#9E4561">스티커 공간 920×480 (비워 둠)</span></div>` : ''}
</body></html>`;
}

// ---------- 릴스 30초 장면 (1080×1920) ----------
const scenes = [
  { id: 's1', t: [0, 2], label: '', big: '고음만 가면<br>목이 <span class="mark">조이나요?</span>', small: '' },
  { id: 's2', t: [2, 8], label: '오늘의 고민', big: '높은 음에서<br>목에 힘이 들어가요', small: '소리가 좁아지고 금방 지쳐요' },
  { id: 's3', t: [8, 15], label: 'STEP 1', big: '하품하듯<br>입 안을 <span class="mark">넓혀요</span>', small: '턱은 편하게, 혀는 아래로' },
  { id: 's4', t: [15, 22], label: 'STEP 2', big: "'우' 모음으로<br>낮은 음부터 천천히", small: '삐끗해도 괜찮아요. 한 음 내려서 다시' },
  { id: 's5', t: [22, 27], label: '조금 나아졌어요', big: '힘을 빼니까<br>소리가 <span class="mark">편해졌어요</span>', small: '목이 아프면 바로 쉬어 주세요' },
  { id: 's6', t: [27, 30], label: '', big: '여러분은 어디서<br>제일 조이세요?', small: '댓글로 알려 주세요', bubble: true },
];
function reelScene(sc, guide) {
  const r = F.reelsCover, W = v(r.width), H = v(r.height), ml = v(r.marginLeft), tw = v(r.textWidth);
  const top = v(r.safeTop), bottomLimit = H - v(r.safeBottom);
  return `<!doctype html><html><head><meta charset="utf-8"><style>${base(W, H)}
.big{font-weight:800;font-size:${v(T.title.sizeMax)}px;line-height:${v(T.title.lineHeight)};letter-spacing:${v(T.title.letterSpacingPercent)/100}em}
.small{font-size:${v(T.body.sizeMax)}px;line-height:${v(T.body.lineHeight)};color:var(--muted);margin-top:40px}
.bubble{background:var(--surface);border-radius:var(--r-card);padding:28px 36px;color:var(--text);font-weight:700;display:inline-block}
</style></head><body>
<div class="abs" style="right:-160px;top:${top + 80}px;width:420px;height:420px;border-radius:50%;background:var(--surface)"></div>
<div class="abs" style="left:${ml}px;top:${top + 20}px;width:${tw}px;display:flex;justify-content:space-between">
  <span data-check="brand" class="brand"><span class="dot">${mic}</span>노래루틴</span>
  <span data-check="ep" class="pill" style="background:#fff;color:var(--muted)">EP.01</span>
</div>
<div class="abs" style="left:${ml}px;top:0;height:${H}px;width:${tw}px;display:flex;flex-direction:column;justify-content:center;padding-top:${top}px;padding-bottom:${v(r.safeBottom)}px">
  ${sc.label ? `<span data-check="label" class="pill" style="align-self:flex-start;margin-bottom:36px">${sc.label}</span>` : ''}
  <div data-check="big" data-min="${v(T.title.sizeMin)}" class="big">${sc.big}</div>
  ${sc.small ? `<div data-check="small" data-min="${v(T.body.sizeFloor)}" class="small ${sc.bubble ? 'bubble' : ''}">${sc.small}</div>` : ''}
</div>
${guide ? `
<div class="guide ban" style="left:0;top:0;width:${W}px;height:${top}px"><span>위 금지 250 [확인 필요]</span></div>
<div class="guide ban" style="left:0;bottom:0;width:${W}px;height:${v(r.safeBottom)}px"><span>아래 금지 420 [확인 필요]</span></div>
<div class="guide ban" style="right:0;top:0;width:${v(r.safeRight)}px;height:${H}px"><span>140</span></div>
<div class="guide" style="left:0;top:${v(r.gridVisibleStartY)}px;width:${W}px;height:${v(r.gridVisibleEndY) - v(r.gridVisibleStartY)}px;border-color:#059669"><span style="color:#065F46">격자 미리보기 240~1680</span></div>` : ''}
</body></html>`;
}

// 측정: data-check 요소가 안전 영역 안에 있는지, 최소 글자 크기, 넘침
async function measure(page, area) {
  return await page.evaluate((area) => {
    const out = [];
    for (const el of document.querySelectorAll('[data-check]')) {
      const r = el.getBoundingClientRect();
      const fs = parseFloat(getComputedStyle(el).fontSize);
      const min = el.dataset.min ? parseFloat(el.dataset.min) : null;
      const inside = r.left >= area.x0 - 0.5 && r.right <= area.x1 + 0.5 && r.top >= area.y0 - 0.5 && r.bottom <= area.y1 + 0.5;
      const overflow = el.scrollWidth > el.clientWidth + 1;
      out.push({ id: el.dataset.check, box: [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)], fontSize: fs, min, inside, overflow,
        fontOk: min == null || fs >= min, lines: Math.round(r.height / (fs * parseFloat(getComputedStyle(el).lineHeight === 'normal' ? 1.2 : parseFloat(getComputedStyle(el).lineHeight) / fs))) });
    }
    return out;
  }, area);
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const report = {};
async function shot(name, html, w, h, area) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  fs.mkdirSync(path.join(OUT, 'html'), { recursive: true });
  const hf = path.join(OUT, 'html', name + '.html'); fs.writeFileSync(hf, html);
  await page.goto('file://' + hf, { waitUntil: 'load' });
  await page.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load().catch(() => null))); await document.fonts.ready; });
  const fontsOk = await page.evaluate(() => [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.weight));
  const pret = await page.evaluate(() => ['500','700','800'].every((w) => [...document.fonts].some((f) => f.family.replace(/"/g,'') === 'Pretendard' && String(f.weight) === w && f.status === 'loaded')));
  if (!pret) throw new Error('Pretendard 미로드: ' + name);
  const file = path.join(OUT, name + '.png');
  await page.screenshot({ path: file });
  if (area) report[name] = { fontsLoaded: fontsOk, checks: await measure(page, area) };
  await page.close();
}
const c = F.card, s = F.story, r = F.reelsCover;
const cardArea = { x0: v(c.marginX), y0: v(c.marginY), x1: v(c.width) - v(c.marginX), y1: v(c.height) - v(c.marginY) };
const storyArea = { x0: v(s.marginX), y0: v(s.infoStartY), x1: v(s.width) - v(s.marginX), y1: v(s.infoEndY) };
const reelArea = { x0: v(r.marginLeft), y0: v(r.safeTop), x1: v(r.width) - v(r.safeRight), y1: v(r.height) - v(r.safeBottom) };
await shot('card_c2', cardC2(false), v(c.width), v(c.height), cardArea);
await shot('card_c2_guide', cardC2(true), v(c.width), v(c.height));
await shot('story', story(false), v(s.width), v(s.height), storyArea);
await shot('story_guide', story(true), v(s.width), v(s.height));
for (const sc of scenes) {
  await shot('reel_' + sc.id, reelScene(sc, false), v(r.width), v(r.height), reelArea);
  if (sc.id === 's4') await shot('reel_s4_guide', reelScene(sc, true), v(r.width), v(r.height));
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'measure.json'), JSON.stringify({ scenes: scenes.map((x) => ({ id: x.id, t: x.t })), report }, null, 2));
console.log('rendered', fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).length, 'png');
