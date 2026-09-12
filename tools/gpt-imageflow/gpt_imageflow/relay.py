#!/usr/bin/env python3
"""─── relay.py — gpt-image-2 出图（走中转 relay）核心客户端 ───

这是从 ameureka-media-agent 的 imageflow 产线里抽离出的**唯一中转 HTTP 调用点**。
所有出图工具（candidates / cover / cli）都必须委托这里的 `call_relay`，
不要在别处再写一份 HTTP 调用——分叉正是历史上一串 bug 的根源。

【实测标定，全部来自真跑，不是文档推断】(2026-07-27/28)

① **比例遵守，精确像素不遵守**（最容易踩的一条）
   请求 1536x864 → 实际返回 1672x941（比例 1.778 → 1.777）
   请求 1088x1920 → 实际返回 944x1665（比例 0.567 → 0.567）
   所以下游**只能断言比例，不能断言尺寸**。需要精确像素就自己 resize。

①b **响应里的 `size` 字段是请求的回显，不是真实尺寸**
   请求 100x100 → 回执写 100x100，实际 1254x1254。
   要真实尺寸只能从字节里读（`read_dimensions`）。

② **官方分辨率规则**（developers.openai.com/api/docs/models/gpt-image-2）
   任意 WIDTHxHEIGHT，宽高都须被 16 整除，比例在 1:3 到 3:1 之间，
   上限 3840x2160。本模块 PRESETS 已按此选值。
   ⚠️ 但**中转不校验**：实测传 100x100 照收照出。

③ **中文直出可行**（封面方案的关键依据）。粗黑体+橙色下划线+深底 production-ready。

④ **请求 webp**（但见 ⑤b：多半拿不到）——真正让传输变快的是什么，并未被证实。

⑤ **quality 参数被中转忽略**：传 low，回执仍是 high。别指望用它省钱。

⑤b **`output_format` 只是「建议」，且结果不稳定**
   同样传 `output_format=webp`，28 个产物里 26 个回的是 PNG（92%）。
   故：**一律按字节头决定文件名，绝不信声明**（见 `sniff_format` / `ext_for_bytes`）。

⑥ **计价**：后台账单每张 ¥0.03（≈$0.004），限流 50 RPM / 900 RPD。

⑦ **返回形式有两种**：`data[0].b64_json` 或 `data[0].url`。两种都要能处理。

⑧ **参考图（image-to-image）可用**。传 `reference_images` 走 `POST /images/edits`
   （multipart，字段名 `image[]`），不传走 `/images/generations`。
   两条路共用错误分类/返回解析/记账——参考图是入参差异，不是另一个通道。

错误分类（`call_relay` 返回的 err 前缀）：
  · `auth:`       key 无效 → 换 key
  · `quota:`      余额不足 → 充值（≠换 key！）
  · `blocked:`    中转前置 WAF 拦截 → 看 User-Agent / 请求频率，与 key 无关
  · `moderation:` 内容审核拒绝 → **按次随机**，重试
  · `http-N:`     其它 HTTP 错
  · `transport:`  连接层失败（中转会间歇性零字节挂起）→ 重试
"""
from __future__ import annotations

import base64
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
import uuid
from pathlib import Path

try:
    import certifi
    _SSL_CONTEXT = ssl.create_default_context(cafile=certifi.where())
except Exception:
    _SSL_CONTEXT = ssl.create_default_context()

# 预设分辨率——宽高均被 16 整除（官方硬要求），比例落在 1:3 ~ 3:1 内。
# ⚠️ 服务端只保证比例，不保证精确像素（见文件头 ①）。
PRESETS: dict[str, str] = {
    "16:9": "1536x864",    # 横版 / 封面
    "9:16": "1088x1920",   # 竖版
    "1:1": "1024x1024",    # 方图
    "4:3": "1024x768",
    "3:4": "768x1024",
}

