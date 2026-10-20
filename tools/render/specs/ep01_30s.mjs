// EP.01 기본편 30초. 2차 릴스(backup_v1/reel_v2_30s.mjs)의 장면을 그대로 옮긴 회귀 검증용 정의.
import { parts } from '../lib/build.mjs';

export default {
  id: 'ep01_30s', episode: 'EP.01', duration: 30, lengthClass: '기본편',
  scenes: [
    { s: 0, e: 2, html: `<div class="zone">
  <div data-check="hook" class="t104" data-in="0.10" data-fx="up">고음만 가면<br>목이 <span class="hl" data-in="0.55" data-fx="hl">꽉 조이나요?</span></div>
</div>` },
    { s: 2, e: 8, html: `<div class="zone">
  <div data-check="s2t" class="t88" data-in="2.20" data-fx="up">이런 느낌,<br>익숙하죠?</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:56px">
    <div data-check="s2a" class="box b40" data-in="3.00" data-fx="left"><span style="color:var(--accent)">✕</span> 목에 힘이 꽉 들어가요</div>
    <div data-check="s2b" class="box b40" data-in="3.90" data-fx="left"><span style="color:var(--accent)">✕</span> 소리가 얇고 좁아져요</div>
    <div data-check="s2c" class="box b40" data-in="4.80" data-fx="left"><span style="color:var(--accent)">✕</span> 몇 곡만 불러도 목이 아파요</div>
  </div></div>` },
    { s: 8, e: 15, html: `<div class="zone" style="flex-direction:row;align-items:center;gap:44px">
  <div data-check="n1" data-in="8.15" data-fx="pop" style="font:800 220px/1 Pretendard;color:var(--accent);letter-spacing:-0.03em">1</div>
  <div style="flex:1">
    <span data-check="s3p" class="pill" data-in="8.30" data-fx="up">STEP 1</span>
    <div data-check="s3t" class="t88" data-in="8.45" data-fx="up" style="margin-top:28px">하품하듯<br>입 안을<br><span class="hl" data-in="9.10" data-fx="hl">넓혀요</span></div>
    <div data-check="s3s" class="b40" data-in="9.60" data-fx="up" style="margin-top:32px;color:var(--muted)">턱은 툭, 혀끝은<br>아랫니 뒤에</div>
  </div></div>` },
    { s: 15, e: 22, html: `<div class="zone" style="justify-content:flex-start;padding-top:170px">
  <span data-check="s4p" class="pill" data-in="15.20" data-fx="up" style="align-self:flex-start">STEP 2</span>
  <div data-check="s4t" class="t88" data-in="15.35" data-fx="up" style="margin-top:28px">'우' 모음으로<br>낮은 음부터 한 계단씩</div>
  ${parts.ladder(16.2, { slip: [19.0, 20.4] })}
  <div data-check="oops" class="box b40" data-in="19.60" data-fx="wobble" style="background:var(--surface);align-self:flex-start;transform-origin:left center;margin-left:8px">앗, 삐끗! 한 음 내려서 다시 해요</div>
</div>` },
    { s: 22, e: 27, html: `<div class="zone">
  <div data-check="s5t" class="t88" data-in="22.20" data-fx="up">힘을 빼니까<br>이렇게 달라졌어요</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:52px">
    <div data-check="s5a" class="box b40" data-in="22.90" data-fx="left"><span class="cap" style="margin-right:18px">전</span>꽉 조인 얇은 소리</div>
    <div data-check="s5b" class="box b40" data-in="23.70" data-fx="left" style="border:4px solid var(--accent)"><span class="cap" style="margin-right:18px;color:var(--accent)">후</span>편하게 열린 소리</div>
  </div>
  <div data-check="s5c" class="cap" data-in="24.40" data-fx="up" style="margin-top:36px">목이 아프면 바로 쉬어 주세요</div>
</div>` },
    { s: 27, e: 30, html: `<div class="zone">
  <div data-check="ask" data-in="27.10" data-fx="pop" style="background:var(--surface);border-radius:40px;padding:56px 52px;position:relative">
    <div class="t88">여러분은 어느 음부터<br>조이기 시작하세요?</div>
    <div class="abs" style="left:90px;bottom:-34px;width:0;height:0;border-left:34px solid transparent;border-right:34px solid transparent;border-top:36px solid var(--surface)"></div>
  </div>
  <div data-check="askc" data-in="27.60" data-fx="up" style="margin-top:72px;font:800 44px/1.4 Pretendard;color:var(--accent)">댓글로 알려 주세요 ↓</div>
</div>` },
  ],
};
