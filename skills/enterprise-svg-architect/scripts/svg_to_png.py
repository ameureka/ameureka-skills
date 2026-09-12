#!/usr/bin/env python3
"""Export an SVG to PNG for docs/PPT/portability.

Renders LIGHT mode (the base styles; @media prefers-color-scheme:dark is ignored),
which is what you want for a shareable raster. Tries rsvg-convert first (fast, good
CJK via fontconfig), then falls back to headless Google Chrome.

Usage:
    python3 svg_to_png.py input.svg              # -> input@2x.png (scale 2)
    python3 svg_to_png.py input.svg -s 3         # 3x
    python3 svg_to_png.py input.svg -o out.png   # explicit output path
"""
import argparse
import os
import shutil
import subprocess
import sys


def find_chrome():
    candidates = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "/Applications/Chromium.app/Contents/MacOS/Chromium",
        "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
        shutil.which("google-chrome"),
        shutil.which("chromium"),
        shutil.which("chromium-browser"),
    ]
    for c in candidates:
        if c and os.path.exists(c):
            return c
    return None


def via_rsvg(src, dst, scale):
    exe = shutil.which("rsvg-convert")
    if not exe:
        return False
    try:
        subprocess.run([exe, "-z", str(scale), src, "-o", dst], check=True)
        return os.path.exists(dst) and os.path.getsize(dst) > 0
    except subprocess.CalledProcessError:
        return False


def via_chrome(src, dst, scale):
    exe = find_chrome()
    if not exe:
        return False
    src_url = "file://" + os.path.abspath(src)
    try:
        subprocess.run(
            [
                exe, "--headless", "--disable-gpu", "--no-sandbox",
                "--force-color-profile=srgb",
                f"--force-device-scale-factor={scale}",
                "--default-background-color=00000000",
                f"--screenshot={os.path.abspath(dst)}",
                "--hide-scrollbars", "--window-size=1400,2000",
                src_url,
            ],
            check=True,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        return os.path.exists(dst) and os.path.getsize(dst) > 0
    except subprocess.CalledProcessError:
        return False


def main():
    ap = argparse.ArgumentParser(description="Export SVG to PNG (light mode, 2x default).")
    ap.add_argument("svg", help="input .svg path")
    ap.add_argument("-s", "--scale", type=float, default=2.0, help="scale factor (default 2)")
    ap.add_argument("-o", "--output", help="output .png path (default <name>@<scale>x.png)")
    args = ap.parse_args()

    if not os.path.exists(args.svg):
        sys.exit(f"error: not found: {args.svg}")

    if args.output:
        dst = args.output
    else:
        base, _ = os.path.splitext(args.svg)
        tag = int(args.scale) if float(args.scale).is_integer() else args.scale
        dst = f"{base}@{tag}x.png"

    if via_rsvg(args.svg, dst, args.scale):
        print(f"ok (rsvg-convert): {dst}")
        return
    print("rsvg-convert unavailable or failed; trying headless Chrome...", file=sys.stderr)
    if via_chrome(args.svg, dst, args.scale):
        print(f"ok (chrome): {dst}")
        return
    sys.exit(
        "error: could not render. Install librsvg (`brew install librsvg`) "
        "or ensure Google Chrome is present."
    )


if __name__ == "__main__":
    main()
