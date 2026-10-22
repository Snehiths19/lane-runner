# Receives base64 JPEG frames over HTTP POST and writes them to a folder.
import base64, http.server, sys, os, urllib.parse
OUT = sys.argv[1]
class H(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        name = os.path.basename(q['name'][0])
        sub = os.path.basename(q.get('dir', ['misc'])[0])
        os.makedirs(os.path.join(OUT, sub), exist_ok=True)
        data = self.rfile.read(int(self.headers['Content-Length']))
        with open(os.path.join(OUT, sub, name), 'wb') as f:
            f.write(base64.b64decode(data))
        self.send_response(204); self.end_headers()
    def log_message(self, *a): pass
http.server.ThreadingHTTPServer(('127.0.0.1', 8765), H).serve_forever()
