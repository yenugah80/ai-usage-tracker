// AI Usage Tracker — Scriptable iOS Widget
// Install: 1) Download "Scriptable" from App Store
//          2) Create new script, paste this code
//          3) Add Scriptable widget to home screen
//          4) Edit widget → choose this script
//          5) Parameter: "small", "medium", or "large"

const DATA_URL = null; // e.g. "https://your-api.com/usage.json"

const C = {
  bg: new Color("#0a0a12"), bg2: new Color("#12121c"), bg3: new Color("#1a1a28"),
  border: new Color("#1e1e30"), text: new Color("#e8e8f0"), dim: new Color("#7a7a9a"),
  muted: new Color("#3e3e56"), claude: new Color("#d4a574"), claudeBg: new Color("#d4a574", 0.12),
  codex: new Color("#10a37f"), codexBg: new Color("#10a37f", 0.12),
  accent: new Color("#7c6aef"), green: new Color("#22c55e"), red: new Color("#ef4444"),
};

async function fetchData() {
  if (DATA_URL) { try { const req = new Request(DATA_URL); return await req.loadJSON(); } catch (e) { console.error("Failed to fetch: " + e); } }
  return generateSampleData();
}

function generateSampleData() {
  const sessions = [];
  const now = new Date();
  const claudeNames = ["Code review","Debug flow","Unit tests","Refactor API","Schema design","Blog draft","Arch review","Fix CI","Data analysis","Prompt eng"];
  const codexNames = ["Boilerplate","Autocomplete","Test gen","Translation","Docstrings","CLI build","Regex","SQL opt","Scaffolding"];
  for (let i = 0; i < 60; i++) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split("T")[0];
    const n = Math.random() < Math.min(0.9, 0.35 + (60 - i) / 100) ? Math.ceil(Math.random() * 4) : 0;
    for (let j = 0; j < n; j++) {
      const isClaude = Math.random() < 0.58;
      sessions.push({ platform: isClaude ? "claude" : "codex", name: (isClaude ? claudeNames : codexNames)[Math.floor(Math.random() * (isClaude ? claudeNames : codexNames).length)], date: ds, tokens: Math.floor(1500 + Math.random() * 50000), duration: Math.floor(3 + Math.random() * 90) });
    }
  }
  return sessions;
}

function fmt(n) { if (n >= 1e6) return (n/1e6).toFixed(1)+"M"; if (n >= 1e3) return (n/1e3).toFixed(1)+"K"; return ""+n; }

function calcStats(data) {
  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  const weekStr = weekStart.toISOString().split("T")[0];
  const claudeAll = data.filter(s => s.platform === "claude");
  const codexAll = data.filter(s => s.platform === "codex");
  const todaySess = data.filter(s => s.date === today);
  const weekSess = data.filter(s => s.date >= weekStr);
  const totalTokens = data.reduce((a, s) => a + s.tokens, 0);
  const todayTokens = todaySess.reduce((a, s) => a + s.tokens, 0);
  const weekTokens = weekSess.reduce((a, s) => a + s.tokens, 0);
  const todayMins = todaySess.reduce((a, s) => a + s.duration, 0);
  let streak = 0;
  for (let i = 0; i < 365; i++) { const d = new Date(now); d.setDate(d.getDate()-i); if (data.some(s => s.date === d.toISOString().split("T")[0])) streak++; else break; }
  const chart = [];
  for (let i = 6; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate()-i); const ds = d.toISOString().split("T")[0]; const daySess = data.filter(s => s.date === ds); chart.push({ claude: daySess.filter(s => s.platform==="claude").reduce((a,s)=>a+s.tokens,0), codex: daySess.filter(s => s.platform==="codex").reduce((a,s)=>a+s.tokens,0) }); }
  return { totalTokens, todayTokens, weekTokens, todayMins, claudeCount: claudeAll.length, codexCount: codexAll.length, todayCount: todaySess.length, streak, chart, recentSessions: data.sort((a,b) => b.date.localeCompare(a.date)).slice(0,5) };
}

