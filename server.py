#!/usr/bin/env python3
"""
Simple HTTP server for 祈福拜佛2
Works on Linux, Mac, and Windows (with Python 3)
"""

import http.server
import socketserver
import os
import sys

PORT = 8765
DIR = os.path.dirname(os.path.abspath(__file__))

os.chdir(DIR)

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
        '.woff': 'font/woff',
        '.woff2': 'font/woff2',
        '.ttf': 'font/ttf',
        '.eot': 'application/vnd.ms-fontobject',
        '': 'application/octet-stream',
    }

    def log_message(self, format, *args):
        print(f"GET {args[0]}")

    def log_error(self, format, *args):
        print(f"ERROR: {args[0]}")

if __name__ == '__main__':
    print(f"Server running at http://localhost:{PORT}/")
    print(f"Serving files from: {DIR}")

    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
            sys.exit(0)
