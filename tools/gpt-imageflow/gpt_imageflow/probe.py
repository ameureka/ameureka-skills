#!/usr/bin/env python3
"""─── probe.py — 探测第三方 GPT 图像中转的真实能力（接入前必跑）───

从 ameureka-media-agent imageflow 的 `probe_gpt_relay.py` 抽离。

用途：中转站常见「号称 OpenAI 兼容，实际少支持一半参数」。本脚本把几条
可能的路径都打一遍，把真实返回结构摸清楚，再决定生成器怎么写——避免写完返工。

用法:
    export GPT_RELAY_BASE_URL=https://your-relay.com/v1
    export GPT_RELAY_API_KEY=sk-xxxx
    python3 -m gpt_imageflow.probe [--out-dir _probe-out]

输出：控制台报告 + probe-result.json（不含 key）+ 探出的图
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

BASE_URL = os.environ.get("GPT_RELAY_BASE_URL", "").rstrip("/")
API_KEY = os.environ.get("GPT_RELAY_API_KEY", "")
MODEL = os.environ.get("GPT_RELAY_MODEL", "gpt-image-2")

PROMPT = (
    "A clean 16:9 minimal tech illustration: a single abstract pipeline of "
    "connected nodes on a dark navy background, cyan and magenta accent lighting, "
    "flat vector style, no text, no letters, no words."
)


def _post(url: str, payload: dict, timeout: int = 120):
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
        },
        method="POST",
    )
    started = time.monotonic()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", "replace")
            return resp.status, body, time.monotonic() - started
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace"), time.monotonic() - started
    except Exception as e:  # noqa: BLE001
        return 0, f"{type(e).__name__}: {e}", time.monotonic() - started


def _get(url: str, timeout: int = 30):
    req = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {API_KEY}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status, resp.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8", "replace")
    except Exception as e:  # noqa: BLE001
        return 0, f"{type(e).__name__}: {e}"


def _shape(body: str, maxlen: int = 600) -> dict:
    """返回结构摘要：顶层键、是否含 b64、是否含 url。"""
    out: dict = {"raw_head": body[:maxlen]}
    try:
        d = json.loads(body)
    except Exception:  # noqa: BLE001
        out["parsed"] = False
        return out
    out["parsed"] = True
    out["topKeys"] = list(d) if isinstance(d, dict) else f"list[{len(d)}]"
    flat = json.dumps(d)[:200000]
    out["hasB64Json"] = '"b64_json"' in flat
    out["hasUrlField"] = '"url"' in flat
    out["hasDataUri"] = "data:image" in flat
    out["approxBytes"] = len(body)
    return out


def _save_image_if_any(body: str, tag: str, out_dir: Path) -> str | None:
    """从返回里尽力抠出图片存盘，验证是不是真出图。"""
    try:
        d = json.loads(body)
    except Exception:  # noqa: BLE001
        return None
    out_dir.mkdir(parents=True, exist_ok=True)

    # 标准 images 接口：data[].b64_json / data[].url
    for item in (d.get("data") or []) if isinstance(d, dict) else []:
        if isinstance(item, dict) and item.get("b64_json"):
            p = out_dir / f"{tag}.png"
            p.write_bytes(base64.b64decode(item["b64_json"]))
            return str(p)
        if isinstance(item, dict) and item.get("url"):
            return f"URL: {item['url']}"

    # chat 接口：图片可能塞在 message.content 里（data-uri 或 markdown 链接）
    try:
        content = d["choices"][0]["message"]["content"]
    except Exception:  # noqa: BLE001
        return None
    if isinstance(content, str):
        if "data:image" in content:
            b64 = content.split("base64,", 1)[-1].split(")", 1)[0].split('"', 1)[0].strip()
            try:
                p = out_dir / f"{tag}.png"
                p.write_bytes(base64.b64decode(b64))
                return str(p)
            except Exception:  # noqa: BLE001
                return "data-uri present but undecodable"
        if "http" in content:
            return f"content contains link: {content[:200]}"
    return None


def main(argv: list[str] | None = None) -> int:
    global BASE_URL, API_KEY, MODEL
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--base-url", default=BASE_URL, help="中转 base URL（默认取环境变量）")
    ap.add_argument("--api-key", default=API_KEY, help="API key（默认取环境变量）")
    ap.add_argument("--model", default=MODEL, help="模型 id")
    ap.add_argument("--out-dir", default="_probe-out", help="图片落盘目录")
    a = ap.parse_args(argv)

    BASE_URL = a.base_url.rstrip("/")
    API_KEY = a.api_key
    MODEL = a.model
    out_dir = Path(a.out_dir)

    if not BASE_URL or not API_KEY:
        print("Error: 需要 GPT_RELAY_BASE_URL 和 GPT_RELAY_API_KEY"
              "（或 --base-url / --api-key）", file=sys.stderr)
        return 2

    report: dict = {"baseUrl": BASE_URL, "model": MODEL, "probes": {}}

    print(f"\n探测 {BASE_URL}  model={MODEL}\n" + "=" * 60)

    # ── 1. 模型清单 ──
    print("\n[1] GET /models —— 中转支持哪些模型")
    code, body = _get(f"{BASE_URL}/models")
    ids = []
    try:
        ids = [m.get("id") for m in json.loads(body).get("data", [])]
    except Exception:  # noqa: BLE001
        pass
    image_models = [i for i in ids if i and ("image" in i or "dall" in i)]
    print(f"    HTTP {code} | 共 {len(ids)} 个模型")
    print(f"    图像类: {image_models or '（清单里没找到，不代表不能用）'}")
    report["probes"]["models"] = {"status": code, "count": len(ids), "imageModels": image_models}

    # ── 2. 标准图像接口 ──
    print("\n[2] POST /images/generations —— 标准 OpenAI 图像接口")
    code, body, dt = _post(f"{BASE_URL}/images/generations", {
        "model": MODEL, "prompt": PROMPT, "n": 1, "size": "1792x1024",
    })
    print(f"    HTTP {code} | {dt:.1f}s")
    saved = _save_image_if_any(body, "probe-images-endpoint", out_dir) if code == 200 else None
    print(f"    出图: {saved or '否'}")
    if code != 200:
        print(f"    错误: {body[:300]}")
    report["probes"]["imagesEndpoint"] = {"status": code, "elapsedSec": round(dt, 1),
                                          "saved": saved, **_shape(body)}

    # ── 3. 对话接口 ──
    print("\n[3] POST /chat/completions —— 对话路径")
    code, body, dt = _post(f"{BASE_URL}/chat/completions", {
        "model": MODEL,
        "messages": [{"role": "user", "content": PROMPT}],
    })
    print(f"    HTTP {code} | {dt:.1f}s")
    saved = _save_image_if_any(body, "probe-chat-endpoint", out_dir) if code == 200 else None
    print(f"    出图: {saved or '否（可能只回了文字）'}")
    if code != 200:
        print(f"    错误: {body[:300]}")
    report["probes"]["chatEndpoint"] = {"status": code, "elapsedSec": round(dt, 1),
                                        "saved": saved, **_shape(body)}

    # ── 4. 16:9 / 分辨率参数支持 ──
    print("\n[4] 参数支持探测 —— aspect_ratio / resolution（gpt-image-2 新参数）")
    for label, payload in [
        ("aspect_ratio=16:9", {"model": MODEL, "prompt": PROMPT, "aspect_ratio": "16:9"}),
        ("resolution=1K", {"model": MODEL, "prompt": PROMPT, "resolution": "1K"}),
        ("size=1024x1024", {"model": MODEL, "prompt": PROMPT, "size": "1024x1024"}),
    ]:
        code, body, dt = _post(f"{BASE_URL}/images/generations", payload, timeout=90)
        ok = "✅ 接受" if code == 200 else f"❌ HTTP {code}"
        print(f"    {label:24s} {ok}")
        report["probes"].setdefault("params", {})[label] = {
            "status": code, "err": None if code == 200 else body[:200]}

    # ── 5. 中文文字直出（封面用） ──
    print("\n[5] 中文直出测试 —— 封面能不能让模型自己写中文")
    cn_prompt = (
        "A YouTube thumbnail, 16:9, dark navy background with cyan and magenta neon. "
        'Large bold Chinese headline text reading exactly: "工厂级流水线". '
        "The Chinese characters must be rendered correctly and legibly, "
        "sharp, high contrast, centered."
    )
    code, body, dt = _post(f"{BASE_URL}/images/generations",
                           {"model": MODEL, "prompt": cn_prompt, "size": "1792x1024"},
                           timeout=120)
    saved = _save_image_if_any(body, "probe-chinese-text", out_dir) if code == 200 else None
    print(f"    HTTP {code} | {dt:.1f}s | 出图: {saved or '否'}")
    print("    ⚠️  出图后请人眼看一下：「工厂级流水线」五个字对不对、有没有缺笔画")
    report["probes"]["chineseText"] = {"status": code, "saved": saved}

    # ── 汇总 ──
    out = Path("probe-result.json")
    out.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")

    print("\n" + "=" * 60)
    print(f"报告: {out}")
    print(f"图片: {out_dir}")
    print("\n把报告和图片发我，我据此写生成器。")
    return 0


if __name__ == "__main__":
    sys.exit(main())