# 自报家门。**必须传，否则会被中转前面的 Cloudflare 拦掉。**
# 实测：不传 UA 时 urllib 会发 `Python-urllib/3.x`，中转的 Cloudflare 回
# `HTTP 403 error code: 1010`（按浏览器签名封禁）。换成本 UA 立刻恢复。
# 这不是绕过风控：任何正经 SDK 都会声明自己是谁。请改成你的项目标识。
USER_AGENT = os.environ.get("GPT_IMAGE_USER_AGENT", "gpt-imageflow/1.0 (python-urllib)")

# ── 真实格式嗅探 ───────────────────────────────────────────────────────────
# 出图链的唯一格式判定处。为什么必须共享而不是各写一遍：历史上 TS 与 Python
# 两份实现同时带着「按声明定后缀」的洞，产物 92% 是「装在 .webp 名字里的 PNG」，
# 下游 mimeExtensionMatch 把它们整批判废而生成器自己 exit 0。
IMAGE_SIGNATURES: tuple[tuple[bytes, str], ...] = (
    (b"\x89PNG\r\n\x1a\n", "png"),
    (b"\xff\xd8\xff", "jpeg"),
)


def sniff_format(raw: bytes) -> str:
    """按字节头判真实格式，认不出回空串（调用方据此回落到声明值）。"""
    for sig, name in IMAGE_SIGNATURES:
        if raw.startswith(sig):
            return name
    # WebP 是 RIFF 容器：前 4 字节 RIFF，8-12 字节 WEBP，中间 4 字节是长度
    if len(raw) >= 12 and raw[:4] == b"RIFF" and raw[8:12] == b"WEBP":
        return "webp"
    return ""


def ext_for_bytes(raw: bytes, declared: str = "webp") -> str:
    """按**真实字节**给扩展名。认不出时才回落到声明格式。"""
    actual = sniff_format(raw) or declared
    return ".jpg" if actual == "jpeg" else f".{actual}"


def resolve_out_path(out: Path, raw: bytes, declared: str) -> Path:
    """把 `--out` 的后缀纠正为真实格式，并在纠正时**出声**。

    不静默改名是刻意的：调用方脚本可能按自己写的路径去取文件，
    改了名却不说，就把「格式错」换成了「文件找不到」——两种都是坑，
    但只有出声的那种能被看见。
    """
    want = ext_for_bytes(raw, declared)
    if out.suffix.lower() == want:
        return out
    fixed = out.with_suffix(want)
    print(f"[gpt-image] ⚠️ 声明 {declared}，中转实回 {want.lstrip('.')}，"
          f"按真实格式落盘: {fixed.name}（原请求 {out.name}）", file=sys.stderr)
    return fixed


# ── 配置加载 ──────────────────────────────────────────────────────────────
# 配置来源优先级：环境变量 > 指定 env 文件（或默认 .env）> 空。
# 与 imageflow 版不同的地方：env 文件路径可注入，这样在别的项目里也能用。


def load_env(env_file: str | os.PathLike | None = None) -> tuple[str, str]:
    """读中转配置，返回 (base_url, api_key)。**不打印 key。**
    优先取环境变量 GPT_RELAY_BASE_URL / GPT_RELAY_API_KEY；
    未设置时读 env_file（默认当前目录 / 调用方目录下的 `.env`）。
    """
    base = os.environ.get("GPT_RELAY_BASE_URL", "")
    key = os.environ.get("GPT_RELAY_API_KEY", "")

    if not env_file:
        env_file = Path(".env")
    envf = Path(env_file)
    if envf.is_file():
        for ln in envf.read_text(encoding="utf-8").splitlines():
            ln = ln.strip()
            if not ln or ln.startswith("#") or "=" not in ln:
                continue
            k, _, v = ln.partition("=")
            v = v.strip().strip('"').strip("'")
            if k.strip() == "GPT_RELAY_BASE_URL" and not base:
                base = v
            elif k.strip() == "GPT_RELAY_API_KEY" and not key:
                key = v
    return base or "", key or ""


# ── 用量记账 ──────────────────────────────────────────────────────────────


