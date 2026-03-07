#!/usr/bin/env python3
"""Static file server with Cache-Control: no-store headers."""
import http.server, sys

class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a): pass  # silence request logs

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8091
http.server.HTTPServer(('', port), NoCacheHandler).serve_forever()
