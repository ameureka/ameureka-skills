// _ppt-kit 主题 token + 共享 CSS(深色技术风)
// 教训沉淀(详见 README 坑位清单):
//  1. 特例类必须联合选择器抬特异性:.card p.bignum 压过 .card p
//  2. footer 默认绝对定位:内容超界被截断/报告,而不是把页脚顶出画布
//  3. 文本必须包在 p/h/ul/ol 里,样式 div 会变形状(html2pptx 规则)

const C = {
  bg: "#0e1626",        // 深蓝黑
  bgSoft: "#152036",
  panel: "#1a2740",
  ink: "#eef2f8",
  muted: "#93a1b8",
  accent: "#d6ff35",    // 荧光绿(报名站主题色)
  coral: "#ff7b63",     // 珊瑚色
  blue: "#4da3ff",
  gold: "#ffd166",
  line: "#2a3a58",
};

function baseCSS(overrides = {}) {
  const T = { ...C, ...overrides };
  return `
  html { background: ${T.bg}; }
  body {
    width: 720pt; height: 405pt; margin: 0; padding: 0;
    background: ${T.bg}; color: ${T.ink};
    font-family: Arial, Helvetica, sans-serif;
    display: flex; flex-direction: column;
  }
  /* padding-bottom 48pt 为绝对定位 footer 预留空间,内容区 327pt */
  .slide { position: relative; width: 720pt; height: 405pt; display: flex; flex-direction: column; padding: 30pt 40pt 48pt; box-sizing: border-box; overflow: hidden; }
  .kicker { color: ${T.accent}; font-size: 12pt; letter-spacing: 2pt; margin: 0 0 6pt 0; }
  .title { font-size: 30pt; font-weight: bold; margin: 0 0 8pt 0; line-height: 1.15; }
  .subtitle { font-size: 14pt; color: ${T.muted}; margin: 0 0 18pt 0; line-height: 1.5; }
  /* footer 绝对定位:不再参与 flex 流,内容溢出时不会被顶出画布 */
  .footer { position: absolute; left: 40pt; right: 40pt; bottom: 14pt; margin: 0; padding-top: 12pt; border-top: 1pt solid ${T.line}; display: flex; }
  .footer p { font-size: 9pt; color: ${T.muted}; margin: 0; }
  .accent { color: ${T.accent}; } .coral { color: ${T.coral}; }
  .blue { color: ${T.blue}; } .gold { color: ${T.gold}; } .muted { color: ${T.muted}; }

  .bignum { font-size: 54pt; font-weight: bold; color: ${T.accent}; margin: 0; line-height: 1; }
  .bignum-coral { font-size: 54pt; font-weight: bold; color: ${T.coral}; margin: 0; line-height: 1; }
  .numlabel { font-size: 11pt; color: ${T.muted}; margin: 4pt 0 0 0; }
  /* 卡片内大数字:提高特异性,压过 .card p */
  .card p.bignum { font-size: 38pt; font-weight: bold; color: ${T.accent}; margin: 0; line-height: 1; }
  .card p.bignum-coral { font-size: 38pt; font-weight: bold; color: ${T.coral}; margin: 0; line-height: 1; }
  .card p.numlabel { font-size: 11pt; color: ${T.muted}; margin: 6pt 0 0 0; }

  .cards { display: flex; margin: 8pt -6pt 0 -6pt; }
  .card { background: ${T.panel}; border: 1pt solid ${T.line}; border-radius: 8pt; padding: 14pt; margin: 0 6pt; flex: 1; }
  .card h3 { font-size: 14pt; margin: 0 0 6pt 0; color: ${T.ink}; }
  .card p { font-size: 10.5pt; color: ${T.muted}; margin: 0; line-height: 1.45; }
  .card .tag { color: ${T.accent}; font-size: 10pt; font-weight: bold; margin: 0 0 4pt 0; }

  ul.clean { margin: 6pt 0; padding-left: 18pt; }
  ul.clean li { font-size: 12pt; color: ${T.ink}; margin: 6pt 0; line-height: 1.4; }
  ul.clean li b { color: ${T.accent}; }

  .quote { background: ${T.bgSoft}; border-left: 6pt solid ${T.accent}; padding: 18pt 22pt; border-radius: 0 8pt 8pt 0; margin: 12pt 0; }
  .quote p { font-size: 16pt; color: ${T.ink}; margin: 0; line-height: 1.5; }
  .quote.tight { padding: 10pt 16pt; }
  .quote.tight p { font-size: 13pt; }

  .section { justify-content: center; }
  .section .secno { font-size: 72pt; font-weight: bold; color: ${T.accent}; margin: 0; line-height: 1; }
  .section .sectitle { font-size: 40pt; font-weight: bold; margin: 10pt 0; }
  .section .secsub { font-size: 16pt; color: ${T.muted}; margin: 0; }

  .table { width: 100%; border-collapse: collapse; margin-top: 8pt; }
  .table p { margin: 0; font-size: 11pt; }
  .trow { display: flex; border-bottom: 1pt solid ${T.line}; padding: 7pt 4pt; }
  .trow.head { border-bottom: 2pt solid ${T.accent}; }
  .trow.head p { color: ${T.accent}; font-weight: bold; font-size: 11pt; }
  .tcell { flex: 1; } .tcell.rank { flex: 0 0 40pt; color: ${T.muted}; }
  .tcell.score { flex: 0 0 60pt; text-align: right; color: ${T.gold}; font-weight: bold; }

  /* 双列榜单 */
  .twocol { display: flex; margin: 4pt -8pt 0 -8pt; }
  .twocol .table { margin: 0 8pt; flex: 1; }
  .twocol .trow { padding: 6pt 4pt; }
  .twocol .trow p { font-size: 10.5pt; }

  /* 截图相框:白底图走白卡,深色图走面板框 */
  .shot { background: #ffffff; border-radius: 8pt; padding: 6pt; }
  .shot img { width: 100%; display: block; }
  .shot-dark { background: ${T.panel}; border: 1pt solid ${T.line}; border-radius: 8pt; padding: 5pt; }
  .shot-dark img { width: 100%; display: block; }
  /* 并排多图(自带标题行)时的容器:由调用方通过 style 给 maxHeight,内部图按宽缩放 */
  .shot-h { background: ${T.panel}; border: 1pt solid ${T.line}; border-radius: 8pt; padding: 5pt; }
  .shot-h img { width: 100%; height: auto; display: block; border-radius: 4pt; }
  .row { display: flex; }

  /* 侧列统计卡 */
  .stat { background: ${T.panel}; border: 1pt solid ${T.line}; border-radius: 8pt; padding: 8pt 14pt; margin-bottom: 8pt; }
  .stat p { margin: 0; }
  .stat p.sv { font-size: 20pt; font-weight: bold; color: ${T.accent}; line-height: 1.1; }
  .stat p.sl { font-size: 10pt; color: ${T.muted}; margin-top: 2pt; line-height: 1.2; }
  `;
}

module.exports = { C, baseCSS };
