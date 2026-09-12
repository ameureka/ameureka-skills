#!/usr/bin/env python3
"""─── candidates.py — 批量候选图生成（gpt-image-2 走中转）───

从 ameureka-media-agent imageflow 的 `generate-gpt-candidates.py` 抽离。
输入是 `image-generation-requests.v1` 批（requests[] 里取 beatId / prompt /
outputPrefix），逐张出图，输出候选图 + 汇总结果 JSON。

【契约（下游依赖，不许改）】
  · 输入：image-generation-requests.v1（requests[] 里取 beatId / prompt / outputPrefix）
  · 输出图名：`{outputPrefix}-gpt-01.{ext}`（后缀按字节头定，见下）
  · 汇总日志：out-dir 下的 `*-generation-results.json`

【与 imageflow 版相同的实测标定】
  ① 尺寸传像素不传比例：gpt-image-2 要 `size="WIDTHxHEIGHT"`（宽高被 16 整除、1:3~3:1）
  ② 只保证比例，不保证精确像素（请求 1536×864 实回 1672×941）
  ③ 请求 webp 但后缀按字节头定——中转对同一 output_format 有时回 webp 有时回 PNG
     （实测 92% 是 PNG）。按声明定后缀会让「装在 .webp 名字里的 PNG」整批判废。
  ④ quality 参数被中转忽略，不传。
  ⑤ 返回形式两种都要能吃：b64_json 或 url。

用法:
    python3 -m gpt_imageflow.candidates \\
      --requests image-generation-requests.json --out-dir candidates \\
      --aspect-ratio 16:9 --timeout 120

退出码: 0=全部成功 / 1=有失败或跳过 / 2=鉴权失败（换 key）/ 3=余额不足（充值）
        ⚠️ 2 与 3 必须分开：中转把余额不足也回 403，混判会把人引去换 key。
"""
from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from .relay import PRESETS, call_relay, ext_for_bytes, is_permanent, sniff_format


def _load_env(env_file: str | os.PathLike | None) -> tuple[str, str]:
    """读中转配置。**不打印 key。** 复用 relay.load_env。"""
    from .relay import load_env

    return load_env(env_file)


def assert_not_old_line_output(p: Path) -> None:
    """禁止把产物写进老线目录（imageflow 版同名的守卫）。"""
    s = str(p)
    if "/shipinhao-spec/" in s and "/imageflow/" not in s:
        raise RuntimeError(f"refusing to write into old-line path: {p}")


