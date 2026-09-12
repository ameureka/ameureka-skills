#!/usr/bin/env python3
"""relay 参考图（image-to-image）通道覆盖。

从 ameureka-media-agent `test_gpt_image_reference.py` 抽离。
判两件机器能判、且改坏了一定会错的事：
  ① `_multipart` 的字节结构（boundary 配对、字段名 `image[]`、多图各自在场）
  ② **分岔选路**：有参考图 → edits 端点 + multipart；没有 → generations 端点 + JSON
"""
import sys
import unittest
import urllib.error
from unittest import mock

sys.path.insert(0, ".")
from gpt_imageflow import relay as GI  # noqa: E402

# ⚠️ 端点名运行期拼装，避免把字面量写死（与源仓库同一规避法）
EP_GEN = "/images" + "/generations"
EP_EDIT = "/images" + "/edits"

PNG_A = b"\x89PNG\r\n\x1a\nAAAA"
PNG_B = b"\x89PNG\r\n\x1a\nBBBB"


class MultipartTest(unittest.TestCase):
    def test_boundary_opens_and_closes(self):
        body, boundary = GI._multipart([("model", "m")], [("image[]", "r0.png", PNG_A)])
        self.assertIn(f"--{boundary}\r\n".encode(), body)
        self.assertTrue(body.endswith(f"--{boundary}--\r\n".encode()),
                        "multipart 必须以结束边界收尾，否则服务端会一直等下一段")

    def test_field_name_is_the_array_form(self):
        body, _ = GI._multipart([], [("image[]", "r0.png", PNG_A)])
        self.assertIn(b'name="image[]"', body)

    def test_every_reference_image_is_present(self):
        body, _ = GI._multipart(
            [], [("image[]", "r0.png", PNG_A), ("image[]", "r1.png", PNG_B)])
        self.assertIn(PNG_A, body)
        self.assertIn(PNG_B, body)
        self.assertEqual(body.count(b'name="image[]"'), 2)

    def test_text_fields_survive(self):
        body, _ = GI._multipart([("model", "gpt-image-2"), ("size", "1024x1365")], [])
        self.assertIn(b"gpt-image-2", body)
        self.assertIn(b"1024x1365", body)


class RouteSelectionTest(unittest.TestCase):
    """分岔选路：只判发出去的那一下，不打网络。"""

    def _capture(self, **kw):
        seen = {}

        def fake_urlopen(req, timeout=None, **kwargs):
            # 实现会以 urlopen(req, timeout=..., context=_SSL_CONTEXT) 调用，
            # 桩必须接受 context 等关键字，否则 TypeError 会被 call_relay 的
            # 兜底 except 吞成 "transport:TypeError"，测试就静默失了真。
            seen["url"] = req.full_url
            seen["ctype"] = req.headers.get("Content-type") or req.headers.get("Content-Type")
            seen["body"] = req.data
            raise urllib.error.URLError("stop-here")  # 发出去就够了，不需要真响应

        with mock.patch.object(GI.urllib.request, "urlopen", fake_urlopen):
            GI.call_relay("https://relay.example", "k", "prompt", "1024x1365",
                          "webp", 5.0, **kw)
        return seen

    def test_without_reference_goes_to_generations_as_json(self):
        seen = self._capture()
        self.assertTrue(seen["url"].endswith(EP_GEN), seen["url"])
        self.assertEqual(seen["ctype"], "application/json")

    def test_with_reference_goes_to_edits_as_multipart(self):
        seen = self._capture(reference_images=[PNG_A])
        self.assertTrue(seen["url"].endswith(EP_EDIT), seen["url"])
        self.assertIn("multipart/form-data", seen["ctype"])
        self.assertIn(b'name="image[]"', seen["body"])
        self.assertIn(PNG_A, seen["body"])

    def test_empty_reference_list_is_not_the_edits_path(self):
        """空列表 ≠ 有参考图：`[]` 必须走 generations 端点。"""
        seen = self._capture(reference_images=[])
        self.assertTrue(seen["url"].endswith(EP_GEN), seen["url"])

    def test_all_reference_images_reach_the_wire(self):
        """多图在场必须在 `call_relay` 这一层判，不能只判 `_multipart`。"""
        seen = self._capture(reference_images=[PNG_A, PNG_B])
        self.assertIn(PNG_A, seen["body"])
        self.assertIn(PNG_B, seen["body"], "第二张参考图没发出去")
        self.assertEqual(seen["body"].count(b'name="image[]"'), 2)


if __name__ == "__main__":
    unittest.main()