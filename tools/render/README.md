# 노래루틴 릴스 제작 시스템 v2.1

HTML 장면 정의 → Chromium 프레임 → ffmpeg 영상, 그리고 자동 검증. 상태: 기술 검증 승인(v2), 게시용 사용은 별도 승인.

## 준비
```
cd tools/render
npm ci                 # playwright-core 1.56.1, pretendard 1.3.9 (package-lock.json 으로 고정)
```
- 필요한 프로그램: Node.js 20 이상, ffmpeg/ffprobe, Python 3, Chromium (playwright-core 1.56.1 = Chromium 141, 리비전 1194)
- Chromium 설치는 이 시스템이 하지 않는다. 이미 설치된 것을 쓴다.

## 환경 변수 (모두 선택)
| 이름 | 기본값 | 설명 |
|---|---|---|
| `NR_TOKENS` | 위 폴더로 올라가며 찾은 `design/tokens.json` | 디자인 토큰 |
| `NR_FONTS_DIR` | `node_modules/pretendard/dist/public/static` | Pretendard OTF 폴더 |
| `NR_CHROME_PATH` | playwright-core 기본 위치 (`PLAYWRIGHT_BROWSERS_PATH` 반영) | Chromium 실행 파일 |

렌더링 결과 `meta.json`의 `env`에 토큰 경로·체크섬, 글꼴 버전·체크섬, playwright-core 버전이 기록된다.
`validate.py`는 렌더링 때와 토큰 내용이 같은지 다시 확인한다.

## 사용법
```
node make.mjs ep01_special60_r2 final runs/결과폴더   # 최종본 (1080×1920, 30fps)
node make.mjs ep01_30s draft runs/결과폴더            # 빠른 시안 (540×960, 15fps)
python3 -I lib/validate.py runs/결과폴더              # 자동 검증 11개
node tools/layout_check.mjs <spec>                    # 글자 배치 검사 (영상 없이)
node tools/face_check.mjs <spec> tools/face_tests/plan_ok.json   # 얼굴 위치 검사 (설계 시제품)
```
- 기본 오디오는 싱크 검증용 신호음이다. 게시용 음성·음악이 아니다.
- `runs/`(영상·프레임)는 저장소에 올리지 않는다.

## 글꼴 라이선스
- Pretendard 1.3.9 (npm `pretendard@1.3.9`, https://github.com/orioncactus/pretendard)
- 라이선스: SIL Open Font License 1.1 (`node_modules/pretendard/dist/LICENSE.txt`). 글꼴 단독 판매 외의 상업적 이용·수정·재배포 가능.
- 사용 굵기: Medium(500), Bold(700), ExtraBold(800)
- 저장소에는 글꼴 파일을 넣지 않는다. 이전에 쓰던 글꼴 파일과 npm 패키지 파일은 바이트 단위로 같다 (SHA-256 일치).

## 폴더
| 경로 | 내용 |
|---|---|
| `lib/` | `env.mjs`(환경 찾기), `build.mjs`(HTML 조립), `render.mjs`(렌더링), `validate.py`(검증), `monitor.py`, `netlog_proxy.py` |
| `specs/` | 장면 정의. `ep01_special60_r2`가 최신 문구 수정본 (STEP 3 발성 내용은 선생님 검수 전 임시) |
| `tools/` | 배치·얼굴 위치 검사와 시험 자료 |
| `staging/assets/` | 캐릭터·클립·목소리 등록 틀 (미디어 없음, 원본 등록 전) |
| `proposals/` | 설계안·초안 (DESIGN_SYSTEM v2.3 초안 포함 — 확정 아님) |
| `backup_v1/` | 변경 전 v1 원본 보관용. 고정 경로가 그대로 있으며 실행 대상이 아니다 |
| `preserve/` | v2 기술 검증 승인 시점의 체크섬·검증 기록 |
| `MANIFEST.sha256` | 이 폴더 파일 체크섬 (`sha256sum -c MANIFEST.sha256`) |
