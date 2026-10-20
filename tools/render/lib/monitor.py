# 명령을 실행하면서 전체 시간, CPU 사용 시간(자식 포함), 프로세스 트리 메모리 최대 합계를 잰다.
import os, sys, time, json, resource, subprocess

def tree_rss_kb(root):
    kids = {}
    for p in os.listdir('/proc'):
        if not p.isdigit():
            continue
        try:
            with open(f'/proc/{p}/stat') as f:
                ppid = int(f.read().rsplit(')', 1)[1].split()[1])
            kids.setdefault(ppid, []).append(int(p))
        except Exception:
            pass
    total, stack = 0, [root]
    while stack:
        pid = stack.pop()
        try:
            with open(f'/proc/{pid}/status') as f:
                for line in f:
                    if line.startswith('VmRSS:'):
                        total += int(line.split()[1])
        except Exception:
            pass
        stack.extend(kids.get(pid, []))
    return total

label, cmd = sys.argv[1], sys.argv[2:]
t0 = time.time()
proc = subprocess.Popen(cmd)
peak = 0
while proc.poll() is None:
    peak = max(peak, tree_rss_kb(proc.pid))
    time.sleep(0.2)
wall = time.time() - t0
ru = resource.getrusage(resource.RUSAGE_CHILDREN)
res = {'label': label, 'exit': proc.returncode, 'wall_s': round(wall, 1),
       'cpu_s': round(ru.ru_utime + ru.ru_stime, 1), 'cpu_avg_cores': round((ru.ru_utime + ru.ru_stime) / wall, 2),
       'peak_rss_mb': round(peak / 1024)}
print(json.dumps(res, ensure_ascii=False))
with open(os.path.join(os.path.dirname(__file__), 'results.jsonl'), 'a') as f:
    f.write(json.dumps(res, ensure_ascii=False) + '\n')
