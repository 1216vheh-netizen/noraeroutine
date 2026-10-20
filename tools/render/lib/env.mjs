// 실행 환경 찾기 (제작 시스템 v2.1). 경로를 코드에 고정하지 않고, 환경 변수 → 기본 위치 순서로 찾는다.
//   NR_TOKENS      디자인 토큰 파일. 없으면 이 폴더에서 위로 올라가며 design/tokens.json 을 찾는다.
//   NR_FONTS_DIR   Pretendard OTF 폴더. 없으면 npm 패키지 pretendard(package.json에 버전 고정)에서 읽는다.
//   NR_CHROME_PATH Chromium 실행 파일. 없으면 playwright-core 기본 위치(PLAYWRIGHT_BROWSERS_PATH 반영)를 쓴다.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';

export const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const require = createRequire(import.meta.url);

export function tokensPath() {
  if (process.env.NR_TOKENS) return path.resolve(process.env.NR_TOKENS);
  for (let d = ROOT; ; d = path.dirname(d)) {
    const p = path.join(d, 'design', 'tokens.json');
    if (fs.existsSync(p)) return p;
    if (path.dirname(d) === d) throw new Error('design/tokens.json 을 찾지 못함 — NR_TOKENS 로 지정하세요');
  }
}

export function fontsDir() {
  const d = process.env.NR_FONTS_DIR ? path.resolve(process.env.NR_FONTS_DIR)
    : path.join(path.dirname(require.resolve('pretendard/package.json')), 'dist', 'public', 'static');
  for (const w of ['Medium', 'Bold', 'ExtraBold']) if (!fs.existsSync(path.join(d, `Pretendard-${w}.otf`))) throw new Error(`글꼴 없음: ${d}/Pretendard-${w}.otf — npm ci 를 실행하세요`);
  return d;
}

export function chromePath() {
  const p = process.env.NR_CHROME_PATH || chromium.executablePath();
  if (!fs.existsSync(p)) throw new Error(`Chromium 없음: ${p} — NR_CHROME_PATH 로 지정하세요`);
  return p;
}

export const sha256 = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');

// 결과 기록용: 어떤 재료·도구 버전으로 만들었는지
export function envInfo() {
  const ver = (m) => JSON.parse(fs.readFileSync(require.resolve(`${m}/package.json`), 'utf8')).version;
  const t = tokensPath(), f = fontsDir();
  return { tokens: t, tokensSha256: sha256(t), fontsDir: f, pretendard: ver('pretendard'), playwrightCore: ver('playwright-core'),
    fontsSha256: Object.fromEntries(['Medium', 'Bold', 'ExtraBold'].map((w) => [w, sha256(path.join(f, `Pretendard-${w}.otf`))])) };
}
export { chromium };
