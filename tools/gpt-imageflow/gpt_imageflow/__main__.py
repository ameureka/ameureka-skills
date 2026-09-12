#!/usr/bin/env python3
"""支持 `python3 -m gpt_imageflow` 直接跑 CLI。"""
import sys

from .cli import main

if __name__ == "__main__":
    sys.exit(main())