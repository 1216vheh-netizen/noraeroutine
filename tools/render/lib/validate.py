# 노래루틴 릴스 자동 검증 (제작 시스템 v2). 사용법: python3 -I validate.py <결과 폴더>
# 검사: 영상 규격·프레임 수·순서 / 진행 막대 위치 / 안전 영역·최소 글자 / 오디오·영상 싱크
import json, os, subprocess, sys, struct, math, hashlib

run_dir = sys.argv[1]
meta = json.load(open(os.path.join(run_dir, 'meta.json')))
chk = json.load(open(os.path.join(run_dir, 'checks.json')))
# 토큰 파일: NR_TOKENS → 렌더링 때 기록한 경로(meta.env.tokens). 렌더링 때와 내용이 같은지 체크섬으로 확인한다.
tok_path = os.environ.get('NR_TOKENS') or meta.get('env', {}).get('tokens')
if not tok_path: sys.exit('토큰 파일 경로를 알 수 없음 — NR_TOKENS 로 지정하세요')
tok_bytes = open(tok_path, 'rb').read(); tok = json.loads(tok_bytes)
mp4 = os.path.join(run_dir, 'reel.mp4')
FPS, DUR, S = meta['fps'], meta['duration'], meta['scale']
W, H = meta['width'], meta['height']
R = tok['format']['reelsCover']; v = lambda t: t['$value']
ml, tw, top = v(R['marginLeft']), v(R['textWidth']), v(R['safeTop'])
CAP_MIN = v(tok['sns']['type']['caption']['sizeMin'])
res = []
def ok(name, cond, detail=''):
    res.append({'check': name, 'pass': bool(cond), 'detail': detail})

def probe():
    o = subprocess.run(['ffprobe', '-v', 'error', '-count_frames', '-show_entries',
        'stream=codec_type,codec_name,width,height,r_frame_rate,nb_read_frames,pix_fmt,sample_rate,channels,duration,start_time:format=duration',
        '-of', 'json', mp4], capture_output=True, text=True, check=True).stdout
    return json.loads(o)
exp_sha = meta.get('env', {}).get('tokensSha256')
ok('토큰 파일 일치 (렌더링 때와 같음)', exp_sha is None or hashlib.sha256(tok_bytes).hexdigest() == exp_sha, f"{os.path.basename(tok_path)} {hashlib.sha256(tok_bytes).hexdigest()[:12]}…" + ('' if exp_sha else ' (기록 없음: 이전 결과물)'))
pr = probe(); vs = [s for s in pr['streams'] if s['codec_type'] == 'video'][0]; au = [s for s in pr['streams'] if s['codec_type'] == 'audio'][0]
ok('영상 규격', vs['codec_name'] == 'h264' and vs['width'] == W and vs['height'] == H and vs['r_frame_rate'] == f'{FPS}/1' and vs['pix_fmt'] == 'yuv420p',
   f"{vs['codec_name']} {vs['width']}×{vs['height']} {vs['r_frame_rate']} {vs['pix_fmt']}")
ok('프레임 수', int(vs['nb_read_frames']) == meta['frames'] == round(FPS * DUR), f"{vs['nb_read_frames']} (기대 {round(FPS*DUR)})")
ok('영상 길이', abs(float(pr['format']['duration']) - DUR) < 0.05 and abs(float(vs['duration']) - DUR) < 0.05, f"{float(vs['duration']):.3f}초")
ok('오디오 규격·길이', au['codec_name'] == 'aac' and au['sample_rate'] == '48000' and abs(float(au['duration']) - DUR) < 0.05, f"{au['codec_name']} {au['sample_rate']}Hz {float(au['duration']):.3f}초")
ok('프레임 순서', meta['orderOk'], f"그린 프레임 {meta['rendered']}/{meta['frames']}")

# 영상 프레임 디코딩 (회색조)
def frames_gray(w, h):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'scale={w}:{h}:flags=area,format=gray', '-f', 'rawvideo', '-'], capture_output=True, check=True).stdout
    n = len(raw) // (w * h); return [raw[i*w*h:(i+1)*w*h] for i in range(n)]
def frame_rgb_row(t, y):
    # 시간 이동 대신 프레임 번호로 정확히 고른다 (마지막 프레임에서 이동이 실패하는 문제 방지)
    n = min(meta['frames'] - 1, round(t * FPS))
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-vf', f'select=eq(n\\,{n}),format=rgb24,crop={W}:1:0:{y}', '-vsync', '0', '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True, check=True).stdout
    if len(raw) != W * 3: raise RuntimeError(f'프레임 {n}을 읽지 못함')
    return [tuple(raw[i*3:i*3+3]) for i in range(W)]

# 진행 막대: 기대 끝 = 왼쪽 + 폭 × t / 길이
bad = []; samples = [0.0, 1.0, DUR*0.25, DUR*0.5, DUR*0.75, DUR - 1/FPS]
y = round((top + 4) * S)
read_err = []
for t in samples:
    t = round(t * FPS) / FPS
    try: row = frame_rgb_row(t, y)
    except Exception as e: read_err.append(str(e)); continue
    xs = [x for x, c in enumerate(row) if c[0] < 200 and c[1] < 120 and c[2] < 150]
    exp = (ml + tw * min(t / DUR, 1)) * S
    got = (max(xs) + 1) if xs else ml * S
    left = min(xs) if xs else None
    if abs(got - exp) > 2 * max(1, 1/S) or (xs and abs(left - ml * S) > 2): bad.append((t, round(exp, 1), got, left))
