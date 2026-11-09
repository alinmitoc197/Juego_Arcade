"""Servidor local para desarrollo: igual que `python -m http.server` pero SIN caché
(el navegador nunca mezcla archivos viejos con nuevos) y buscando un puerto libre."""
import http.server
import socketserver
import webbrowser

FIRST_PORT = 8080

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, max-age=0')
        super().end_headers()

socketserver.TCPServer.allow_reuse_address = True
httpd = None
for port in range(FIRST_PORT, FIRST_PORT + 20):
    try:
        httpd = socketserver.TCPServer(('', port), NoCache)
        break
    except OSError:
        print(f'Puerto {port} ocupado, pruebo el siguiente...')
if httpd is None:
    raise SystemExit('No encuentro ningún puerto libre entre 8080 y 8099.')

url = f'http://localhost:{port}'
print(f'Juego en {url}  (Ctrl+C para parar)')
webbrowser.open(url)
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print('\nServidor parado.')
