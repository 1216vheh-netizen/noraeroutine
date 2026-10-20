// 노래루틴 릴스 2차 테스트: 프레임 단위(30fps) 렌더링. 값은 design/tokens.json에서 읽고,
// 캡션은 CAPTION(기본 32px, 적용안)으로 둔다.
import { chromium } from '../dtcg_tools/node_modules/playwright-core/index.mjs';
import fs from 'node:fs';
import path from 'node:path';

const HERE = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(HERE, 'reel2');
const FR = path.join(OUT, 'frames');
fs.mkdirSync(FR, { recursive: true });
const TK = JSON.parse(fs.readFileSync('/home/user/noraeroutine/design/tokens.json', 'utf8'));
const v = (t) => t.$value, hex = (t) => t.$value.hex;
const W = TK.color.warm, TY = TK.sns.type, R = TK.format.reelsCover;
const CAP = Number(process.env.CAPTION || 32);
const FPS = 30, DUR = 30;
const top = v(R.safeTop), ml = v(R.marginLeft), tw = v(R.textWidth), bottom = v(R.height) - v(R.safeBottom);
const font = ['Medium:500', 'Bold:700', 'ExtraBold:800'].map((s) => { const [n, w] = s.split(':');
  return `@font-face{font-family:Pretendard;font-weight:${w};src:url("file://${HERE}/fonts/Pretendard-${n}.otf")}`; }).join('');
