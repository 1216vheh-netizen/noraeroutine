// EP.01 특별편 60초 — 문구 수정안 r2 (대표 검수 반영, 2026-10-20). 원본: ep01_special60.mjs
// 상태: STEP 3·다음 화 예고 = 대표 지시 문구 반영 / 55~60초 질문 하나로 정리(대표 승인) / STEP 3 발성 내용·'오늘 기억할 세 가지' 3번 = 보컬 선생님 검수 전 임시
// DESIGN_SYSTEM.md 6장 '특별편 60초 구성'을 따른다.
// 0~3초 후킹 / 3~15초 고민·목표 / 15~45초 함께 연습(실수 포함) / 45~55초 결과·깨달음 / 55~60초 질문형 마무리와 예고
// 화면 요소와 스타일은 30초 기본편(ep01_30s)과 같은 것만 쓴다.
import { parts } from '../lib/build.mjs';

export default {
  id: 'ep01_special60_r2', episode: 'EP.01', duration: 60, lengthClass: '특별편',
  review: {
    approved: ['오늘의 목표', '다시 도전'],
    revised: ['STEP 3 (대표 지시 문구)', '다음 화 예고 (대표 지시 문구)'],
    approvedLater: ['55~60초 질문 하나만 사용: "여러분은 어떤 고음이 가장 어려우세요?" (중복 질문 제거)'],
    pendingTeacherReview: ['STEP 3 발성 내용', '오늘 기억할 세 가지 — 3번 항목'],
  },
  segments: [[0, 3, '후킹'], [3, 15, '고민·목표'], [15, 45, '함께 연습(실수 포함)'], [45, 55, '결과·깨달음'], [55, 60, '질문형 마무리·예고']],
  scenes: [
    // 0~3초 후킹
    { s: 0, e: 3, html: `<div class="zone">
  <div data-check="hook" class="t104" data-in="0.10" data-fx="up">고음만 가면<br>목이 <span class="hl" data-in="0.55" data-fx="hl">꽉 조이나요?</span></div>
</div>` },
    // 3~15초 고민·목표
    { s: 3, e: 9, html: `<div class="zone">
  <div data-check="s2t" class="t88" data-in="3.20" data-fx="up">이런 느낌,<br>익숙하죠?</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:56px">
    <div data-check="s2a" class="box b40" data-in="4.00" data-fx="left"><span style="color:var(--accent)">✕</span> 목에 힘이 꽉 들어가요</div>
    <div data-check="s2b" class="box b40" data-in="4.90" data-fx="left"><span style="color:var(--accent)">✕</span> 소리가 얇고 좁아져요</div>
    <div data-check="s2c" class="box b40" data-in="5.80" data-fx="left"><span style="color:var(--accent)">✕</span> 몇 곡만 불러도 목이 아파요</div>
  </div></div>` },
    { s: 9, e: 15, html: `<div class="zone">
  <span data-check="goalp" class="pill" data-in="9.20" data-fx="up" style="align-self:flex-start">오늘의 목표</span>
  <div data-check="goalt" class="t88" data-in="9.40" data-fx="up" style="margin-top:28px">목에 힘 빼고<br><span class="hl" data-in="10.10" data-fx="hl">편하게</span> 한 계단 더</div>
  <div data-check="goals" class="b40" data-in="10.80" data-fx="up" style="margin-top:32px;color:var(--muted)">세 단계로 같이 연습해요</div>
</div>` },
    // 15~45초 함께 연습 (실수 포함)
    { s: 15, e: 23, html: `<div class="zone" style="flex-direction:row;align-items:center;gap:44px">
  <div data-check="n1" data-in="15.15" data-fx="pop" style="font:800 220px/1 Pretendard;color:var(--accent);letter-spacing:-0.03em">1</div>
  <div style="flex:1">
    <span data-check="s3p" class="pill" data-in="15.30" data-fx="up">STEP 1</span>
    <div data-check="s3t" class="t88" data-in="15.45" data-fx="up" style="margin-top:28px">하품하듯<br>입 안을<br><span class="hl" data-in="16.10" data-fx="hl">넓혀요</span></div>
    <div data-check="s3s" class="b40" data-in="16.60" data-fx="up" style="margin-top:32px;color:var(--muted)">턱은 툭, 혀끝은<br>아랫니 뒤에</div>
  </div></div>` },
    { s: 23, e: 31, html: `<div class="zone" style="justify-content:flex-start;padding-top:170px">
  <span data-check="s4p" class="pill" data-in="23.20" data-fx="up" style="align-self:flex-start">STEP 2</span>
  <div data-check="s4t" class="t88" data-in="23.35" data-fx="up" style="margin-top:28px">'우' 모음으로<br>낮은 음부터 한 계단씩</div>
  ${parts.ladder(24.2, { slip: [27.0, 28.4] })}
  <div data-check="oops" class="box b40" data-in="27.60" data-fx="wobble" style="background:var(--surface);align-self:flex-start;transform-origin:left center;margin-left:8px">앗, 삐끗! 한 음 내려서 다시 해요</div>
</div>` },
    { s: 31, e: 38, html: `<div class="zone" style="flex-direction:row;align-items:center;gap:44px">
  <div data-check="n3" data-in="31.15" data-fx="pop" style="font:800 220px/1 Pretendard;color:var(--accent);letter-spacing:-0.03em">3</div>
  <div style="flex:1">
    <span data-check="s6p" class="pill" data-in="31.30" data-fx="up">STEP 3</span>
    <div data-check="s6t" class="t88" data-in="31.45" data-fx="up" style="margin-top:28px">숨을 세게<br>밀어내지 말고</div>
    <div data-check="s6s" class="b40" data-in="32.20" data-fx="up" style="margin-top:32px;color:var(--muted)"><span class="hl" data-in="32.60" data-fx="hl">편안하게, 일정하게</span><br>내보내요</div>
  </div></div>` },
    { s: 38, e: 45, html: `<div class="zone" style="justify-content:flex-start;padding-top:170px">
  <span data-check="s7p" class="pill" data-in="38.20" data-fx="up" style="align-self:flex-start">다시 도전</span>
  <div data-check="s7t" class="t88" data-in="38.35" data-fx="up" style="margin-top:28px">한 음 내려서<br>천천히 다시 올라가요</div>
  ${parts.ladder(39.2)}
  <div data-check="s7ok" class="box b40" data-in="42.40" data-fx="pop" style="background:var(--surface);align-self:flex-start;margin-left:8px">이번엔 끝까지 올라갔어요!</div>
</div>` },
    // 45~55초 결과·깨달음
    { s: 45, e: 50, html: `<div class="zone">
  <div data-check="s5t" class="t88" data-in="45.20" data-fx="up">힘을 빼니까<br>이렇게 달라졌어요</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:52px">
    <div data-check="s5a" class="box b40" data-in="45.90" data-fx="left"><span class="cap" style="margin-right:18px">전</span>꽉 조인 얇은 소리</div>
    <div data-check="s5b" class="box b40" data-in="46.70" data-fx="left" style="border:4px solid var(--accent)"><span class="cap" style="margin-right:18px;color:var(--accent)">후</span>편하게 열린 소리</div>
  </div>
  <div data-check="s5c" class="cap" data-in="47.40" data-fx="up" style="margin-top:36px">목이 아프면 바로 쉬어 주세요</div>
</div>` },
    { s: 50, e: 55, html: `<div class="zone">
  <div data-check="s8t" class="t88" data-in="50.20" data-fx="up">오늘 기억할<br>세 가지</div>
  <div style="display:flex;flex-direction:column;gap:22px;margin-top:52px">
    <div data-check="s8a" class="box b40" data-in="50.90" data-fx="left"><span style="color:var(--accent)">○</span> 입 안은 하품하듯 넓게</div>
    <div data-check="s8b" class="box b40" data-in="51.60" data-fx="left"><span style="color:var(--accent)">○</span> '우'로 한 계단씩 천천히</div>
    <div data-check="s8c" class="box b40" data-in="52.30" data-fx="left"><span style="color:var(--accent)">○</span> 숨은 편안하게, 일정하게</div>
  </div></div>` },
    // 55~60초 질문형 마무리와 다음 회 예고
    { s: 55, e: 60, html: `<div class="zone">
  <div data-check="ask" data-in="55.10" data-fx="pop" style="background:var(--surface);border-radius:40px;padding:56px 52px;position:relative">
    <div class="t88">여러분은 어떤 고음이<br>가장 어려우세요?</div>
    <div class="abs" style="left:90px;bottom:-34px;width:0;height:0;border-left:34px solid transparent;border-right:34px solid transparent;border-top:36px solid var(--surface)"></div>
  </div>
  <div data-check="askc" data-in="55.60" data-fx="up" style="margin-top:72px;font:800 44px/1.4 Pretendard;color:var(--accent)">댓글로 알려 주세요 ↓</div>
  <div data-check="next" class="cap" data-in="57.20" data-fx="up" style="margin-top:28px">다음 연습도 함께해요!</div>
</div>` },
  ],
};
