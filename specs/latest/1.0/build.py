#! /usr/bin/env python3
# Usage: build.py (no args)
import pathlib
import subprocess
import sys

THIS_DIR = pathlib.Path(__file__).parent
BASE_DIR = THIS_DIR.parent.parent.parent
assert (BASE_DIR / '.git').exists(), BASE_DIR / '.git'

subprocess.run([sys.executable, BASE_DIR / 'specs/build-idl.py', THIS_DIR / 'webgl.idl'], check=True)
