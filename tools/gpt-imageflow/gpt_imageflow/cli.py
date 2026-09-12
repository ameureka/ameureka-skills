#!/usr/bin/env python3
"""─── cli.py — gpt-imageflow 统一命令行入口 ───

把四个能力收进一个入口，方便复用：

    python3 -m gpt_imageflow --help
    python3 -m gpt_imageflow single   --prompt "..." --preset 16:9 --out a.webp
    python3 -m gpt_imageflow generate --requests reqs.json --out-dir out --aspect-ratio 16:9
    python3 -m gpt_imageflow cover    --kit publish-kit.json --variants 2
    python3 -m gpt_imageflow probe    --out-dir _probe-out
    python3 -m gpt_imageflow selftest  # 只验连通与配置，不出图不花钱

也可分别调用各子模块：python3 -m gpt_imageflow.candidates ...
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

from . import relay


def _cmd_single(a: argparse.Namespace) -> int:
    size = a.size or relay.PRESETS.get(a.preset or "16:9")
    if not (a.prompt and a.out):
        print("--prompt 与 --out 必填", file=sys.stderr)
        return 2
    return 0 if relay.generate(a.prompt, size, Path(a.out), a.format,
                               a.timeout, env_file=a.env_file,
                               usage_path=a.usage_file) else 1


def _cmd_generate(a: argparse.Namespace) -> int:
    from .candidates import run

    return run(Path(a.requests).resolve(), Path(a.out_dir).resolve(), a.model,
               a.limit, a.max_attempts, a.timeout, a.aspect_ratio,
               a.output_format, a.dry_run, env_file=a.env_file,
               usage_path=a.usage_file)


def _cmd_cover(a: argparse.Namespace) -> int:
    from .cover import run

    return run(Path(a.kit).resolve(), a.variants, a.timeout,
               Path(a.repo).resolve(), a.dry_run,
               env_file=a.env_file, usage_path=a.usage_file)


def _cmd_probe(a: argparse.Namespace) -> int:
    from .probe import main as probe_main

    return probe_main(["--out-dir", a.out_dir])


def _cmd_selftest(a: argparse.Namespace) -> int:
    import json
    import urllib.request

    from .relay import PRESETS, load_env, _SSL_CONTEXT

    base, key = load_env(a.env_file)
    if not base or not key:
        print("[gpt-image] ❌ 配置缺失")
        return 2
    req = urllib.request.Request(
        f"{base.rstrip('/')}/models",
        headers={"Authorization": f"Bearer {key}", "User-Agent": relay.USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=20, context=_SSL_CONTEXT) as r:
            models = [m.get("id") for m in json.loads(r.read()).get("data", [])]
        print(f"[gpt-image] ✅ 中转可达，挂载模型: {models}")
        for name, sz in sorted(PRESETS.items()):
            w, h = (int(x) for x in sz.split("x"))
            ok = w % 16 == 0 and h % 16 == 0 and (1 / 3) <= w / h <= 3
            print(f"    {name:5} {sz:10} 宽高整除16={w % 16 == 0 and h % 16 == 0} "
                  f"比例={w / h:.3f} {'✅' if ok else '❌'}")
        return 0
    except Exception as e:
        print(f"[gpt-image] ❌ 中转不可达: {e}")
        return 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)

    p_single = sub.add_parser("single", help="单张出图")
    p_single.add_argument("--prompt")
    p_single.add_argument("--preset", choices=sorted(relay.PRESETS),
                          help=f"预设比例 {sorted(relay.PRESETS)}")
    p_single.add_argument("--size", help="自定义 WIDTHxHEIGHT（宽高被 16 整除，比例 1:3~3:1）")
    p_single.add_argument("--out", type=Path)
    p_single.add_argument("--format", default="webp", choices=["webp", "png", "jpeg"])
    p_single.add_argument("--timeout", type=int, default=300)
    p_single.add_argument("--env-file", default=None)
    p_single.add_argument("--usage-file", default="usage.jsonl")
    p_single.set_defaults(fn=_cmd_single)

    p_gen = sub.add_parser("generate", help="批量候选图生成（image-generation-requests.v1）")
    p_gen.add_argument("--requests", required=True)
    p_gen.add_argument("--out-dir", required=True)
    p_gen.add_argument("--model", default="gpt-image-2")
    p_gen.add_argument("--limit", type=int, default=0)
    p_gen.add_argument("--max-attempts", type=int, default=3)
    p_gen.add_argument("--timeout", type=float, default=120.0)
    p_gen.add_argument("--aspect-ratio", default="16:9", choices=sorted(relay.PRESETS))
    p_gen.add_argument("--output-format", default="webp", choices=["webp", "png", "jpeg"])
    p_gen.add_argument("--env-file", default=None)
    p_gen.add_argument("--usage-file", default="usage.jsonl")
    p_gen.add_argument("--dry-run", action="store_true")
    p_gen.set_defaults(fn=_cmd_generate)

    p_cover = sub.add_parser("cover", help="3:4 封面生成（带人脸参考图）")
    p_cover.add_argument("--kit", required=True)
    p_cover.add_argument("--variants", type=int, default=2)
    p_cover.add_argument("--timeout", type=float, default=300.0)
    p_cover.add_argument("--repo", default=".")
    p_cover.add_argument("--env-file", default=None)
    p_cover.add_argument("--usage-file", default="usage.jsonl")
    p_cover.add_argument("--dry-run", action="store_true")
    p_cover.set_defaults(fn=_cmd_cover)

    p_probe = sub.add_parser("probe", help="接入新中转前的能力探测")
    p_probe.add_argument("--out-dir", default="_probe-out")
    p_probe.set_defaults(fn=_cmd_probe)

    p_st = sub.add_parser("selftest", help="只验连通与配置，不出图不花钱")
    p_st.add_argument("--env-file", default=None)
    p_st.set_defaults(fn=_cmd_selftest)

    a = ap.parse_args(argv)
    return a.fn(a)


if __name__ == "__main__":
    sys.exit(main())