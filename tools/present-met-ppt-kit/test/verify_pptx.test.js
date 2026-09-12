const test = require("node:test");
const assert = require("node:assert/strict");
const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const verifier = path.join(__dirname, "../scripts/verify_pptx.py");
const image = path.join(__dirname, "../fixtures/minimal/source/fixture.png");

function createFixturePptx() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "present-met-verify-"));
  const output = path.join(dir, "fixture.pptx");
  const script = [
    "from pptx import Presentation",
    "from pptx.util import Inches",
    "prs = Presentation()",
    "prs.slide_width = Inches(10)",
    "prs.slide_height = Inches(5.625)",
    "blank = prs.slide_layouts[6]",
    "prs.slides.add_slide(blank).shapes.add_textbox(Inches(1), Inches(1), Inches(2), Inches(1))",
    `prs.slides.add_slide(blank).shapes.add_picture(r"${image}", Inches(1), Inches(1), width=Inches(2))`,
    `prs.save(r"${output}")`,
  ].join("; ");
  const result = spawnSync("python3", ["-c", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return output;
}

test("strict verifier accepts a valid fixture PPTX", () => {
  const pptx = createFixturePptx();
  const result = spawnSync("python3", [
    verifier, pptx, "--expected-count", "2", "--aspect", "16:9", "--picture-counts", "0,1",
  ], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("strict verifier rejects incorrect page and picture counts", () => {
  const pptx = createFixturePptx();
  const result = spawnSync("python3", [
    verifier, pptx, "--expected-count", "3", "--aspect", "16:9", "--picture-counts", "0,0",
  ], { encoding: "utf8" });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /页数不符/);
  assert.match(result.stderr, /图片计数不符/);
});
