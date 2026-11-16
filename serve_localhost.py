#! /usr/bin/env python3

# Invoke http.server to host a basic webserver on localhost /without/ caching.
# Files served by http.server are usually cached by browsers, which makes testing and debugging
# buggy.

import http.server
import os
from pathlib import *

from functools import partial


class NoCacheRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--bind', '-b', default='localhost', metavar='ADDRESS',
                        help='Specify alternate bind address '
                             '[default: localhost - pass \'\' if you want to serve remote clients]')
    parser.add_argument('--port', action='store',
                        default=8000, type=int,
                        help='Specify alternate port [default: 8000]')
    parser.add_argument('--directory', '-d',
                        help='Specify alternative directory '
                        '[default:current directory]')
    parser.add_argument('port', action='store',
                        default=8000, type=int,
                        nargs='?',
                        help='Specify alternate port [default: 8000]')
    args = parser.parse_args()

    serve_dir = Path(os.getcwd())
    if args.directory:
        serve_dir = Path(args.directory)

    handler_class = partial(NoCacheRequestHandler, directory=serve_dir)

    checkout_dir = Path(__file__).parent
    url = f'http://{args.bind}:{args.port}'
    server = http.server.ThreadingHTTPServer((args.bind, args.port), handler_class)
    print(f'Serving {serve_dir}:')
    print(f'\t{url}/')
    if serve_dir == checkout_dir:
        print(f'CTS Test Runner:')
        print(f'\t{url}/sdk/tests/webgl-conformance-tests.html')
    server.serve_forever()
