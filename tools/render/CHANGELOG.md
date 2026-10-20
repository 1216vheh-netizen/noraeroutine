# 노래루틴 릴스 제작 시스템 변경 내역

작업 공간: 임시 작업 폴더 `prod/` (로컬 Git 브랜치 `render-v2-optimize`, 원격 저장소 없음). GitHub main 미반영.

## v2.1 (2026-10-20, render-v2 브랜치)

### 실행 환경 독립
- 고정 경로 제거: Chromium(`/opt/pw-browsers/...`), 토큰(`/home/user/.../tokens.json`), 외부 도구(`../../dtcg_tools/node_modules`)
- `lib/env.mjs` 추가: `NR_TOKENS` · `NR_FONTS_DIR` · `NR_CHROME_PATH` → 없으면 기본 위치를 찾는다 (README 참고)
- `package.json` / `package-lock.json`: playwright-core 1.56.1, pretendard 1.3.9 고정
- 글꼴은 npm 패키지에서 읽는다 (`fonts/` 폴더 제거). 이전 글꼴 파일과 SHA-256 동일 → 화면 결과 동일
- `meta.json`에 `env`(토큰·글꼴 체크섬, 도구 버전) 기록, 검증에 '토큰 파일 일치' 항목 추가 (검사 11개)

### 장면 정의
- `specs/ep01_special60_r2.mjs`: 55~60초 질문 하나만 사용 — "여러분은 어떤 고음이 가장 어려우세요?" (말풍선). 예고 자막은 "다음 연습도 함께해요!"만 남김
- STEP 3 발성 내용과 '오늘 기억할 세 가지' 3번은 보컬 선생님 검수 전 임시

### 설계안 (확정 아님)
- 캐릭터·클립·목소리 등록 틀(`staging/assets/`), 얼굴 위치 검사(`tools/face_check.mjs`), 글자 배치 검사(`tools/layout_check.mjs`)
- `proposals/`: DESIGN_SYSTEM v2.3 초안, 음성·립싱크 계획, 검증 11~20 계획, 백업·브랜치 계획

## v2 (2026-10-20, 기술 검증 승인)

### 백업
- `backup_v1/`에 기존 시스템을 그대로 보관 (체크섬 `backup_v1/SHA256SUMS`, 로컬 커밋 `bd049a6`)
  - `render_cards_v1.mjs` (카드뉴스·스토리), `reel_v2_30s.mjs` (2차 30초 릴스), `r3_test_optimized.mjs` (3차 테스트)

### 구조 변경
| v1 | v2 |
|---|---|
| 장면 내용과 그리는 코드가 한 파일에 섞여 있음 | `specs/*.mjs`(장면 정의) / `lib/build.mjs`(HTML 조립) / `lib/render.mjs`(렌더링) / `lib/validate.py`(검증) 로 분리 |
| 영상 길이 30초, 음 계단 '삐끗' 19.0~20.4초가 코드에 고정 | 장면 정의의 `duration`, `ladder(..., { slip })`에서 받음 |
| 방식 1개 | 프로필 3개: `legacy`(v1 재현, 비교용) · `final`(D') · `draft`(E) |

- CSS, 글꼴, 색(design/tokens.json), 자막 위치, 애니메이션 규칙은 v1과 같다.
  회귀 검증: legacy 30초 900장 중 891장 바이트 동일, 나머지 9장도 최대 2픽셀·밝기 3단계 이내
  (2차 원본 HTML을 그대로 다시 그려도 같은 구간에서 최대 131픽셀 차이가 나는 브라우저 특성 범위 안)

### 성능 최적화 (final·draft)
- 브라우저 화면 병렬 렌더링: `--pages=auto|1|2|4`. auto는 남은 메모리 6GB 이상이면 4개, 아니면 2개
- 진행 막대를 ffmpeg에서 합성하고, 막대 외에 바뀌지 않은 프레임은 다시 그리지 않음
- 프레임을 파일로 저장하지 않고 ffmpeg에 바로 전달 (임시 디스크 0)
- final: PNG 캡처, x264 medium / draft: 540×960·15fps, JPEG 95 캡처, x264 veryfast

### 3차 테스트에서 고친 오류 3건
1. 프레임 순서: 여러 화면이 동시에 ffmpeg로 보낼 때 순서가 엇갈림 → 전송 직렬화, 보낸 순서 검증(실패 시 제작 중단)
2. 진행 막대 시간: drawbox의 `t`는 선 두께라 막대가 처음부터 꽉 참 → 막대 이미지를 `crop x` 시간식으로 잘라 보이게 함
3. 회색 띠: 왼쪽 덮개 사각형 색이 색 범위 변환에서 틀어짐 → 배경색 모서리 가리개(RGBA)로 왼쪽 끝을 둥글게 처리

### 크롬 백그라운드 통신 차단
- `QUIET_CHROME_ARGS`(백그라운드 기능 끄기) + `BLOCK_NETWORK_ARGS`(`--no-proxy-server`, 주소 찾기 차단)
- 검증(시스템 호출 추적): 외부 접속 시도 설정 없음 10건 → 끄기 설정만 7건 → 차단 포함 0건. 세 경우 모두 렌더링 이미지 해시 동일

### 자동 검증 (`lib/validate.py`)
- 영상 규격, 프레임 수, 길이, 오디오 규격·길이, 프레임 순서, 진행 막대 위치(6개 시점), 막대 왼쪽 바깥 배경색,
  안전 영역, 최소 글자 32px, 오디오·영상 싱크(±1프레임)
- 오류 주입 시험: 진행 막대 시간 오류 / 소리 100ms 밀림 / 프레임 10장 누락을 모두 실패로 검출

### 장면 정의
- `specs/ep01_30s.mjs`: 2차 30초 기본편 (회귀 검증용)
- `specs/ep01_special60.mjs`: 60초 특별편 (DESIGN_SYSTEM.md 6장 특별편 구성)

### 사용법
```
node make.mjs ep01_special60 final runs/결과폴더          # 최종본
node make.mjs ep01_special60 draft runs/결과폴더          # 빠른 시안
node make.mjs ep01_special60 final runs/결과폴더 --pages=2 # 메모리가 적을 때
python3 -I lib/validate.py runs/결과폴더                   # 자동 검증
```
- 기본 오디오는 싱크 검증용 신호음(장면 시작마다 1kHz 60ms)이다. 실제 게시용에서는 음성·음악 트랙으로 바꿔야 한다.