function buildSmall(stats) {
  const w = new ListWidget(); w.backgroundColor = C.bg; w.setPadding(14,14,14,14);
  const header = w.addStack(); header.centerAlignContent();
  const dot = header.addText("●"); dot.textColor = C.green; dot.font = Font.boldSystemFont(8);
  header.addSpacer(5);
  const title = header.addText("AI Tracker"); title.textColor = C.dim; title.font = Font.semiboldSystemFont(10);
  header.addSpacer();
  const streakText = header.addText("🔥 " + stats.streak); streakText.textColor = C.claude; streakText.font = Font.boldMonospacedSystemFont(10);
  w.addSpacer(8);
  const totalLabel = w.addText("TOTAL TOKENS"); totalLabel.textColor = C.muted; totalLabel.font = Font.boldSystemFont(8);
  const totalVal = w.addText(fmt(stats.totalTokens)); totalVal.textColor = C.accent; totalVal.font = Font.boldMonospacedSystemFont(26);
  w.addSpacer(8);
  const row = w.addStack(); row.centerAlignContent();
  const cDot = row.addText("●"); cDot.textColor = C.claude; cDot.font = Font.boldSystemFont(8); row.addSpacer(3);
  const cText = row.addText(stats.claudeCount+""); cText.textColor = C.text; cText.font = Font.boldMonospacedSystemFont(12);
  row.addSpacer(12);
  const xDot = row.addText("●"); xDot.textColor = C.codex; xDot.font = Font.boldSystemFont(8); row.addSpacer(3);
  const xText = row.addText(stats.codexCount+""); xText.textColor = C.text; xText.font = Font.boldMonospacedSystemFont(12);
  row.addSpacer();
  const todayText = row.addText(stats.todayCount + " today"); todayText.textColor = C.dim; todayText.font = Font.mediumSystemFont(10);
  return w;
}

function buildMedium(stats) {
  const w = new ListWidget(); w.backgroundColor = C.bg; w.setPadding(14,16,14,16);
  const header = w.addStack(); header.centerAlignContent();
  header.addText("●").textColor = C.green; header.addSpacer(5);
  const title = header.addText("AI Usage Tracker"); title.textColor = C.dim; title.font = Font.semiboldSystemFont(11);
  header.addSpacer();
  const streakBadge = header.addText("🔥 " + stats.streak + " day streak"); streakBadge.textColor = C.claude; streakBadge.font = Font.boldMonospacedSystemFont(10);
  w.addSpacer(10);
  const main = w.addStack();
  const left = main.addStack(); left.layoutVertically(); left.size = new Size(160,0);
  const tl = left.addText("TOTAL TOKENS"); tl.textColor = C.muted; tl.font = Font.boldSystemFont(8);
  const tv = left.addText(fmt(stats.totalTokens)); tv.textColor = C.accent; tv.font = Font.boldMonospacedSystemFont(24);
  left.addSpacer(8);
  const cr = left.addStack(); cr.centerAlignContent();
  cr.addText("●").textColor = C.claude; cr.addSpacer(4);
  const cl = cr.addText("Claude"); cl.textColor = C.text; cl.font = Font.semiboldSystemFont(11);
  cr.addSpacer(); const cv = cr.addText(fmt(stats.claudeCount)+" sess"); cv.textColor = C.claude; cv.font = Font.boldMonospacedSystemFont(11);
  left.addSpacer(3);
  const xr = left.addStack(); xr.centerAlignContent();
  xr.addText("●").textColor = C.codex; xr.addSpacer(4);
  const xl = xr.addText("Codex"); xl.textColor = C.text; xl.font = Font.semiboldSystemFont(11);
  xr.addSpacer(); const xv = xr.addText(fmt(stats.codexCount)+" sess"); xv.textColor = C.codex; xv.font = Font.boldMonospacedSystemFont(11);
  main.addSpacer();
  const right = main.addStack(); right.layoutVertically();
  right.addText("7-DAY").textColor = C.muted;
  right.addSpacer(4);
  const chartRow = right.addStack(); chartRow.bottomAlignContent(); chartRow.spacing = 2;
  const maxVal = Math.max(...stats.chart.map(d => d.claude+d.codex), 1);
  for (const day of stats.chart) { const bs = chartRow.addStack(); bs.layoutVertically(); bs.size = new Size(8,50); bs.addSpacer(); const bar = bs.addStack(); bar.backgroundColor = day.claude > day.codex ? C.claude : C.codex; bar.cornerRadius = 2; bar.size = new Size(8, Math.max(2, Math.round(((day.claude+day.codex)/maxVal)*44))); }
  w.addSpacer(6);
  const bottom = w.addStack(); bottom.centerAlignContent();
  const tb = bottom.addText("Today: "+stats.todayCount+" sessions · "+fmt(stats.todayTokens)+" tokens"); tb.textColor = C.dim; tb.font = Font.mediumSystemFont(10);
  bottom.addSpacer();
  const wb = bottom.addText("Week: "+fmt(stats.weekTokens)); wb.textColor = C.dim; wb.font = Font.mediumMonospacedSystemFont(10);
  return w;
}

