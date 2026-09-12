const test = require("node:test");
const assert = require("node:assert/strict");
const { parseArgs } = require("../bin/ppt-kit");

 test("parses command, directory and converter path", () => {
  const args = parseArgs(["build", "--dir", "中文 deck", "--html2pptx", "converter.js", "--thumb"]);
  assert.equal(args.command, "build");
  assert.equal(args.html2pptx, "converter.js");
  assert.equal(args.thumb, true);
  assert.match(args.dir, /中文 deck$/);
});

test("rejects missing option values", () => {
  assert.throws(() => parseArgs(["build", "--dir"]), /缺少.*--dir|path/i);
  assert.throws(() => parseArgs(["build", "--html2pptx"]), /缺少.*--html2pptx|path/i);
});