const mic = `<svg width="22" height="26" viewBox="0 0 22 26"><rect x="6" y="1" width="10" height="15" rx="5" fill="${hex(W.accent)}"/><path d="M2 12a9 9 0 0 0 18 0M11 21v4" stroke="${hex(W.accent)}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;

// 장면: [시작, 끝]. 요소의 data-in은 등장 시각(초), data-fx는 효과
const html = `<!doctype html><html><head><meta charset="utf-8"><style>${font}
:root{--bg:${hex(W.bg)};--text:${hex(W.text)};--surface:${hex(W.surface)};--accent:${hex(W.accent)};--muted:${hex(W.muted)}}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden;background:var(--bg);color:var(--text);font-family:Pretendard,sans-serif;font-weight:500;word-break:keep-all}
.abs{position:absolute}.scene{position:absolute;inset:0;opacity:0}
.zone{position:absolute;left:${ml}px;top:${top}px;width:${tw}px;height:${bottom - top}px;display:flex;flex-direction:column;justify-content:center}
.t104{font:800 ${v(TY.title.sizeMax)}px/${v(TY.title.lineHeight)} Pretendard;letter-spacing:${v(TY.title.letterSpacingPercent) / 100}em}
.t88{font:800 ${v(TY.title.sizeMin)}px/${v(TY.title.lineHeight)} Pretendard;letter-spacing:${v(TY.title.letterSpacingPercent) / 100}em}
.b40{font-size:${v(TY.body.sizeMax)}px;line-height:${v(TY.body.lineHeight)}}
.cap{font-size:${CAP}px;line-height:${v(TY.caption.lineHeight)};color:var(--muted);font-weight:700}
.pill{display:inline-block;border-radius:${v(TK.radius.pill).value}px;background:var(--surface);color:var(--accent);font-weight:800;font-size:${CAP}px;padding:10px 26px;line-height:1.4}
.box{background:#fff;border-radius:${v(TK.radius.card).value}px;padding:26px 32px;font-weight:700}
.hl{background:linear-gradient(var(--surface),var(--surface)) no-repeat 0 82%/0% 46%}
.dot{position:absolute;width:64px;height:64px;border-radius:50%;background:#fff;border:6px solid var(--surface)}
</style></head><body>
<div class="abs" style="left:${ml}px;top:${top}px;width:${tw}px;height:8px;border-radius:8px;background:var(--surface)"><div id="bar" style="height:8px;width:0;border-radius:8px;background:var(--accent)"></div></div>
<div class="abs" style="left:${ml}px;top:${top + 34}px;width:${tw}px;display:flex;justify-content:space-between;align-items:center">
  <span data-check="brand" class="cap" style="display:flex;gap:12px;align-items:center;color:var(--accent);font-weight:800">${mic}노래루틴</span>
  <span data-check="ep" class="pill" style="background:#fff;color:var(--muted)">EP.01</span></div>

<div class="scene" data-s="0" data-e="2"><div class="zone">
  <div data-check="hook" class="t104" data-in="0.10" data-fx="up">고음만 가면<br>목이 <span class="hl" data-in="0.55" data-fx="hl">꽉 조이나요?</span></div>
</div></div>

<div class="scene" data-s="2" data-e="8"><div class="zone">
  <div data-check="s2t" class="t88" data-in="2.20" data-fx="up">이런 느낌,<br>익숙하죠?</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:56px">
    <div data-check="s2a" class="box b40" data-in="3.00" data-fx="left"><span style="color:var(--accent)">✕</span> 목에 힘이 꽉 들어가요</div>
    <div data-check="s2b" class="box b40" data-in="3.90" data-fx="left"><span style="color:var(--accent)">✕</span> 소리가 얇고 좁아져요</div>
    <div data-check="s2c" class="box b40" data-in="4.80" data-fx="left"><span style="color:var(--accent)">✕</span> 몇 곡만 불러도 목이 아파요</div>
  </div></div></div>

<div class="scene" data-s="8" data-e="15"><div class="zone" style="flex-direction:row;align-items:center;gap:44px">
  <div data-check="n1" data-in="8.15" data-fx="pop" style="font:800 220px/1 Pretendard;color:var(--accent);letter-spacing:-0.03em">1</div>
  <div style="flex:1">
    <span data-check="s3p" class="pill" data-in="8.30" data-fx="up">STEP 1</span>
    <div data-check="s3t" class="t88" data-in="8.45" data-fx="up" style="margin-top:28px">하품하듯<br>입 안을<br><span class="hl" data-in="9.10" data-fx="hl">넓혀요</span></div>
    <div data-check="s3s" class="b40" data-in="9.60" data-fx="up" style="margin-top:32px;color:var(--muted)">턱은 툭, 혀끝은<br>아랫니 뒤에</div>
  </div></div></div>

<div class="scene" data-s="15" data-e="22"><div class="zone" style="justify-content:flex-start;padding-top:170px">
  <span data-check="s4p" class="pill" data-in="15.20" data-fx="up" style="align-self:flex-start">STEP 2</span>
  <div data-check="s4t" class="t88" data-in="15.35" data-fx="up" style="margin-top:28px">'우' 모음으로<br>낮은 음부터 한 계단씩</div>
  <div data-check="ladder" style="position:relative;height:330px;margin-top:40px">
    ${[0, 1, 2, 3, 4].map((i) => `<div class="dot" data-dot="${i}" data-in="${(16.2 + i * 0.6).toFixed(2)}" style="left:${i * 190}px;top:${250 - i * 62}px"></div>`).join('')}
  </div>
  <div data-check="oops" class="box b40" data-in="19.60" data-fx="wobble" style="background:var(--surface);align-self:flex-start;transform-origin:left center;margin-left:8px">앗, 삐끗! 한 음 내려서 다시 해요</div>
</div></div>

<div class="scene" data-s="22" data-e="27"><div class="zone">
  <div data-check="s5t" class="t88" data-in="22.20" data-fx="up">힘을 빼니까<br>이렇게 달라졌어요</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:52px">
    <div data-check="s5a" class="box b40" data-in="22.90" data-fx="left"><span class="cap" style="margin-right:18px">전</span>꽉 조인 얇은 소리</div>
    <div data-check="s5b" class="box b40" data-in="23.70" data-fx="left" style="border:4px solid var(--accent)"><span class="cap" style="margin-right:18px;color:var(--accent)">후</span>편하게 열린 소리</div>
  </div>
  <div data-check="s5c" class="cap" data-in="24.40" data-fx="up" style="margin-top:36px">목이 아프면 바로 쉬어 주세요</div>
</div></div>

<div class="scene" data-s="27" data-e="30"><div class="zone">
  <div data-check="ask" data-in="27.10" data-fx="pop" style="background:var(--surface);border-radius:40px;padding:56px 52px;position:relative">
    <div class="t88">여러분은 어느 음부터<br>조이기 시작하세요?</div>
    <div class="abs" style="left:90px;bottom:-34px;width:0;height:0;border-left:34px solid transparent;border-right:34px solid transparent;border-top:36px solid var(--surface)"></div>
  </div>
  <div data-check="askc" data-in="27.60" data-fx="up" style="margin-top:72px;font:800 44px/1.4 Pretendard;color:var(--accent)">댓글로 알려 주세요 ↓</div>
</div></div>

<script>
const XF=0.3, ease=(x)=>1-Math.pow(1-Math.min(Math.max(x,0),1),3);
window.setT=(t)=>{
  document.getElementById('bar').style.width=(Math.min(t/30,1)*100)+'%';
  for(const s of document.querySelectorAll('.scene')){
    const a=+s.dataset.s,b=+s.dataset.e;
    let o=0; if(t>=a-XF/2&&t<b+XF/2){o=1; if(a>0&&t<a+XF/2)o=(t-(a-XF/2))/XF; if(b<30&&t>b-XF/2)o=Math.min(o,((b+XF/2)-t)/XF);}
    s.style.opacity=Math.max(0,Math.min(1,o));
  }
  for(const el of document.querySelectorAll('[data-in]')){
    const p=(t-(+el.dataset.in))/0.35, e=ease(p), fx=el.dataset.fx;
    if(fx==='hl'){el.style.backgroundSize=(ease((t-(+el.dataset.in))/0.4)*100)+'% 46%';continue;}
    el.style.opacity=p<=0?0:Math.min(1,p*1.6);
    if(fx==='up')el.style.transform='translateY('+((1-e)*28)+'px)';
    if(fx==='left')el.style.transform='translateX('+((1-e)*-40)+'px)';
    if(fx==='pop')el.style.transform='scale('+(0.9+0.1*e)+')';
    if(fx==='wobble'){const q=Math.max(0,t-(+el.dataset.in));el.style.transform='rotate('+(-2+ (q<0.6?Math.sin(q*30)*2*(1-q/0.6):0))+'deg)';}
  }
  for(const d of document.querySelectorAll('[data-dot]')){
    const on=t>=+d.dataset.in, slip=(+d.dataset.dot===4)&&t>=19.0&&t<20.4;
    d.style.background=on?(slip?'#fff':getComputedStyle(document.documentElement).getPropertyValue('--accent')):'#fff';
    d.style.borderColor=slip?getComputedStyle(document.documentElement).getPropertyValue('--muted'):getComputedStyle(document.documentElement).getPropertyValue('--surface');
  }
};
window.measure=(area)=>[...document.querySelectorAll('[data-check]')].filter(el=>{let n=el;while(n&&!n.classList?.contains('scene'))n=n.parentElement;return !n||+n.style.opacity>0.99}).map(el=>{const r=el.getBoundingClientRect();
  const fs=Math.min(...[el,...el.querySelectorAll('*')].filter(x=>x.childNodes.length&&[...x.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())).map(x=>parseFloat(getComputedStyle(x).fontSize)).concat([999]));
  return {id:el.dataset.check,box:[r.left,r.top,r.right,r.bottom].map(Math.round),minFont:fs,inside:r.left>=area.x0-0.5&&r.right<=area.x1+0.5&&r.top>=area.y0-0.5&&r.bottom<=area.y1+0.5,opacity:+getComputedStyle(el).opacity}});
</script></body></html>`;

const hf = path.join(OUT, 'reel2.html'); fs.writeFileSync(hf, html);
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.goto('file://' + hf);
await page.evaluate(async () => { await Promise.all([...document.fonts].map((f) => f.load())); await document.fonts.ready; });
const ok = await page.evaluate(() => ['500', '700', '800'].every((w) => [...document.fonts].some((f) => f.family.replace(/"/g, '') === 'Pretendard' && String(f.weight) === w && f.status === 'loaded')));
if (!ok) throw new Error('Pretendard 미로드');
const area = { x0: ml, y0: top, x1: ml + tw, y1: bottom };
const checks = {};
for (const t of [0.5, 1.9, 7.5, 14.5, 21.5, 26.5, 29.5]) { await page.evaluate((t) => setT(t), t); checks[t] = await page.evaluate((a) => measure(a), area); }
const n = FPS * DUR;
for (let i = 0; i < n; i++) {
  await page.evaluate((t) => setT(t), i / FPS);
  await page.screenshot({ path: path.join(FR, String(i).padStart(4, '0') + '.png') });
}
await browser.close();
fs.writeFileSync(path.join(OUT, 'measure.json'), JSON.stringify({ caption: CAP, area, checks }, null, 1));
console.log('frames', n);