function buildLarge(stats) {
  const w = new ListWidget(); w.backgroundColor = C.bg; w.setPadding(16,16,16,16);
  const header = w.addStack(); header.centerAlignContent();
  const logoStack = header.addStack(); logoStack.backgroundColor = C.accent; logoStack.cornerRadius = 8; logoStack.setPadding(4,8,4,8);
  logoStack.addText("AI").textColor = Color.white();
  header.addSpacer(8);
  const title = header.addText("Usage Tracker"); title.textColor = C.text; title.font = Font.boldSystemFont(16);
  header.addSpacer();
  const streak = header.addText("🔥 "+stats.streak+" day streak"); streak.textColor = C.claude; streak.font = Font.boldMonospacedSystemFont(12);
  w.addSpacer(12);
  const cards = w.addStack(); cards.spacing = 8;
  function addCard(p,l,v,c) { const cd = p.addStack(); cd.layoutVertically(); cd.backgroundColor = C.bg2; cd.cornerRadius = 10; cd.setPadding(10,12,10,12); cd.addText(l).textColor = C.muted; cd.addSpacer(3); const vt = cd.addText(v); vt.textColor = c; vt.font = Font.boldMonospacedSystemFont(18); }
  addCard(cards,"TOTAL",fmt(stats.totalTokens),C.accent); addCard(cards,"TODAY",fmt(stats.todayTokens),C.green); addCard(cards,"WEEK",fmt(stats.weekTokens),C.claude); addCard(cards,"TIME",stats.todayMins+"m",C.codex);
  w.addSpacer(12);
  const platforms = w.addStack(); platforms.spacing = 8;
  function addPlatform(p,n,cnt,tok,col,bg) { const cd = p.addStack(); cd.layoutVertically(); cd.backgroundColor = bg; cd.cornerRadius = 10; cd.setPadding(10,14,10,14); const r = cd.addStack(); r.centerAlignContent(); r.addText("●").textColor = col; r.addSpacer(5); const nm = r.addText(n); nm.textColor = C.text; nm.font = Font.boldSystemFont(13); cd.addSpacer(4); cd.addText(cnt+" sessions").textColor = C.dim; const tt = cd.addText(fmt(tok)+" tokens"); tt.textColor = col; tt.font = Font.boldMonospacedSystemFont(12); }
  addPlatform(platforms,"Claude",stats.claudeCount,stats.totalTokens*0.58,C.claude,C.claudeBg);
  addPlatform(platforms,"Codex",stats.codexCount,stats.totalTokens*0.42,C.codex,C.codexBg);
  w.addSpacer(12);
  w.addText("LAST 7 DAYS").textColor = C.muted; w.addSpacer(6);
  const chartRow = w.addStack(); chartRow.bottomAlignContent(); chartRow.spacing = 4;
  const maxVal = Math.max(...stats.chart.map(d => Math.max(d.claude,d.codex)),1);
  const dayLabels = ["S","M","T","W","T","F","S"]; const todayDay = new Date().getDay();
  for (let i = 0; i < stats.chart.length; i++) { const day = stats.chart[i]; const col = chartRow.addStack(); col.layoutVertically(); col.size = new Size(38,80); const bars = col.addStack(); bars.bottomAlignContent(); bars.spacing = 1; bars.addSpacer(); const cBar = bars.addStack(); cBar.backgroundColor = C.claude; cBar.cornerRadius = 2; cBar.size = new Size(14,Math.max(2,Math.round((day.claude/maxVal)*50))); const xBar = bars.addStack(); xBar.backgroundColor = C.codex; xBar.cornerRadius = 2; xBar.size = new Size(14,Math.max(2,Math.round((day.codex/maxVal)*50))); bars.addSpacer(); col.addSpacer(3); const label = col.addText(dayLabels[(todayDay-6+i+7)%7]); label.textColor = i===6 ? C.text : C.muted; label.font = Font.boldSystemFont(9); label.centerAlignText(); }
  w.addSpacer(8);
  w.addText("RECENT").textColor = C.muted; w.addSpacer(4);
  for (const sess of stats.recentSessions.slice(0,3)) { const row = w.addStack(); row.centerAlignContent(); row.spacing = 6; const badge = row.addText(sess.platform==="claude"?"C":"X"); badge.textColor = sess.platform==="claude"?C.claude:C.codex; badge.font = Font.boldMonospacedSystemFont(10); const name = row.addText(sess.name); name.textColor = C.text; name.font = Font.mediumSystemFont(11); name.lineLimit = 1; row.addSpacer(); const tok = row.addText(fmt(sess.tokens)); tok.textColor = C.dim; tok.font = Font.boldMonospacedSystemFont(10); w.addSpacer(2); }
  return w;
}

async function main() {
  const data = await fetchData();
  const stats = calcStats(data);
  const param = (args.widgetParameter || "medium").toLowerCase().trim();
  let widget;
  if (param === "small") widget = buildSmall(stats);
  else if (param === "large") widget = buildLarge(stats);
  else widget = buildMedium(stats);
  widget.refreshAfterDate = new Date(Date.now() + 15*60*1000);
  if (config.runsInWidget) Script.setWidget(widget);
  else { if (param==="small") widget.presentSmall(); else if (param==="large") widget.presentLarge(); else widget.presentMedium(); }
  Script.complete();
}

await main();
