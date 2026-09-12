const test = require("node:test");
const assert = require("node:assert/strict");
const { patchSource } = require("../scripts/patch-html2pptx");

test("patches converter source in memory and is idempotent", () => {
  const anchor = "let imagePath = el.src.startsWith('file://') ? el.src.replace('file://', '') : el.src;";
  const original = `function x() {\n  ${anchor}\n}`;
  const first = patchSource(original);
  assert.equal(first.changed, true);
  assert.match(first.source, /decodeURIComponent\(imagePath\)/);
  const second = patchSource(first.source);
  assert.equal(second.changed, false);
  assert.equal(second.source, first.source);
  assert.equal(original.includes("decodeURIComponent"), false);
});

test("fails clearly when converter anchor is unknown", () => {
  assert.throws(() => patchSource("module.exports = async () => {};"), /锚点不匹配/);
});