def log_usage(entry: dict, usage_path: str | os.PathLike = "usage.jsonl") -> None:
    """把一行用量写进 `usage.jsonl`。**只在 `call_relay` 里调，别处不要调。**

    成本审计教训：出图产线此前对所有计费接口零记账，审计数字全靠手工翻
    调试 JSON 求和。usage 是 API 免费返回的，落盘几乎零成本——不装计量表，
    任何省钱改动都无法被机器复核。
    """
    try:
        line = json.dumps({"at": time.strftime("%Y-%m-%dT%H:%M:%S%z"), **entry},
                          ensure_ascii=False)
        Path(usage_path).open("a", encoding="utf-8").write(line + "\n")
    except Exception:
        pass  # 记账失败绝不挡住出图结果


# ── multipart（参考图 / edits 路径需要）───────────────────────────────────


def _multipart(fields: list[tuple[str, str]],
               files: list[tuple[str, str, bytes]]) -> tuple[bytes, str]:
    """手搓 multipart/form-data（stdlib 没有，且不引第三方 HTTP 库）。"""
    boundary = f"----gptimage{uuid.uuid4().hex}"
    buf = bytearray()
    for name, value in fields:
        buf += f"--{boundary}\r\n".encode()
        buf += f'Content-Disposition: form-data; name="{name}"\r\n\r\n'.encode()
        buf += f"{value}\r\n".encode()
    for name, filename, data in files:
        buf += f"--{boundary}\r\n".encode()
        buf += f'Content-Disposition: form-data; name="{name}"; filename="{filename}"\r\n'.encode()
        buf += b"Content-Type: image/png\r\n\r\n"
        buf += data + b"\r\n"
    buf += f"--{boundary}--\r\n".encode()
    return bytes(buf), boundary


# ── 唯一的中转 HTTP 调用点 ────────────────────────────────────────────────


