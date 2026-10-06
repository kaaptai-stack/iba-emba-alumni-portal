"""Local server for the IBA EMBA Alumni Portal prototype.

Usage:  python serve.py [port]      (default port 8080)
Then open http://localhost:8080 (member app) or http://localhost:8080/admin.html
"""
import http.server
import os
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".webmanifest": "application/manifest+json"}

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
    print(f"IBA EMBA Alumni Portal: http://localhost:{port}  (admin: http://localhost:{port}/admin.html)")
    http.server.ThreadingHTTPServer(("", port), NoCacheHandler).serve_forever()
