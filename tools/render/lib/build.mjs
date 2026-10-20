// 노래루틴 릴스 HTML 조립기 (제작 시스템 v2).
// CSS·공통 머리(진행 막대, 브랜드, 회차)·애니메이션 규칙은 2차 릴스(backup_v1/reel_v2_30s.mjs)와 같다.
// v1과 달라진 점: 영상 길이(DUR)와 음 계단 '삐끗' 구간이 30초·19.0~20.4초로 고정되어 있던 것을 장면 정의에서 받는다.
import fs from 'node:fs';
import { tokensPath } from './env.mjs';

export function loadTokens(p = tokensPath()) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function layout(TK) {
  const v = (t) => t.$value, R = TK.format.reelsCover;
  const top = v(R.safeTop), ml = v(R.marginLeft), tw = v(R.textWidth), bottom = v(R.height) - v(R.safeBottom);
  return { top, ml, tw, bottom, barH: 8, area: { x0: ml, y0: top, x1: ml + tw, y1: bottom } };
}

// 장면 정의에서 쓰는 조각 (2차 마크업과 같은 모양)
export const parts = {
  ladder: (start, { slip = null, step = 0.6 } = {}) => `<div data-check="ladder" style="position:relative;height:330px;margin-top:40px">
    ${[0, 1, 2, 3, 4].map((i) => `<div class="dot" data-dot="${i}" data-in="${(start + i * step).toFixed(2)}"${slip && i === 4 ? ` data-slip-s="${slip[0]}" data-slip-e="${slip[1]}"` : ''} style="left:${i * 190}px;top:${250 - i * 62}px"></div>`).join('')}
  </div>`,
};

export function buildHtml(spec, { fontsDir, captionPx, TK }) {
  const v = (t) => t.$value, hex = (t) => t.$value.hex;
  const W = TK.color.warm, TY = TK.sns.type;
  const CAP = captionPx ?? v(TY.caption.sizeMin);
  const { top, ml, tw, bottom } = layout(TK);
  const DUR = spec.duration;
  const font = ['Medium:500', 'Bold:700', 'ExtraBold:800'].map((s) => { const [n, w] = s.split(':');
    return `@font-face{font-family:Pretendard;font-weight:${w};src:url("file://${fontsDir}/Pretendard-${n}.otf")}`; }).join('');
  const mic = `<svg width="22" height="26" viewBox="0 0 22 26"><rect x="6" y="1" width="10" height="15" rx="5" fill="${hex(W.accent)}"/><path d="M2 12a9 9 0 0 0 18 0M11 21v4" stroke="${hex(W.accent)}" stroke-width="2.4" fill="none" stroke-linecap="round"/></svg>`;
  const scenes = spec.scenes.map((s) => `<div class="scene" data-s="${s.s}" data-e="${s.e}">${s.html}</div>`).join('\n\n');
  return `<!doctype html><html><head><meta charset="utf-8"><style>${font}
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
</style></head><body data-dur="${DUR}">
<div class="abs" style="left:${ml}px;top:${top}px;width:${tw}px;height:8px;border-radius:8px;background:var(--surface)"><div id="bar" style="height:8px;width:0;border-radius:8px;background:var(--accent)"></div></div>
<div class="abs" style="left:${ml}px;top:${top + 34}px;width:${tw}px;display:flex;justify-content:space-between;align-items:center">
  <span data-check="brand" class="cap" style="display:flex;gap:12px;align-items:center;color:var(--accent);font-weight:800">${mic}노래루틴</span>
  <span data-check="ep" class="pill" style="background:#fff;color:var(--muted)">${spec.episode}</span></div>

${scenes}

<script>
const XF=0.3, DUR=${DUR}, ease=(x)=>1-Math.pow(1-Math.min(Math.max(x,0),1),3);
window.setT=(t)=>{
  document.getElementById('bar').style.width=(Math.min(t/DUR,1)*100)+'%';
  for(const s of document.querySelectorAll('.scene')){
    const a=+s.dataset.s,b=+s.dataset.e;
    let o=0; if(t>=a-XF/2&&t<b+XF/2){o=1; if(a>0&&t<a+XF/2)o=(t-(a-XF/2))/XF; if(b<DUR&&t>b-XF/2)o=Math.min(o,((b+XF/2)-t)/XF);}
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
    const on=t>=+d.dataset.in, slip=d.dataset.slipS!==undefined&&t>=+d.dataset.slipS&&t<+d.dataset.slipE;
    d.style.background=on?(slip?'#fff':getComputedStyle(document.documentElement).getPropertyValue('--accent')):'#fff';
    d.style.borderColor=slip?getComputedStyle(document.documentElement).getPropertyValue('--muted'):getComputedStyle(document.documentElement).getPropertyValue('--surface');
  }
};
window.measure=(area)=>[...document.querySelectorAll('[data-check]')].filter(el=>{let n=el;while(n&&!n.classList?.contains('scene'))n=n.parentElement;return !n||+n.style.opacity>0.99}).map(el=>{const r=el.getBoundingClientRect();
  const fs=Math.min(...[el,...el.querySelectorAll('*')].filter(x=>x.childNodes.length&&[...x.childNodes].some(c=>c.nodeType===3&&c.textContent.trim())).map(x=>parseFloat(getComputedStyle(x).fontSize)).concat([999]));
  return {id:el.dataset.check,box:[r.left,r.top,r.right,r.bottom].map(Math.round),minFont:fs,inside:r.left>=area.x0-0.5&&r.right<=area.x1+0.5&&r.top>=area.y0-0.5&&r.bottom<=area.y1+0.5,opacity:+getComputedStyle(el).opacity}});
</script></body></html>`;
}
