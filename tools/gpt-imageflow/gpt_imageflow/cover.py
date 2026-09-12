#!/usr/bin/env python3
"""─── cover.py — 3:4 封面生成（带人脸参考图，走 edits 路径）───

从 ameureka-media-agent imageflow 的 `cover_gen.py` 抽离。

【职责边界】
  · **提示词是编辑判断，由人/模型写进 JSON**——本工具只管机械部分：
    喂参考图、打中转、按真实字节落盘、验比例。
  · 模型写「画什么」，工具管「怎么送出去、收回来对不对」。

【为什么必须带参考图】封面是真人出镜风格。不带参考图，每张封面的脸都不一样，
做不成固定人设。2026-08-03 实测：同一 prompt 带参考图保住同脸/同姿势/同服装，
不带则完全另一个人。

【画幅】视频号发布界面写「个人主页和分享卡片(3:4)」。1024x1365 实测中转
edits 路径精确返回（与 generations 的「只保比例」不同）。
提示词第一行必须写死画幅，否则模型会按参考图的比例走。

用法:
    python3 -m gpt_imageflow.cover --kit publish-kit.json [--variants 2] [--dry-run]

退出码: 0=至少出一张且比例合规 / 1=全部失败或比例不合规 / 2=配置或参数缺失
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

from .relay import call_relay, load_env, read_dimensions

# 视频号发布界面自己的：「个人主页和分享卡片(3:4)」。
# 1024x1365 实测中转 edits 路径精确返回（与 generations 的「只保比例」不同）。
DEFAULT_SIZE = "1024x1365"
TARGET_ASPECT = 3 / 4
ASPECT_TOL = 0.01

# 硬规矩：提示词第一行必须写死画幅，否则模型会按参考图的比例走。
REQUIRED_PROMPT_MARKER = "3:4"


def load_reference(path_str: str, repo: Path) -> bytes:
    """人脸参考图：居中裁方 + 缩到 768，再喂给中转。

    裁方是刻意的——源图多为 16:9 工作室机位，直接喂进去会把工作室陈设
    一起当成「要保留的构图」，而封面要的只有这个人。
    """
    from io import BytesIO

    from PIL import Image

    p = Path(path_str)
    if not p.is_absolute():
        p = repo / p
    if not p.exists():
        raise FileNotFoundError(f"人脸参考图不存在：{p}")
    im = Image.open(p).convert("RGB")
    w, h = im.size
    side = min(w, h)
    im = im.crop(((w - side) // 2, (h - side) // 2,
                  (w + side) // 2, (h + side) // 2)).resize((768, 768), Image.LANCZOS)
    buf = BytesIO()
    im.save(buf, format="PNG")
    return buf.getvalue()


def run(kit_path: Path, variants: int, timeout: float, repo: Path,
        dry_run: bool, env_file: str | os.PathLike | None = None,
        usage_path: str | os.PathLike = "usage.jsonl") -> int:
    """执行封面生成，返回退出码。被 main() 与可编程调用共用。"""
    if not kit_path.exists():
        print(f"[FAIL] 发布件不存在：{kit_path}", file=sys.stderr)
        return 2
    kit = json.loads(kit_path.read_text(encoding="utf-8"))
    cover = kit.get("cover") or {}

    prompt = (cover.get("prompt") or "").strip()
    if not prompt:
        print("[FAIL] cover.prompt 为空——提示词是编辑判断，本工具不代写。",
              file=sys.stderr)
        return 2
    if REQUIRED_PROMPT_MARKER not in prompt:
        print(f"[FAIL] cover.prompt 里必须显式写 {REQUIRED_PROMPT_MARKER} 画幅",
              file=sys.stderr)
        return 2

    face_ref = cover.get("faceRef")
    if not face_ref:
        print("[FAIL] cover.faceRef 未指定——不带参考图每张脸都不一样，做不成固定人设",
              file=sys.stderr)
        return 2
    try:
        ref = load_reference(face_ref, repo)
    except FileNotFoundError as e:
        print(f"[FAIL] {e}", file=sys.stderr)
        return 2

    size = cover.get("size") or DEFAULT_SIZE
    print(f"[cover-gen] {kit.get('projectId')} · {variants} 张 · {size} · 参考图 {face_ref}")
    if dry_run:
        print("[cover-gen] --dry-run：入参齐全，未打中转")
        return 0

    base, key = load_env(env_file)
    if not base or not key:
        print("[FAIL] 缺 GPT_RELAY_BASE_URL / GPT_RELAY_API_KEY", file=sys.stderr)
        return 2

    ok = 0
    for i in range(1, variants + 1):
        out = kit_path.parent / f"cover-v{i}.png"
        raw, _resp, err = call_relay(
            base, key, prompt, size, "png", timeout,
            purpose="imageflow-cover", reference_images=[ref],
            context={"projectId": kit.get("projectId"), "variant": i},
            usage_path=usage_path)
        if err or raw is None:
            print(f"  ❌ v{i} 失败：{err}")
            continue
        dims = read_dimensions(raw)
        if not dims:
            print(f"  ❌ v{i} 读不出尺寸（视同不通过）")
            continue
        ratio = dims[0] / dims[1]
        if abs(ratio - TARGET_ASPECT) >= ASPECT_TOL:
            # 不落盘：比例不对的封面留在盘上，下一步很容易被当成合格候选选走
            print(f"  ❌ v{i} 比例 {ratio:.3f} 不是 3:4（{dims[0]}×{dims[1]}），不落盘")
            continue
        out.write_bytes(raw)
        ok += 1
        print(f"  ✅ v{i} {dims[0]}×{dims[1]} 比例 {ratio:.3f} → {out.name}")

    if ok:
        print(f"[cover-gen] {ok}/{variants} 张合格。"
              "**下一步是人眼逐字核对画面中文**——模型写错字机器查不出。")
    return 0 if ok else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description="3:4 封面生成（带人脸参考图）")
    ap.add_argument("--kit", required=True, help="publish-kit.json 路径")
    ap.add_argument("--variants", type=int, default=2, help="出几张候选（默认 2）")
    ap.add_argument("--timeout", type=float, default=300.0)
    ap.add_argument("--repo", default=".", help="参考图相对路径的基准目录")
    ap.add_argument("--env-file", default=None, help=".env 路径（默认 ./ 下的 .env）")
    ap.add_argument("--usage-file", default="usage.jsonl", help="用量账本路径")
    ap.add_argument("--dry-run", action="store_true", help="只校验入参，不打中转不花钱")
    a = ap.parse_args(argv)

    repo = Path(a.repo).resolve()
    kit_path = Path(a.kit).resolve()
    return run(kit_path, a.variants, a.timeout, repo, a.dry_run,
               env_file=a.env_file, usage_path=a.usage_file)


if __name__ == "__main__":
    sys.exit(main())