#!/bin/bash
# Simple HTTP server for Linux/Mac

PORT=8765
DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Server running at http://localhost:$PORT/"
echo "Serving files from: $DIR"

# Use Python's built-in HTTP server (works on Linux/Mac/Windows with Python)
python3 -c "
import http.server
import socketserver
import os

PORT = $PORT
DIR = '$DIR'

os.chdir(DIR)

Handler = http.server.SimpleHTTPRequestHandler
Handler.extensions_map.update({
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
})

with socketserver.TCPServer(('', PORT), Handler) as httpd:
    print(f'Serving at http://localhost:{PORT}')
    httpd.serve_forever()
"