ok('진행 막대 위치', not bad and not read_err, f"표본 {len(samples)}개 시점, 허용 ±{2*max(1,1/S):.0f}px" + (f", 벗어남 {bad}" if bad else '') + (f", 읽기 실패 {read_err}" if read_err else ''))
row0 = frame_rgb_row(round(DUR*0.5*FPS)/FPS, y)
bg = tuple(int(tok['color']['warm']['bg']['$value']['hex'][i:i+2], 16) for i in (1, 3, 5))
outside = row0[max(0, round(ml*S) - 30):round(ml*S) - 4]
dev = max(max(abs(a - b) for a, b in zip(c, bg)) for c in outside)
ok('막대 왼쪽 바깥 배경색 (회색 띠 없음)', dev <= 4, f"배경색과 최대 차이 {dev}")

# 안전 영역·최소 글자 크기 (DOM 측정, 1080 기준 좌표)
items = [it for c in chk['checks'] for it in c['items']]
out = [(it['id'], it['box']) for it in items if not it['inside']]
small = [(it['id'], it['minFont']) for it in items if it['minFont'] < CAP_MIN]
ok('안전 영역', not out, f"요소 {len(items)}개 (장면 {len(chk['checks'])}개)" + (f", 벗어남 {out}" if out else ''))
ok(f'최소 글자 {CAP_MIN}px', not small, f"가장 작은 글자 {min(it['minFont'] for it in items)}px" + (f", 미달 {small}" if small else ''))

# 오디오·영상 싱크: 신호음 시작 vs 장면 전환(페이드 시작 = 장면 시작 0.15초 전)
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', mp4, '-ac', '1', '-ar', '48000', '-f', 's16le', '-'], capture_output=True, check=True).stdout
smp = struct.unpack(f'<{len(pcm)//2}h', pcm)
a_start = float(au.get('start_time', 0)) - float(vs.get('start_time', 0))   # 소리가 영상보다 늦게 시작하면 양수
gw, gh = 135, 240
fr = frames_gray(gw, gh); y0 = math.ceil(282 / 1920 * gh)
diff = [0.0] + [sum(abs(a - b) for a, b in zip(fr[i][y0*gw:], fr[i-1][y0*gw:])) / ((gh - y0) * gw) for i in range(1, len(fr))]
sync = []
for s in meta['toneStarts']:
    lo, hi = int((s - 0.3 - a_start) * 48000), int((s + 0.3 - a_start) * 48000)
    on = next((i for i in range(max(0, lo), min(len(smp), hi)) if abs(smp[i]) > 2000), None)
    a_ms = None if on is None else (on / 48000 + a_start - s) * 1000
    i0 = max(1, int((s - 0.5) * FPS)); i1 = min(len(diff) - 1, int((s + 0.1) * FPS))
    # 뚜렷한 전환 프레임: 페이드 0.3초 동안 프레임당 변화량은 프레임 속도에 반비례하므로 기준도 맞춘다(15fps 0.5, 30fps 0.25).
    # 압축 잡음(실측 최대 약 0.16)보다 충분히 크고, 실제 전환(실측 0.9 이상)보다 충분히 작다.
    first = next((i for i in range(i0, i1 + 1) if diff[i] > 0.5 * 15 / FPS), None)
    exp_i = math.floor((s - 0.15) * FPS) + 2          # 페이드가 시작된 뒤 둘째 프레임 = 변화가 뚜렷해지는 이론값
    v_off = None if first is None else first - exp_i   # 0이면 이론값과 같음
    sync.append({'scene_start': s, 'audio_offset_ms': None if a_ms is None else round(a_ms, 1),
                 'video_first_change_frame': first, 'video_expected_frame': exp_i, 'video_offset_frames': v_off})
frame_ms = 1000 / FPS
bad_sync = [x for x in sync if x['audio_offset_ms'] is None or abs(x['audio_offset_ms']) > frame_ms or x['video_offset_frames'] is None or abs(x['video_offset_frames']) > 1]
ok('오디오·영상 싱크', not bad_sync, f"전환 {len(sync)}곳, 허용 ±1프레임({frame_ms:.0f}ms), 오디오 최대 {max(abs(x['audio_offset_ms'] or 0) for x in sync):.1f}ms, 영상 전환 감지 오차 {sorted(set(x['video_offset_frames'] for x in sync))}프레임")

report = {'run': os.path.basename(run_dir), 'profile': meta['profile'], 'all_pass': all(r['pass'] for r in res), 'checks': res, 'sync': sync,
          'transition_diff_profile': [round(d, 3) for d in diff]}
json.dump(report, open(os.path.join(run_dir, 'validate.json'), 'w'), ensure_ascii=False, indent=1)
for r in res: print(('✅ ' if r['pass'] else '❌ ') + r['check'], '—', r['detail'])
print('결과:', '전체 통과' if report['all_pass'] else '실패 있음')
sys.exit(0 if report['all_pass'] else 1)
