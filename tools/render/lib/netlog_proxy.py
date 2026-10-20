# 검증 전용 로컬 가짜 프록시: 브라우저의 접속 시도를 기록만 하고 외부로는 절대 연결하지 않는다(모두 403 응답).
import socket, sys, threading, json, time
port, logf = int(sys.argv[1]), sys.argv[2]
srv = socket.socket(); srv.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1); srv.bind(('127.0.0.1', port)); srv.listen(64)
def handle(c):
    try:
        c.settimeout(3); line = c.recv(4096).split(b'\r\n', 1)[0].decode('latin1')
        with open(logf, 'a') as f: f.write(json.dumps({'t': round(time.time(), 2), 'req': line}) + '\n')
        c.sendall(b'HTTP/1.1 403 Forbidden\r\nContent-Length: 0\r\n\r\n')
    except Exception: pass
    finally: c.close()
while True:
    c, _ = srv.accept(); threading.Thread(target=handle, args=(c,), daemon=True).start()
