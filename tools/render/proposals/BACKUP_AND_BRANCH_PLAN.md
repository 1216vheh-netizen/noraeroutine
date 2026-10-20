# v2 백업 검증 결과 · GitHub 별도 브랜치 반영 파일 정리 (설계안)

- 실제 Push·main 병합은 하지 않았다. 아래는 승인 시 실행할 계획이다.

## 1. 백업 검증 결과 (2026-10-20)
대상: `noraeroutine_render_v2_backup.tar.gz` (15,545,244 바이트, 252개 항목)

| 검사 | 결과 |
|---|---|
| 압축 파일 손상 (gzip -t) | 통과 |
| SHA-256 (별도 .sha256 파일과 비교) | 일치 `61fc1415…7eab51da` |
| 새 폴더에 풀기 | 성공 |
| Git 저장소 무결성 (git fsck --full) | 오류 0 |
| 커밋 4개·태그 `v2-tech-approved` | 모두 있음 |
| `backup_v1/` 원본 3개 체크섬 | 3/3 일치 |
| 보존 체크섬 `preserve/v2_runs_files.sha256` (126개) | 91개 일치, 35개는 백업에서 의도적으로 뺀 프레임 이미지·결정성 시험 폴더 (불일치 0) |
| 기능 복원: 푼 사본으로 30초 시안 렌더링 + 자동 검증 | 8.3초 완료, 10개 검사 전체 통과 |
| 복원본 결과 vs 보존된 결과 | SSIM 1.000000, PSNR 평균 92.6dB (사실상 동일) |

복원 조건 (백업만으로는 안 되는 부분):
- 도구 폴더 `dtcg_tools/node_modules`(playwright-core 등)가 백업 밖에 있어 연결해야 실행된다.
- `lib/validate.py`, `lib/build.mjs`가 `/home/user/noraeroutine/design/tokens.json`을 절대 경로로 읽는다.
- Chromium 경로가 `/opt/pw-browsers/...`로 고정되어 있다.
→ 아래 3절 "이식성 수정"을 브랜치 반영 전에 적용한다.

## 2. GitHub 별도 브랜치에 넣을 파일 / 뺄 파일
제안 브랜치: `render-v2` (main 아님). 저장소 안 위치: `tools/render/`

### 넣을 파일 (약 350KB, 글꼴 제외)
| 경로 | 내용 |
|---|---|
| `make.mjs`, `lib/*.mjs`, `lib/*.py` | 렌더링·검증 프로그램 |
| `specs/ep01_30s.mjs`, `ep01_special60.mjs`, `ep01_special60_r2.mjs` | 장면 정의 (r2는 STEP 3 수정안, 선생님 검수 전 표시 포함) |
| `tools/layout_check.mjs`, `tools/face_check.mjs`, `tools/face_tests/*.json` | 글자 배치·얼굴 위치 검사와 시험 자료 |
| `staging/assets/**` (README·템플릿·schema만) | 캐릭터·클립·목소리 등록 구조. 미디어 파일 0개 |
| `proposals/*.md` | DESIGN_SYSTEM v2.3 변경안, 음성·립싱크 계획, 검증 11~20 계획, 이 문서 |
| `backup_v1/` + `SHA256SUMS` | v1 원본 (되돌리기용) |
| `preserve/*.sha256`, `*.sha`, `v2_validation_summary.json`, `v2_monitor_results.jsonl` | 승인 시점 체크섬·검증 기록 (작은 텍스트) |
| `CHANGELOG.md`, `.gitignore`, 새 `package.json`, `package-lock.json` | 변경 내역·의존성 고정 |

### 뺄 파일
| 경로 | 이유 |
|---|---|
| `runs/` (약 192MB: mp4, 프레임, 비교 이미지) | 결과물은 용량이 크고 다시 만들 수 있음. 필요하면 백업 파일로 보관 |
| `node_modules/`, `dtcg_tools/` | `package.json`으로 설치 |
| `*.tar.gz` 백업, `*.log`, 임시 폴더 | 저장소에 둘 필요 없음 |
| `fonts/*.otf` (4.6MB) | 아래 둘 중 하나 선택 필요 |
| `proposals/DESIGN_SYSTEM_v2.2_base.md` | main의 DESIGN_SYSTEM.md와 같은 사본 (비교용으로만 썼음) |

글꼴 선택지: (가) OFL 1.1 라이선스 파일(`fonts/LICENSE`)을 함께 넣어 저장소에 포함 — 현재 LICENSE 파일이 없으므로 추가 필요 / (나) npm `pretendard@1.3.9` 패키지에서 읽도록 바꿔 저장소에는 넣지 않음 (권장: 저장소가 가벼워짐).

## 3. 반영 전 이식성 수정 (승인 후 진행)
1. 토큰 경로: 절대 경로 → 저장소 기준 상대 경로(`../../design/tokens.json`), 환경 변수로 바꿀 수 있게.
2. Chromium 경로: 환경 변수 `CHROME_PATH` 우선, 없으면 현재 경로.
3. `../../dtcg_tools/node_modules/...` 가져오기 → `package.json`(playwright-core 1.56.1 고정) 기준 `import 'playwright-core'`.
4. 수정 후 30초 시안·60초 최종 다시 렌더링 → 검증 10개 통과와 보존 결과 대비 SSIM 확인.

## 4. 반영 방법 (2026-10-20 조건부 승인에 따라 실행)
- main(6294060)에서 `render-v2` 브랜치를 만들고 `tools/render/`에 파일을 복사해 커밋 (로컬 작업 이력은 백업 파일에 보관).
- 글꼴은 (나) 패키지 설치 방식으로 결정. 3절 이식성 수정 적용 완료.
- main 병합은 별도 승인. 병합 전 Pull Request로 변경 목록을 검수받는다.