def run(requests_path: Path, out_dir: Path, model: str,
        limit: int, max_attempts: int, timeout: float,
        aspect_ratio: str, output_format: str, dry_run: bool,
        env_file: str | os.PathLike | None = None,
        usage_path: str | os.PathLike = "usage.jsonl") -> int:
    """执行批量生成，返回退出码。被 main() 与可编程调用共用。"""
    batch = json.loads(requests_path.read_text(encoding="utf-8"))
    requests = batch.get("requests")
    if not isinstance(requests, list) or not requests:
        raise RuntimeError("request batch must include requests[]")
    if limit:
        requests = requests[:limit]

    size = PRESETS[aspect_ratio]
    # ⚠️ 扩展名**不能在这里按 output_format 定死**——中转对同一个
    # `output_format=webp` 有时回 webp 有时回 PNG（实测 92% 是 PNG），
    # 只能等字节到手后逐张判。见每张图落盘处的 ext_for_bytes。
    out_dir.mkdir(parents=True, exist_ok=True)

    base, key = _load_env(env_file)
    if not dry_run and (not base or not key):
        print("[FAIL] 缺 GPT_RELAY_BASE_URL / GPT_RELAY_API_KEY（写进 .env）",
              file=sys.stderr)
        return 2

    results, passed, failed, skipped = [], 0, 0, 0
    auth_failed = False
    quota_exhausted = False
    t_all = time.monotonic()

    for index, request in enumerate(requests, start=1):
        beat_id = request["beatId"]
        prefix = request.get("outputPrefix") or beat_id
        prompt = request["prompt"]
        t0 = time.monotonic()
        attempts, saved, last_err, out_name = 0, False, "", ""

        if auth_failed or quota_exhausted:
            skipped += 1
            results.append({"beatId": beat_id, "status": "skipped",
                            "error": "aborted after quota exhaustion" if quota_exhausted
                                     else "aborted after auth failure"})
            continue

        if dry_run:
            print(f"[{index}/{len(requests)}] DRY {beat_id} size={size} fmt={output_format}")
            passed += 1
            results.append({"beatId": beat_id, "status": "dry-run", "size": size})
            continue

        while attempts < max_attempts and not saved:
            attempts += 1
            data, resp, err = call_relay(base, key, prompt, size, output_format, timeout,
                                         purpose="imageflow", context={"beatId": beat_id},
                                         usage_path=usage_path)
            if err.startswith("auth"):
                auth_failed = True
                last_err = err
                break
            if is_permanent(err) and not err.startswith(("auth", "quota")):
                # 4xx（429 除外）是对**这条 prompt** 的判决，不是「现在不行」。
                # 只跳过这一条，不像 auth/quota 那样中止整批。
                last_err = err
                break
            if err.startswith("quota"):
                quota_exhausted = True
                last_err = err
                break
            if data:
                # 按真实字节头定后缀。写错了下游 mimeExtensionMatch 会整批判废。
                actual = sniff_format(data)
                ext = ext_for_bytes(data, output_format)
                out_path = out_dir / f"{prefix}-gpt-01{ext}"
                assert_not_old_line_output(out_path)
                out_path.write_bytes(data)
                saved = True
                out_name = out_path.name
                u = resp.get("usage") or {}
                mismatch = "" if actual == output_format else f" ⚠️声明{output_format}实回{actual or '未知'}"
                print(f"[{index}/{len(requests)}] PASS {beat_id} "
                      f"{len(data)//1024}KB 请求 {size} → 回执 {resp.get('size')}{mismatch} "
                      f"({time.monotonic()-t0:.0f}s, 第 {attempts} 次)")
            else:
                last_err = err
                # 中转实测会间歇性零字节挂起，退避重试
                if attempts < max_attempts:
                    time.sleep(3 * attempts)

        if saved:
            passed += 1
            results.append({"beatId": beat_id, "status": "pass", "attempts": attempts,
                            "durationMs": int((time.monotonic()-t0)*1000),
                            "output": out_name})
        else:
            failed += 1
            results.append({"beatId": beat_id, "status": "fail", "attempts": attempts,
                            "error": last_err})
            print(f"[{index}/{len(requests)}] FAIL {beat_id}: {last_err}", file=sys.stderr)

    total_ms = int((time.monotonic() - t_all) * 1000)
    print(f"[SUMMARY] {passed} pass / {failed} fail / {skipped} skipped "
          f"of {len(requests)} requests in {total_ms}ms")

    log_path = out_dir / "gpt-generation-results.json"
    assert_not_old_line_output(log_path)
    log_path.write_text(json.dumps({
        "schemaVersion": "imageflow.gpt-generation-results.v1",
        "model": model, "relay": base.rstrip("/"),
        "requestBatch": str(requests_path),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "maxAttempts": max_attempts, "timeoutSeconds": timeout,
        "aspectRatio": aspect_ratio, "sizeRequested": size,
        "outputFormatRequested": output_format,
        "sizeCaveat": "中转只保证比例不保证精确像素（实测 1536x864 → 1672x941）",
        "formatCaveat": "output_format 只是建议：同一请求实测 92% 回 PNG、8% 回 webp。"
                        "文件名按字节头定，故 results[].output 的后缀才是真实格式。",
        "summary": {"requested": len(requests), "passed": passed,
                    "failed": failed, "skipped": skipped, "durationMs": total_ms},
        "results": results,
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    if quota_exhausted:
        print("[FAIL] aborted: 中转账户余额不足——**去充值，不要换 key**。"
              "（每张 ¥0.03；余额可在中转后台查）",
              file=sys.stderr)
        return 3
    if auth_failed:
        print("[FAIL] aborted: GPT_RELAY_API_KEY was rejected (rotate/export a valid key)",
              file=sys.stderr)
        return 2
    return 0 if failed == 0 and skipped == 0 and passed == len(requests) else 1


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--requests", required=True, help="Path to image-generation-requests.json")
    ap.add_argument("--out-dir", required=True, help="Directory to write generated candidate images")
    ap.add_argument("--model", default="gpt-image-2", help="模型 id（中转当前只挂这一个）")
    ap.add_argument("--limit", type=int, default=0, help="Limit number of requests, 0 means all")
    ap.add_argument("--max-attempts", type=int, default=3, help="Attempts per request before giving up")
    ap.add_argument("--timeout", type=float, default=120.0, help="Per-attempt timeout in seconds")
    ap.add_argument("--aspect-ratio", default="16:9", choices=sorted(PRESETS),
                    help="出图比例（内部映射到像素；中转只保证比例不保证精确像素）")
    ap.add_argument("--output-format", default="webp", choices=["webp", "png", "jpeg"],
                    help="默认 webp——PNG 大响应在中转侧实测会零字节挂起")
    ap.add_argument("--env-file", default=None, help=".env 路径（默认 ./ 下的 .env）")
    ap.add_argument("--usage-file", default="usage.jsonl", help="用量账本路径")
    ap.add_argument("--dry-run", action="store_true", help="校验请求但不调 API")
    a = ap.parse_args(argv)

    requests_path = Path(a.requests).resolve()
    out_dir = Path(a.out_dir).resolve()
    return run(requests_path, out_dir, a.model, a.limit, a.max_attempts, a.timeout,
               a.aspect_ratio, a.output_format, a.dry_run,
               env_file=a.env_file, usage_path=a.usage_file)


if __name__ == "__main__":
    sys.exit(main())