def call_relay(base: str, key: str, prompt: str, size: str, fmt: str,
               timeout: float, purpose: str = "unspecified",
               context: dict | None = None,
               reference_images: list[bytes] | None = None,
               usage_path: str | os.PathLike = "usage.jsonl",
               ) -> tuple[bytes | None, dict, str]:
    """打一次中转，返回 (图字节, 响应元数据, 错误分类)。**唯一的中转 HTTP 调用处。**

    参考图（image-to-image）可用：传 `reference_images` 时走
    `POST /images/edits`（multipart，字段名 `image[]`），不传走
    `/images/generations`。**两条路共用下面全部的错误分类、返回解析与记账**
    ——参考图是入参差异，不是另一个通道，所以绝不另起一个函数。
    """
    # 有参考图走 edits（multipart），没有走 generations（JSON）。
    # 分岔只到「怎么把请求发出去」为止——错误分类、返回解析、记账全部共用。
    if reference_images:
        data, boundary = _multipart(
            fields=[("model", "gpt-image-2"), ("prompt", prompt), ("size", size)],
            files=[("image[]", f"ref{i}.png", img)
                   for i, img in enumerate(reference_images)],
        )
        endpoint, content_type = "/images/edits", f"multipart/form-data; boundary={boundary}"
    else:
        data = json.dumps({
            "model": "gpt-image-2", "prompt": prompt,
            "size": size, "output_format": fmt,
        }).encode("utf-8")
        endpoint, content_type = "/images/generations", "application/json"
    req = urllib.request.Request(
        f"{base.rstrip('/')}{endpoint}", data=data,
        headers={"Content-Type": content_type, "Authorization": f"Bearer {key}",
                 "User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_SSL_CONTEXT) as r:
            resp = json.loads(r.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        raw_body = ""
        try:
            raw_body = e.read().decode("utf-8", "replace")
        except Exception:
            pass
        # 先解析 JSON 取 message，取不到才回落原文。
        # 直接在原始响应体上做子串匹配是脆的：对端若用 ensure_ascii 输出，
        # 中文会变成转义，"安全政策" 这类判据当场全部失效。
        detail = raw_body
        json_ok = False
        try:
            parsed = json.loads(raw_body)
            msg = parsed.get("error", {})
            detail = (msg.get("message") if isinstance(msg, dict) else str(msg)) or raw_body
            json_ok = True
        except Exception:
            pass
        detail = detail[:300]

        # 【基础设施拦截，不是鉴权】响应体不是 JSON、形如 `error code: 1010`，
        # 那是中转前面的 Cloudflare，不是 API 本身。必须与 auth 分开。
        cf = re.search(r"error code:\s*(\d+)", raw_body) if not json_ok else None
        if cf:
            cf_code = int(cf.group(1))
            # Cloudflare 52x 是**源站连接/超时**类（522/524 最常见），与封锁无关，
            # 该重试。1xxx 才是安全策略层（1010 按浏览器签名封禁、1015 限流）。
            if 520 <= cf_code <= 527:
                return None, {}, f"transport:cloudflare-{cf_code}（源站超时/不可达，可重试）"
            return None, {}, (f"blocked:error code: {cf_code}"
                              "（中转前置 WAF 拦截，与 key 无关：先看 User-Agent 与请求频率）")
        if "quota" in detail.lower() or "额度" in detail:
            return None, {}, f"quota:{detail[:160]}"
        if e.code in (401, 403):
            return None, {}, f"auth:{detail[:120]}"
        # 内容审核的 400 单独分类：**它是按次随机的，不是对这条 prompt 的定判。**
        # 同一条 prompt 第 1 张正常出图、第 2 张被拒（实测 ~5%）。连服务端自己的
        # 措辞都是「可能」。所以这类要重试，与「参数非法」那种真·永久 400 必须分开。
        if e.code == 400 and ("安全政策" in detail or "无法用于生成图像" in detail
                              or "safety" in detail.lower() or "moderation" in detail.lower()):
            return None, {}, f"moderation:{detail[:160]}"
        return None, {}, f"http-{e.code}:{detail[:120]}"
    except Exception as e:
        return None, {}, f"transport:{type(e).__name__}"

    if "error" in resp:
        msg = str(resp["error"])[:200]
        low = msg.lower()
        if "quota" in low or "额度" in msg:
            return None, resp, f"quota:{msg}"
        return None, resp, f"auth:{msg}" if ("auth" in low or "key" in low) else f"api:{msg}"

    item = (resp.get("data") or [{}])[0]
    # 两种返回都要能吃（中转文档说 url，实测给 b64）
    raw: bytes | None = None
    if item.get("b64_json"):
        raw = base64.b64decode(item["b64_json"])
    elif item.get("url"):
        try:
            img_req = urllib.request.Request(item["url"], headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(img_req, timeout=timeout, context=_SSL_CONTEXT) as r:
                raw = r.read()
        except Exception as e:
            return None, resp, f"fetch-url:{type(e).__name__}"
    if raw is None:
        return None, resp, "no-image-in-response"

    # 记账就放在这里——**唯一的咽喉点**。放在任何调用方身上，
    # 下一个绕过它的调用方就会让账本静默失真。
    dims = read_dimensions(raw)
    u = resp.get("usage") or {}
    log_usage({
        "api": "gpt-relay", "model": "gpt-image-2", "purpose": purpose,
        "endpoint": endpoint,
        "referenceImages": len(reference_images or []),
        "sizeRequested": size,
        "sizeEchoed": resp.get("size"),   # 回执只是请求回显，不是真实尺寸
        "sizeActual": f"{dims[0]}x{dims[1]}" if dims else None,
        "formatDeclared": fmt,
        "formatActual": sniff_format(raw) or "unknown",
        "bytes": len(raw),
        "inputTokens": u.get("input_tokens"),
        "outputTokens": u.get("output_tokens"),
        **(context or {}),
    }, usage_path=usage_path)
    return raw, resp, ""


def read_dimensions(raw: bytes) -> tuple[int, int] | None:
    """从字节里读真实像素尺寸，读不出回 None。

    【为什么不能信响应里的 `size` 字段】那个字段就是把请求原样回显。
    请求 1536x864 → 回执写 1536x864，实际 1672x941。要真实尺寸只能读字节。
    """
    if raw.startswith(b"\x89PNG\r\n\x1a\n") and len(raw) >= 24:
        return int.from_bytes(raw[16:20], "big"), int.from_bytes(raw[20:24], "big")
    if raw[:4] == b"RIFF" and raw[8:12] == b"WEBP" and len(raw) >= 30:
        chunk = raw[12:16]
        if chunk == b"VP8X":
            return (1 + int.from_bytes(raw[24:27], "little"),
                    1 + int.from_bytes(raw[27:30], "little"))
        if chunk == b"VP8 " and raw[23:26] == b"\x9d\x01\x2a":
            return (int.from_bytes(raw[26:28], "little") & 0x3FFF,
                    int.from_bytes(raw[28:30], "little") & 0x3FFF)
        if chunk == b"VP8L" and len(raw) >= 25:
            b = int.from_bytes(raw[21:25], "little")
            return (b & 0x3FFF) + 1, ((b >> 14) & 0x3FFF) + 1
    if raw[:3] == b"\xff\xd8\xff":
        i = 2
        while i + 9 < len(raw):
            if raw[i] != 0xFF:
                i += 1
                continue
            marker = raw[i + 1]
            if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                return (int.from_bytes(raw[i + 7:i + 9], "big"),
                        int.from_bytes(raw[i + 5:i + 7], "big"))
            i += 2 + int.from_bytes(raw[i + 2:i + 4], "big")
    return None


def is_permanent(err: str) -> bool:
    """这个错误重试还有意义吗？

    分三类：
      · 真·永久：auth / quota / 参数非法的 4xx —— 重试是纯浪费
      · **随机**：`moderation:` 内容审核拒绝 —— 值得重试
      · 暂时：429 / 5xx / transport —— 重试
    """
    if err.startswith("moderation"):
        return False
    # WAF 拦截：重试毫无意义，而且**对着风控猛敲正是最糟的反应**。
    if err.startswith("blocked"):
        return True
    if err.startswith(("auth", "quota")):
        return True
    m = re.match(r"http-(\d{3})", err)
    if m:
        code = int(m.group(1))
        return 400 <= code < 500 and code != 429
    return False


def generate(prompt: str, size: str, out: Path, fmt: str = "webp",
             timeout: int = 300, retries: int = 2,
             env_file: str | os.PathLike | None = None,
             usage_path: str | os.PathLike = "usage.jsonl") -> dict | None:
    """单张出图到文件。失败返回 None。永久错误不再重试。"""
    base, key = load_env(env_file)
    if not base or not key:
        print("[gpt-image] 缺 GPT_RELAY_BASE_URL / GPT_RELAY_API_KEY"
              "（写进 .env）", file=sys.stderr)
        raise SystemExit(2)

    last_err = None
    for attempt in range(1, retries + 2):
        t0 = time.time()
        raw, resp, err = call_relay(base, key, prompt, size, fmt, timeout,
                                    purpose="cli", usage_path=usage_path)

        if is_permanent(err):
            hint = ("余额不足——去充值，不要换 key" if err.startswith("quota")
                    else "key 被拒——换一把" if err.startswith("auth")
                    else "请求本身被拒（内容策略/参数非法），换 prompt，重试无用")
            print(f"[gpt-image] ❌ {hint}: {err[:200]}", file=sys.stderr)
            return None
        if not raw:
            last_err = err
            print(f"[gpt-image] 第 {attempt} 次失败（{time.time()-t0:.0f}s）: {err}",
                  file=sys.stderr)
            if attempt <= retries:
                time.sleep(5 * attempt)
            continue

        out = resolve_out_path(out, raw, fmt)
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_bytes(raw)
        # 把**真实落盘路径**交回调用方：后缀可能已被 resolve_out_path 纠正。
        resp["_savedPath"] = str(out)
        print(f"[gpt-image] ✅ {out}  {len(raw)/1024:.0f}KB  "
              f"请求 {size} → 服务端回执 {resp.get('size')}  "
              f"实际格式 {sniff_format(raw) or '未知'}  {time.time()-t0:.0f}s")
        return resp

    print(f"[gpt-image] 重试用尽: {last_err}", file=sys.stderr)
    return None