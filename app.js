(() => {
  "use strict";

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const canvas = $("#poster-canvas");
  const ctx = canvas.getContext("2d", { alpha: false });
  const viewport = $("#canvas-viewport");
  const stage = $("#canvas-stage");
  const renderingBadge = $("#rendering-badge");

  const FORMATS = {
    social: { label: "社交媒体竖版 · 4:5", preview: [1080, 1350], export: [1080, 1350] },
    poster: { label: "经典海报 · 3:4", preview: [1080, 1440], export: [1080, 1440] },
    story: { label: "手机故事 · 9:16", preview: [1080, 1920], export: [1080, 1920] },
    square: { label: "正方形 · 1:1", preview: [1080, 1080], export: [1080, 1080] },
    a4: { label: "印刷 A4 · 210 × 297 mm", preview: [1080, 1528], export: [2480, 3508] }
  };

  const STYLE_DEFAULTS = {
    "white-studio": { accent: "#5f55e7", background: "#ffffff" },
    "ici-grid": { accent: "#7d6bff", background: "#f1f0ea" },
    "ici-electric": { accent: "#9d39ff", background: "#425df5" },
    swiss: { accent: "#ee4838", background: "#f1efe7" },
    editorial: { accent: "#1f4037", background: "#ffffff" },
    collage: { accent: "#ec4f78", background: "#ffc928" },
    quiet: { accent: "#b34535", background: "#ffffff" },
    "layout-lab": { accent: "#f35aa6", background: "#ffffff" },
    "art-blue": { accent: "#1568d4", background: "#e8e9ea" },
    "composition-atlas": { accent: "#9da397", background: "#fbfaf6" },
    workshop: { accent: "#ff6a00", background: "#fff8eb" },
    "teacher-workshop": { accent: "#ed315f", background: "#ffffff" },
    "neon-doodle": { accent: "#2dff00", background: "#ffffff" }
  };

  const MATERIAL_LABELS = {
    tape: "胶带", "torn-paper": "撕纸", halftone: "网点", scribble: "涂鸦",
    starburst: "爆炸贴", arrow: "箭头", stamp: "印章", barcode: "条码",
    "grid-patch": "网格片", target: "靶心", confetti: "碎纸", "gradient-orb": "渐变球",
    "neon-brush": "荧光平刷", "neon-blob": "荧光云团", "charcoal-brush": "黑色炭笔",
    "charcoal-flower": "炭笔花瓣", "neon-loop": "荧光弹簧线", "contour-line": "自由轮廓线"
  };

  const BLOCK_LABELS = {
    kicker: "眉题", title: "主标题", subtitle: "副标题", visual: "主图 / 主视觉",
    date: "日期", time: "时间", venue: "地点", body: "简介", organizer: "署名",
    qr: "二维码", courses: "课程区"
  };

  const TEXT_BLOCK_IDS = ["kicker", "title", "subtitle", "date", "time", "venue", "body", "organizer"];
  const FONT_FAMILIES = {
    modern: 'Arial, "Microsoft YaHei", "PingFang SC", sans-serif',
    hei: '"Microsoft YaHei", "PingFang SC", "Noto Sans CJK SC", sans-serif',
    condensed: '"Arial Narrow", "Roboto Condensed", "Microsoft YaHei", sans-serif',
    serif: 'Georgia, "Times New Roman", "Songti SC", serif',
    song: '"Songti SC", "SimSun", "Noto Serif CJK SC", serif',
    mono: '"Courier New", "SFMono-Regular", Consolas, monospace',
    rounded: '"Arial Rounded MT Bold", "Microsoft YaHei", "PingFang SC", sans-serif'
  };

  const DEFAULT_COURSES = [
    { title: "模型制作", meta: "周一 14:00 · A101", desc: "MODEL MAKING / 基础模型制作与手工成型" },
    { title: "3D 打印", meta: "周二 10:00 · B203", desc: "3D PRINTING / FDM 与 SLA 打印入门" },
    { title: "数字制造", meta: "周三 09:30 · C305", desc: "DIGITAL FAB / CNC 与激光制造流程" },
    { title: "复写印刷", meta: "周四 13:30 · D102", desc: "REPROGRAPHIC / 丝网与 RISO 工艺" }
  ];

  const TEACHER_WORKSHOP_COURSES = [
    { title: "模型制作", meta: "周一 14:00-15:30 · A101", desc: "Model Making / 基础模型制作与手工成型" },
    { title: "3D 打印", meta: "周二 10:00-11:30 · B203", desc: "3D Printing / FDM/SLA 打印入门" },
    { title: "数字制造", meta: "周三 09:30-12:00 · C305", desc: "Digital Fab / CNC / Laser 制造流程" },
    { title: "复写印刷", meta: "周四 13:30-16:00 · D102", desc: "Reprographic / 丝网与 Riso 工艺" }
  ];

  const TEACHER_WORKSHOP_DEFAULTS = {
    kicker: "",
    title: "工坊 👀 Tour",
    subtitle: "",
    date: "2026春季 3月9日至4月3日",
    time: "",
    venue: "",
    body: "",
    organizer: "厦门大学创意与创新学院 · Institute of Creativity and Innovation, XMU"
  };

  const NEON_DOODLE_DEFAULTS = {
    kicker: "MARKETING / CREATIVE SUPPORT",
    title: "DON'T KNOW\nWHERE TO START?",
    subtitle: "WE CAN\nHELP.",
    date: "2026.08.04",
    time: "OPEN 10:00 — 18:00",
    venue: "厦门大学创意与创新学院204",
    body: "不知道从哪里开始？带着一个真实想法来，我们一起把它变成能够被看见、体验和讨论的新提案。",
    organizer: "INSTITUTE OF CREATIVITY AND INNOVATION, XMU"
  };

  const DEMOS = [
    {
      kicker: "ICI RP",
      title: "让想象力发生",
      subtitle: "LET IMAGINATION TAKE FORM",
      date: "08.24 — 09.07",
      time: "10:00 — 18:00",
      venue: "厦门大学创意与创新学院204",
      body: "一场关于设计、技术与未来生活的开放实验。让新的视角彼此碰撞，让还没有名字的想法被看见。",
      organizer: "INSTITUTE OF CREATIVITY AND INNOVATION"
    },
    {
      kicker: "OPEN LECTURE / NO. 07",
      title: "设计如何回应未知",
      subtitle: "DESIGNING FOR THE UNKNOWN",
      date: "09.18 / WED",
      time: "19:30 — 21:00",
      venue: "创意与创新学院 · 影像厅",
      body: "从研究到实践，从问题到可能。我们邀请不同领域的创作者，共同讨论不确定时代里的设计方法。",
      organizer: "ICI PUBLIC PROGRAMME"
    },
    {
      kicker: "STUDENT WORKSHOP · 03",
      title: "造一阵新风",
      subtitle: "MAKE A NEW CURRENT",
      date: "10.11 — 10.13",
      time: "ALL DAY",
      venue: "厦门大学漳州校区 · 设计工坊",
      body: "三天快速创作：观察、拆解、协作、制作。带上一个真实问题，把它变成可以被体验的新提案。",
      organizer: "CREATIVITY / CRITICAL THINKING / INNOVATION"
    }
  ];

  const defaultState = {
    style: "white-studio",
    format: "poster",
    kicker: DEMOS[0].kicker,
    title: DEMOS[0].title,
    subtitle: DEMOS[0].subtitle,
    date: DEMOS[0].date,
    time: DEMOS[0].time,
    venue: DEMOS[0].venue,
    body: DEMOS[0].body,
    organizer: DEMOS[0].organizer,
    accent: STYLE_DEFAULTS["white-studio"].accent,
    background: STYLE_DEFAULTS["white-studio"].background,
    density: 1,
    smartGuides: true,
    showGrid: true,
    showGrain: false,
    decorations: [],
    materialTransforms: {},
    emojiStickers: [],
    blockTransforms: {},
    textStyles: {},
    hiddenBlocks: [],
    materialScale: 100,
    motifPreset: "01",
    motifEmoji: "👀",
    workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course })),
    teacherWorkshopDraft: null,
    teacherWorkshopReturn: null,
    neonDoodleDraft: null,
    neonDoodleReturn: null,
    seed: 48271
  };

  let state = loadState();
  let imageAssets = [];
  let qrAsset = null;
  let zoomMultiplier = 1;
  let renderTimer = null;
  let saveTimer = null;
  let demoIndex = 0;
  let backgroundRemoverPromise = null;
  let activeElement = null;
  let interactiveHitAreas = [];
  let draggingElement = null;
  let activeSmartGuides = { vertical: [], horizontal: [] };
  let draggingAssetIndex = null;
  let draggingAssetPointer = null;

  function loadState() {
    const fresh = { ...defaultState, decorations: [], materialTransforms: {}, emojiStickers: [], blockTransforms: {}, textStyles: {}, hiddenBlocks: [], workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course })) };
    try {
      const saved = JSON.parse(localStorage.getItem("form01-poster-state") || "null");
      if (!saved) return fresh;
      const merged = { ...fresh, ...saved };
      if (merged.kicker === "ICI DESIGN SEASON · 2026") merged.kicker = "ICI RP";
      if (merged.venue === "厦门 · 海上世界文化艺术中心") merged.venue = "厦门大学创意与创新学院204";
      if (!Array.isArray(merged.decorations)) merged.decorations = [];
      if (!merged.materialTransforms || typeof merged.materialTransforms !== "object") merged.materialTransforms = {};
      if (!Array.isArray(merged.emojiStickers)) merged.emojiStickers = [];
      if (!merged.blockTransforms || typeof merged.blockTransforms !== "object") merged.blockTransforms = {};
      if (!merged.textStyles || typeof merged.textStyles !== "object") merged.textStyles = {};
      if (!Array.isArray(merged.hiddenBlocks)) merged.hiddenBlocks = [];
      return merged;
    } catch {
      return fresh;
    }
  }

  function saveState() {
    clearTimeout(saveTimer);
    $("#save-status").textContent = "正在保存…";
    saveTimer = setTimeout(() => {
      localStorage.setItem("form01-poster-state", JSON.stringify(state));
      $("#save-status").textContent = "所有更改已保存";
    }, 320);
  }

  function syncUIFromState() {
    $$('[data-field]').forEach((el) => {
      const key = el.dataset.field;
      if (!(key in state)) return;
      if (el.type === "checkbox") el.checked = Boolean(state[key]);
      else el.value = state[key];
    });

    $$(".style-card").forEach((card) => {
      const selected = card.dataset.style === state.style;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-checked", String(selected));
    });
    updateColorLabels();
    updateDensityLabel();
    updateMaterialScaleLabel();
    renderMaterials();
    updateAllCounts();
    toggleWorkshopSection();
    renderWorkshopCourses();
  }

  function updateAllCounts() {
    $$('[data-count-for]').forEach((node) => {
      const input = $("#" + node.dataset.countFor);
      if (input) node.textContent = Array.from(input.value).length;
    });
  }

  function updateColorLabels() {
    $("#accent-value").textContent = state.accent.toUpperCase();
    $("#background-value").textContent = state.background.toUpperCase();
    document.documentElement.style.setProperty("--accent", state.accent);
  }

  function updateDensityLabel() {
    $("#density-value").textContent = ["呼吸", "平衡", "紧凑"][Number(state.density)] || "平衡";
  }

  function updateMaterialScaleLabel() {
    $("#material-scale-value").textContent = `${Number(state.materialScale) || 100}%`;
  }

  function scheduleRender(showBadge = true) {
    clearTimeout(renderTimer);
    if (showBadge) renderingBadge.classList.add("show");
    renderTimer = setTimeout(() => {
      renderPreview();
      renderingBadge.classList.remove("show");
    }, 75);
    saveState();
  }

  function renderPreview() {
    const [width, height] = FORMATS[state.format].preview;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    drawPoster(ctx, state, width, height);
    $("#canvas-size-label").textContent = `${FORMATS[state.format].export[0]} × ${FORMATS[state.format].export[1]} px`;
    fitCanvas();
  }

  function fitCanvas() {
    const roomW = Math.max(380, viewport.clientWidth - 86);
    const roomH = Math.max(380, viewport.clientHeight - 76);
    const baseScale = Math.min(roomW / canvas.width, roomH / canvas.height);
    const scale = Math.max(.12, baseScale * zoomMultiplier);
    stage.style.width = `${Math.round(canvas.width * scale)}px`;
    stage.style.height = `${Math.round(canvas.height * scale)}px`;
    $("#zoom-reset-btn").textContent = zoomMultiplier === 1 ? "适配" : `${Math.round(zoomMultiplier * 100)}%`;
  }

  function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }
  function lerp(a, b, t) { return a + (b - a) * t; }

  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return () => {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function alpha(hex, opacity) {
    const clean = hex.replace("#", "");
    const value = clean.length === 3 ? clean.split("").map((v) => v + v).join("") : clean;
    const num = parseInt(value, 16);
    return `rgba(${(num >> 16) & 255},${(num >> 8) & 255},${num & 255},${opacity})`;
  }

  function luminance(hex) {
    const clean = hex.replace("#", "");
    const num = parseInt(clean.length === 3 ? clean.split("").map((v) => v + v).join("") : clean, 16);
    const r = (num >> 16) & 255;
    const g = (num >> 8) & 255;
    const b = num & 255;
    return (.2126 * r + .7152 * g + .0722 * b) / 255;
  }

  function contrastColor(hex) { return luminance(hex) > .58 ? "#12120f" : "#ffffff"; }

  function roundedRectPath(c, x, y, w, h, radius) {
    const r = Math.min(radius, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.arcTo(x + w, y, x + w, y + h, r);
    c.arcTo(x + w, y + h, x, y + h, r);
    c.arcTo(x, y + h, x, y, r);
    c.arcTo(x, y, x + w, y, r);
    c.closePath();
  }

  function drawSpacedText(c, text, x, y, spacing, align = "left") {
    const chars = Array.from(text || "");
    const widths = chars.map((char) => c.measureText(char).width);
    const total = widths.reduce((sum, width) => sum + width, 0) + Math.max(0, chars.length - 1) * spacing;
    let cursor = align === "center" ? x - total / 2 : align === "right" ? x - total : x;
    chars.forEach((char, index) => {
      c.fillText(char, cursor, y);
      cursor += widths[index] + spacing;
    });
    return total;
  }

  function fitFont(c, text, maxWidth, maxSize, minSize, family, weight = 800) {
    let size = maxSize;
    const probe = (text || " ").split("\n").sort((a, b) => b.length - a.length)[0];
    while (size > minSize) {
      c.font = `${weight} ${size}px ${family}`;
      if (c.measureText(probe).width <= maxWidth) break;
      size -= Math.max(1, size * .025);
    }
    return Math.max(minSize, size);
  }

  function wrapLines(c, text, maxWidth, maxLines = 99) {
    const sourceLines = String(text || "").split(/\r?\n/);
    const lines = [];
    sourceLines.forEach((source) => {
      if (!source) { lines.push(""); return; }
      const tokens = /\s/.test(source.trim()) && !/[\u3400-\u9fff]/.test(source)
        ? source.trim().split(/\s+/).map((word, i) => i ? " " + word : word)
        : Array.from(source);
      let current = "";
      tokens.forEach((token) => {
        const next = current + token;
        if (current && c.measureText(next).width > maxWidth) {
          lines.push(current.trim());
          current = token.trimStart();
        } else current = next;
      });
      if (current) lines.push(current.trim());
    });
    if (lines.length > maxLines) {
      const clipped = lines.slice(0, maxLines);
      clipped[maxLines - 1] = clipped[maxLines - 1].replace(/[，。；、,.!！?？\s]+$/, "") + "…";
      return clipped;
    }
    return lines;
  }

  function drawLines(c, lines, x, y, lineHeight, options = {}) {
    const { align = "left", spacing = 0 } = options;
    c.textAlign = "left";
    lines.forEach((line, i) => drawSpacedText(c, line, x, y + i * lineHeight, spacing, align));
  }

  function coverImage(c, image, x, y, w, h) {
    if (!image || !image.width || !image.height) return;
    const scale = Math.max(w / image.width, h / image.height);
    const sw = w / scale;
    const sh = h / scale;
    const sx = (image.width - sw) / 2;
    const sy = (image.height - sh) / 2;
    c.drawImage(image, sx, sy, sw, sh, x, y, w, h);
  }

  function drawGrid(c, W, H, gap, color, majorEvery = 4) {
    c.save();
    c.lineWidth = Math.max(1, W / 1080);
    for (let x = 0, i = 0; x <= W; x += gap, i++) {
      c.strokeStyle = i % majorEvery === 0 ? alpha(color, .48) : alpha(color, .24);
      c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
    }
    for (let y = 0, i = 0; y <= H; y += gap, i++) {
      c.strokeStyle = i % majorEvery === 0 ? alpha(color, .48) : alpha(color, .24);
      c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
    }
    c.restore();
  }

  function drawPseudoQR(c, x, y, size, color, seed) {
    const cells = 17;
    const unit = size / cells;
    const rng = mulberry32(seed);
    c.save();
    c.fillStyle = color;
    const finder = (cx, cy) => {
      c.fillRect(x + cx * unit, y + cy * unit, unit * 5, unit * 5);
      c.fillStyle = contrastColor(color);
      c.fillRect(x + (cx + 1) * unit, y + (cy + 1) * unit, unit * 3, unit * 3);
      c.fillStyle = color;
      c.fillRect(x + (cx + 2) * unit, y + (cy + 2) * unit, unit, unit);
    };
    finder(0, 0); finder(12, 0); finder(0, 12);
    for (let row = 0; row < cells; row++) {
      for (let col = 0; col < cells; col++) {
        const occupied = (col < 5 && row < 5) || (col >= 12 && row < 5) || (col < 5 && row >= 12);
        if (!occupied && rng() > .54) c.fillRect(x + col * unit, y + row * unit, unit * .88, unit * .88);
      }
    }
    c.restore();
  }

  function drawCropMarks(c, x, y, w, h, color, unit) {
    c.save(); c.strokeStyle = color; c.lineWidth = unit;
    const m = unit * 14;
    [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, dx, dy]) => {
      c.beginPath(); c.moveTo(px + dx * m, py); c.lineTo(px, py); c.lineTo(px, py + dy * m); c.stroke();
    });
    c.restore();
  }

  function drawImageFrame(c, image, x, y, w, h, options = {}) {
    const { radius = 0, overlay = null, border = null, rotate = 0 } = options;
    c.save();
    if (rotate) {
      c.translate(x + w / 2, y + h / 2);
      c.rotate(rotate);
      x = -w / 2; y = -h / 2;
    }
    roundedRectPath(c, x, y, w, h, radius);
    c.clip();
    coverImage(c, image, x, y, w, h);
    if (overlay) { c.fillStyle = overlay; c.fillRect(x, y, w, h); }
    c.restore();
    if (border) {
      c.save();
      if (rotate) { c.translate(x + w / 2, y + h / 2); c.rotate(rotate); }
      c.strokeStyle = border.color; c.lineWidth = border.width;
      roundedRectPath(c, x, y, w, h, radius); c.stroke(); c.restore();
    }
  }

  function drawGrain(c, W, H, seed, intensity = .055) {
    const rng = mulberry32(seed ^ 0x93fc127);
    const count = clamp(Math.round((W * H) / 520), 1200, 7500);
    c.save();
    for (let i = 0; i < count; i++) {
      const light = rng() > .52;
      c.fillStyle = light ? `rgba(255,255,255,${rng() * intensity})` : `rgba(0,0,0,${rng() * intensity})`;
      const s = 1 + rng() * (W / 900);
      c.fillRect(rng() * W, rng() * H, s, s);
    }
    c.restore();
  }

  function drawFluidObject(c, x, y, w, h, accent, seed, bright = false) {
    const rng = mulberry32(seed);
    c.save();
    c.translate(x + w / 2, y + h / 2);
    c.rotate((rng() - .5) * .5);

    const path = new Path2D();
    path.moveTo(-w * .42, -h * .08);
    path.bezierCurveTo(-w * .55, -h * .45, -w * .08, -h * .6, w * .18, -h * .36);
    path.bezierCurveTo(w * .46, -h * .13, w * .57, h * .05, w * .31, h * .34);
    path.bezierCurveTo(w * .05, h * .62, -w * .43, h * .45, -w * .42, -h * .08);
    const gradient = c.createRadialGradient(-w * .15, -h * .28, 0, 0, 0, w * .62);
    gradient.addColorStop(0, bright ? "#ff91ff" : "#e5ddff");
    gradient.addColorStop(.32, accent);
    gradient.addColorStop(.7, bright ? "#5d16c6" : "#191825");
    gradient.addColorStop(1, "#07070a");
    c.fillStyle = gradient;
    c.shadowColor = alpha("#000000", .32);
    c.shadowBlur = w * .06;
    c.shadowOffsetY = w * .035;
    c.fill(path);

    c.shadowColor = "transparent";
    c.globalAlpha = .76;
    const shine = c.createLinearGradient(-w * .3, -h * .35, w * .2, h * .1);
    shine.addColorStop(0, "rgba(255,255,255,.92)");
    shine.addColorStop(.35, "rgba(255,255,255,.16)");
    shine.addColorStop(1, "rgba(255,255,255,0)");
    c.strokeStyle = shine;
    c.lineWidth = w * .045;
    c.lineCap = "round";
    c.beginPath();
    c.moveTo(-w * .28, -h * .24);
    c.bezierCurveTo(-w * .05, -h * .45, w * .24, -h * .26, w * .31, -h * .08);
    c.stroke();
    c.restore();
  }

  function drawRibbonSculpture(c, W, H, accent, seed) {
    const rng = mulberry32(seed);
    const cx = W * (.58 + (rng() - .5) * .05);
    const cy = H * .48;
    const unit = W / 1080;
    c.save();
    c.translate(cx, cy);
    c.rotate(-.14 + (rng() - .5) * .1);
    c.lineCap = "round";
    c.lineJoin = "round";

    const ribbons = [
      { width: 150, color: "#101014", dx: 0, dy: -90, bend: 1 },
      { width: 112, color: "#f4f4f1", dx: 35, dy: -10, bend: -1 },
      { width: 126, color: accent, dx: -85, dy: 45, bend: 1 },
      { width: 96, color: "#b9b8b5", dx: 30, dy: 120, bend: -1 }
    ];
    ribbons.forEach((ribbon, index) => {
      const y = ribbon.dy * unit;
      const dx = ribbon.dx * unit;
      const path = new Path2D();
      path.moveTo(-W * .32 + dx, y);
      path.bezierCurveTo(-W * .12, y - H * .18 * ribbon.bend, W * .05, y + H * .13 * ribbon.bend, W * .28 + dx, y - H * .03 * ribbon.bend);
      const grad = c.createLinearGradient(-W * .28, y - H * .1, W * .3, y + H * .1);
      grad.addColorStop(0, index === 0 ? "#050506" : ribbon.color);
      grad.addColorStop(.42, ribbon.color);
      grad.addColorStop(.64, index === 0 ? "#77777d" : "#ffffff");
      grad.addColorStop(1, ribbon.color);
      c.strokeStyle = grad;
      c.lineWidth = ribbon.width * unit;
      c.shadowColor = "rgba(0,0,0,.28)";
      c.shadowBlur = 28 * unit;
      c.shadowOffsetY = 18 * unit;
      c.stroke(path);

      c.shadowColor = "transparent";
      c.strokeStyle = "rgba(255,255,255,.52)";
      c.lineWidth = Math.max(3, ribbon.width * .045 * unit);
      c.stroke(path);
    });
    c.restore();
  }

  function drawPoster(c, data, W, H) {
    const s = W / 1080;
    const seed = hashString(`${data.style}-${data.seed}-${data.title}`);
    if (c === ctx) interactiveHitAreas = [];
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.clearRect(0, 0, W, H);
    c.textBaseline = "alphabetic";
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";

    drawFlatPoster(c, data, W, H, s, seed);
    if (Array.isArray(data.decorations) && data.decorations.length) drawCollageMaterials(c, data, W, H, seed);
    if (Array.isArray(data.emojiStickers) && data.emojiStickers.length) drawEmojiStickers(c, data, W, H);
    if (data.showGrain) drawGrain(c, W, H, seed, data.style === "collage" ? .075 : .045);
    if (c === ctx && activeElement) drawActiveElementOutline(c);
    if (c === ctx && draggingElement && data.smartGuides) drawSmartGuides(c, W, H);
    c.restore();
  }

  function getFlatTheme(data) {
    const themes = {
      "white-studio": { bg: "#ffffff", ink: "#11110f", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 88, visual: "plain" },
      "ici-grid": { bg: data.background, ink: "#151515", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 94, visual: "ICI" },
      "ici-electric": { bg: data.background, ink: "#ffffff", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 132, visual: "electric" },
      swiss: { bg: "#ffffff", ink: "#11110f", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 90, visual: "swiss" },
      editorial: { bg: "#ffffff", ink: "#171714", titleFont: 'Georgia, "Songti SC", serif', titleWeight: 500, titleSize: 76, visual: "editorial" },
      collage: { bg: data.background, ink: "#151513", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 91, visual: "collage" },
      quiet: { bg: "#ffffff", ink: "#181714", titleFont: 'Georgia, "Songti SC", serif', titleWeight: 400, titleSize: 72, visual: "quiet" },
      "layout-lab": { bg: "#ffffff", ink: "#121211", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 92, visual: "layout" },
      "art-blue": { bg: "#f4f4f2", ink: "#125fc6", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 90, visual: "blue" },
      "composition-atlas": { bg: "#fbfaf6", ink: "#171714", titleFont: 'Georgia, "Songti SC", serif', titleWeight: 500, titleSize: 79, visual: "atlas" },
      workshop: { bg: data.background, ink: "#151513", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 82, visual: "workshop" },
      "teacher-workshop": { bg: "#ffffff", ink: "#050505", titleFont: 'Arial, "Microsoft YaHei", "PingFang SC", sans-serif', titleWeight: 900, titleSize: 102, visual: "plain" },
      "neon-doodle": { bg: "#ffffff", ink: "#171717", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 76, visual: "plain" }
    };
    return { accent: data.accent, ...(themes[data.style] || themes["white-studio"]) };
  }

  function getFlatLayout(style) {
    const base = {
      kicker: { x: .18, y: .055, w: .30, h: .035 },
      title: { x: .25, y: .165, w: .44, h: .16 },
      subtitle: { x: .25, y: .285, w: .44, h: .045 },
      visual: { x: .64, y: .45, w: .56, h: .39 },
      date: { x: .18, y: .69, w: .29, h: .06 },
      time: { x: .15, y: .745, w: .23, h: .035 },
      venue: { x: .74, y: .69, w: .39, h: .075, align: "right" },
      body: { x: .71, y: .79, w: .42, h: .12, align: "right" },
      organizer: { x: .24, y: .935, w: .42, h: .035 },
      qr: { x: .91, y: .075, w: .075, h: .065 }
    };
    const layouts = {
      "white-studio": { visual: { x: .62, y: .46, w: .58, h: .42 }, title: { x: .24, y: .16, w: .42, h: .15 }, body: { x: .72, y: .78, w: .41, h: .12, align: "right" } },
      "ici-grid": {},
      "ici-electric": { kicker: { x: .22, y: .07, w: .38, h: .04 }, title: { x: .34, y: .22, w: .62, h: .24 }, subtitle: { x: .76, y: .34, w: .38, h: .05, align: "right" }, visual: { x: .61, y: .49, w: .72, h: .50 }, date: { x: .22, y: .80, w: .36, h: .075 }, time: { x: .18, y: .86, w: .28, h: .035 }, venue: { x: .76, y: .80, w: .38, h: .08, align: "right" }, body: { x: .72, y: .88, w: .43, h: .09, align: "right" } },
      swiss: { title: { x: .23, y: .15, w: .40, h: .15 }, visual: { x: .68, y: .43, w: .48, h: .45 }, date: { x: .19, y: .56, w: .30, h: .07 }, body: { x: .27, y: .75, w: .44, h: .15 }, venue: { x: .77, y: .76, w: .33, h: .08, align: "right" } },
      editorial: { kicker: { x: .17, y: .07, w: .27, h: .035 }, title: { x: .22, y: .21, w: .34, h: .22 }, subtitle: { x: .21, y: .35, w: .33, h: .055 }, visual: { x: .70, y: .39, w: .50, h: .50 }, date: { x: .20, y: .53, w: .30, h: .06 }, time: { x: .18, y: .585, w: .25, h: .035 }, venue: { x: .24, y: .67, w: .36, h: .09 }, body: { x: .69, y: .73, w: .48, h: .15, align: "right" }, organizer: { x: .70, y: .93, w: .46, h: .035, align: "right" } },
      collage: { title: { x: .29, y: .17, w: .54, h: .17 }, visual: { x: .55, y: .48, w: .67, h: .46 }, date: { x: .22, y: .74, w: .34, h: .07 }, venue: { x: .75, y: .72, w: .38, h: .09, align: "right" } },
      quiet: { kicker: { x: .18, y: .08, w: .28, h: .035 }, title: { x: .72, y: .22, w: .38, h: .22, align: "right" }, subtitle: { x: .72, y: .36, w: .38, h: .05, align: "right" }, visual: { x: .36, y: .48, w: .44, h: .43 }, date: { x: .18, y: .20, w: .26, h: .06 }, time: { x: .16, y: .25, w: .21, h: .035 }, venue: { x: .72, y: .57, w: .38, h: .08, align: "right" }, body: { x: .72, y: .67, w: .38, h: .15, align: "right" }, organizer: { x: .50, y: .935, w: .60, h: .035, align: "center" } },
      "layout-lab": { title: { x: .18, y: .18, w: .30, h: .22 }, subtitle: { x: .18, y: .32, w: .30, h: .05 }, visual: { x: .67, y: .42, w: .48, h: .54 }, date: { x: .19, y: .57, w: .31, h: .07 }, venue: { x: .26, y: .71, w: .43, h: .09 }, body: { x: .69, y: .77, w: .46, h: .15, align: "right" } },
      "art-blue": { title: { x: .27, y: .16, w: .50, h: .17 }, subtitle: { x: .25, y: .28, w: .46, h: .05 }, visual: { x: .60, y: .49, w: .65, h: .42 }, date: { x: .18, y: .77, w: .30, h: .07 }, time: { x: .17, y: .83, w: .27, h: .035 }, venue: { x: .74, y: .77, w: .39, h: .08, align: "right" }, body: { x: .70, y: .86, w: .43, h: .10, align: "right" } },
      "composition-atlas": { title: { x: .25, y: .14, w: .46, h: .15 }, visual: { x: .52, y: .48, w: .63, h: .51 }, date: { x: .21, y: .75, w: .33, h: .065 }, venue: { x: .76, y: .74, w: .35, h: .08, align: "right" }, body: { x: .72, y: .83, w: .40, h: .11, align: "right" } },
      workshop: { kicker: { x: .18, y: .045, w: .29, h: .03 }, title: { x: .27, y: .13, w: .49, h: .14 }, subtitle: { x: .25, y: .235, w: .44, h: .04 }, visual: { x: .52, y: .60, w: .91, h: .55 }, date: { x: .80, y: .055, w: .28, h: .045, align: "right" }, time: { x: .78, y: .21, w: .32, h: .03, align: "right" }, venue: { x: .77, y: .255, w: .37, h: .05, align: "right" }, body: { x: .27, y: .30, w: .48, h: .055 }, organizer: { x: .25, y: .965, w: .44, h: .025 }, qr: { x: .91, y: .935, w: .075, h: .06 } },
      "teacher-workshop": {
        title: { x: .50, y: .032, w: .72, h: .055, align: "center" },
        date: { x: .50, y: .087, w: .64, h: .028, align: "center" },
        courses: { x: .50, y: .255, w: .84, h: .285 },
        organizer: { x: .50, y: .982, w: .84, h: .018, align: "center" }
      },
      "neon-doodle": {
        kicker: { x: .20, y: .055, w: .31, h: .028 },
        title: { x: .28, y: .19, w: .45, h: .25 },
        subtitle: { x: .23, y: .375, w: .37, h: .15 },
        visual: { x: .70, y: .49, w: .45, h: .38 },
        date: { x: .20, y: .67, w: .27, h: .035 },
        time: { x: .20, y: .705, w: .31, h: .025 },
        venue: { x: .77, y: .79, w: .34, h: .055, align: "right" },
        body: { x: .28, y: .76, w: .45, h: .13 },
        organizer: { x: .29, y: .94, w: .47, h: .025 },
        qr: { x: .91, y: .92, w: .07, h: .055 }
      }
    };
    return { ...base, ...(layouts[style] || {}) };
  }

  function drawFlatPoster(c, data, W, H, s, seed) {
    const theme = getFlatTheme(data);
    const layout = getFlatLayout(data.style);
    drawFlatBackground(c, data, W, H, theme, seed);
    const order = data.style === "teacher-workshop"
      ? ["title", "date", "courses", "organizer"]
      : ["visual", "kicker", "title", "subtitle", "date", "time", "venue", "body", "organizer", "qr"];
    order.forEach((id) => {
      const spec = layout[id];
      if (!spec || state.hiddenBlocks?.includes(id)) return;
      // Empty image placeholders should be genuine whitespace. The visual block
      // appears only after an image is uploaded, except for styles whose visual
      // is generated by the template itself.
      if (id === "visual" && !imageAssets.length && data.style !== "ici-electric" && data.style !== "workshop") return;
      drawFlatBlock(c, data, W, H, s, seed, theme, id, spec);
    });
  }

  function drawFlatBackground(c, data, W, H, theme, seed) {
    c.fillStyle = theme.bg; c.fillRect(0, 0, W, H);
    const accent = theme.accent;
    if (data.style === "white-studio") {
      c.fillStyle = "#11110f"; c.fillRect(W * .035, H * .032, W * .09, Math.max(3, W * .004)); c.fillRect(W * .87, H * .956, W * .095, Math.max(3, W * .004));
      c.fillStyle = accent; c.fillRect(W * .925, H * .032, W * .04, W * .04);
    } else if (data.style === "ici-grid") {
      c.strokeStyle = alpha(accent, .16); c.lineWidth = 1;
      for (let x = 0; x < W; x += W / 24) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += W / 24) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    } else if (data.style === "ici-electric") {
      const marquee = `${data.organizer.toUpperCase()}   /   `.repeat(5);
      c.fillStyle = theme.ink; c.font = `800 ${16 * W / 1080}px Arial, sans-serif`;
      drawSpacedText(c, marquee, -W * .18, 29 * W / 1080, 2.8 * W / 1080);
      drawSpacedText(c, marquee, -W * .10, H - 18 * W / 1080, 2.8 * W / 1080);
      c.strokeStyle = theme.ink; c.lineWidth = 2 * W / 1080; c.beginPath(); c.moveTo(W * .03, H * .075); c.lineTo(W * .97, H * .075); c.stroke();
    } else if (data.style === "swiss") {
      c.fillStyle = accent; c.fillRect(W * .04, H * .04, W * .045, H * .18); c.fillRect(W * .87, H * .78, W * .09, H * .16);
      c.strokeStyle = "rgba(20,20,18,.12)"; c.lineWidth = 1; for (let x = W * .04; x < W; x += W / 12) { c.beginPath(); c.moveTo(x, H * .03); c.lineTo(x, H * .97); c.stroke(); }
    } else if (data.style === "editorial") {
      c.fillStyle = "#161613"; c.fillRect(W * .47, H * .05, Math.max(2, W * .0025), H * .90); c.fillStyle = alpha(accent, .13); c.fillRect(W * .04, H * .86, W * .41, H * .08);
    } else if (data.style === "collage") {
      c.fillStyle = "#fff"; c.fillRect(W * .045, H * .05, W * .50, H * .22); c.fillStyle = accent; c.fillRect(W * .60, H * .07, W * .35, H * .17); c.fillStyle = "#191917"; c.fillRect(W * .04, H * .90, W * .42, H * .045);
    } else if (data.style === "quiet") {
      c.fillStyle = alpha(accent, .09); c.beginPath(); c.arc(W * .34, H * .48, W * .25, 0, Math.PI * 2); c.fill(); c.fillStyle = "#181714"; c.fillRect(W * .055, H * .05, W * .16, Math.max(2, W * .002));
    } else if (data.style === "layout-lab") {
      c.strokeStyle = alpha(accent, .82); c.lineWidth = Math.max(2, W * .003);
      c.strokeRect(W * .045, H * .055, W * .33, H * .29); c.strokeRect(W * .54, H * .10, W * .41, H * .51); c.fillStyle = alpha(accent, .15); c.fillRect(W * .06, H * .71, W * .48, H * .20);
    } else if (data.style === "art-blue") {
      c.fillStyle = theme.ink; c.fillRect(0, H * .88, W, H * .12); c.fillStyle = "#8bdd12"; c.fillRect(W * .04, H * .68, W * .22, H * .045);
    } else if (data.style === "composition-atlas") {
      c.fillStyle = "rgba(135,140,130,.13)"; c.beginPath(); c.arc(W * .50, H * .48, W * .30, 0, Math.PI * 2); c.fill(); c.beginPath(); c.arc(W * .88, H * .16, W * .11, 0, Math.PI * 2); c.fill();
    } else if (data.style === "workshop") {
      c.fillStyle = accent; c.fillRect(0, 0, W, Math.max(7, W * .009));
      c.fillStyle = alpha(accent, .12); c.fillRect(W * .035, H * .285, W * .18, Math.max(3, W * .005));
    } else if (data.style === "neon-doodle") {
      c.fillStyle = "#171717";
      c.fillRect(W * .065, H * .052, W * .045, Math.max(3, W * .004));
      c.fillRect(W * .065, H * .925, W * .15, Math.max(2, W * .002));
      c.fillStyle = accent;
      c.beginPath(); c.arc(W * .077, H * .875, W * .012, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(W * .11, H * .875, W * .008, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(W * .137, H * .875, W * .006, 0, Math.PI * 2); c.fill();
    }
  }

  function drawFlatBlock(c, data, W, H, s, seed, theme, id, spec) {
    const transform = data.blockTransforms?.[id] || {};
    const x = (Number.isFinite(transform.x) ? transform.x : spec.x) * W;
    const y = (Number.isFinite(transform.y) ? transform.y : spec.y) * H;
    const scale = clamp(Number(transform.scale) || 1, .38, 2.6);
    const w = spec.w * W, h = spec.h * H;
    c.save(); c.translate(x, y); c.scale(scale, scale);

    if (id === "visual") drawFlatVisual(c, data, w, h, theme, seed);
    else if (id === "qr") {
      const size = Math.min(w, h);
      if (qrAsset) c.drawImage(qrAsset.img, -size / 2, -size / 2, size, size);
      else drawPseudoQR(c, -size / 2, -size / 2, size, theme.ink, seed);
    } else if (id === "courses") drawFlatCourses(c, data, w, h, theme);
    else drawFlatText(c, data, w, h, theme, id, spec.align || "left", s);

    c.restore();
    if (c === ctx) interactiveHitAreas.push({ kind: "block", id, x, y, w: w * scale, h: h * scale, radius: Math.hypot(w, h) * scale / 2 });
  }

  function drawFlatText(c, data, w, h, theme, id, align, s) {
    const text = String(data[id] || "");
    if (!text) return;
    const isTitle = id === "title";
    const sizes = { kicker: 14, title: theme.titleSize, subtitle: 22, date: 44, time: 17, venue: 21, body: 14, organizer: 12 };
    if (data.style === "teacher-workshop") Object.assign(sizes, { title: 102, date: 38, organizer: 21 });
    if (data.style === "neon-doodle") Object.assign(sizes, { kicker: 13, title: 76, subtitle: 76, date: 20, time: 14, venue: 15, body: 17, organizer: 11 });
    const weights = { kicker: 800, subtitle: 750, date: 900, time: 750, venue: 760, body: 500, organizer: 800 };
    if (data.style === "neon-doodle") Object.assign(weights, { kicker: 850, subtitle: 900, date: 800, body: 600, organizer: 800 });
    const textStyle = data.textStyles?.[id] || {};
    const automaticFamily = isTitle ? theme.titleFont : 'Arial, "Microsoft YaHei", sans-serif';
    const family = FONT_FAMILIES[textStyle.font] || automaticFamily;
    const baseTarget = (sizes[id] || 18) * s;
    const baseMin = isTitle ? 34 * s : Math.max(9 * s, baseTarget * .55);
    const shouldUppercase = data.style !== "teacher-workshop" && (id === "subtitle" || id === "kicker" || id === "organizer");
    const preparedText = shouldUppercase ? text.toUpperCase() : text;
    const automaticSize = fitFont(c, preparedText, w, baseTarget, baseMin, family, isTitle ? theme.titleWeight : weights[id] || 600);
    const sizeScale = clamp((Number(textStyle.size) || 100) / 100, .5, 2.2);
    const fontSize = automaticSize * sizeScale;
    const outlineTitle = data.style === "neon-doodle" && isTitle;
    c.fillStyle = outlineTitle ? "#ffffff" : theme.ink;
    if (outlineTitle) { c.strokeStyle = theme.ink; c.lineWidth = Math.max(2, 2.2 * s); c.lineJoin = "round"; }
    c.font = `${isTitle ? theme.titleWeight : weights[id] || 600} ${fontSize}px ${family}`;
    c.textAlign = align;
    c.textBaseline = "alphabetic";
    const maxLines = isTitle ? (data.style === "neon-doodle" ? 4 : 3) : id === "body" ? 6 : id === "venue" ? 3 : data.style === "neon-doodle" && id === "subtitle" ? 3 : 2;
    const content = shouldUppercase ? text.toUpperCase() : text;
    const lines = wrapLines(c, content, w, maxLines);
    const lineHeight = fontSize * (isTitle ? .96 : id === "body" ? 1.55 : 1.22);
    const startY = -Math.min(h * .44, (lines.length - .25) * lineHeight / 2);
    const startX = align === "left" ? -w / 2 : align === "right" ? w / 2 : 0;
    if (outlineTitle) {
      lines.forEach((line, index) => {
        const lineY = startY + fontSize + index * lineHeight;
        c.strokeText(line, startX, lineY, w);
        c.fillText(line, startX, lineY, w);
      });
    } else drawLines(c, lines, startX, startY + fontSize, lineHeight, { align, spacing: isTitle ? -1.1 * s : .15 * s });
    if (id === "date" && data.style !== "teacher-workshop") c.fillRect(startX - (align === "right" ? w * .22 : 0), startY + fontSize + 10 * s, w * .22, Math.max(2, 3 * s));
  }

  function drawFlatVisual(c, data, w, h, theme, seed) {
    const image = imageAssets[0];
    const variant = theme.visual;
    c.save();
    if (variant === "workshop" && !image?.placedOnCanvas) {
      const cols = 12;
      const rows = Math.max(7, Math.round(cols * h / w));
      const cell = Math.min(w / cols, h / rows);
      const drawW = cell * cols, drawH = cell * rows;
      const left = -drawW / 2, top = -drawH / 2;
      const rng = mulberry32(seed ^ 0x51f2a7);
      c.textAlign = "center"; c.textBaseline = "middle";
      c.font = `${cell * .72}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
      for (let row = 0; row < rows; row++) for (let col = 0; col < cols; col++) {
        if (!motifCellOn(row, col, rows, cols, data.motifPreset, rng)) continue;
        const cx = left + (col + .5) * cell, cy = top + (row + .5) * cell;
        c.fillStyle = alpha(theme.accent, (row + col) % 3 === 0 ? .18 : .08);
        c.fillRect(cx - cell * .41, cy - cell * .41, cell * .82, cell * .82);
        c.fillStyle = theme.ink;
        c.fillText(data.motifEmoji || "👀", cx, cy + cell * .015);
      }
      c.restore();
      return;
    }
    if (variant === "quiet" || variant === "ring" || variant === "atlas") {
      c.beginPath(); c.arc(0, 0, Math.min(w, h) * .46, 0, Math.PI * 2); c.clip();
    } else {
      roundedRectPath(c, -w / 2, -h / 2, w, h, variant === "editorial" ? 0 : Math.min(w, h) * .025); c.clip();
    }
    if (image) {
      if (image.cutout) {
        const ratio = Math.min(w / image.img.naturalWidth, h / image.img.naturalHeight);
        const iw = image.img.naturalWidth * ratio, ih = image.img.naturalHeight * ratio;
        c.drawImage(image.img, -iw / 2, -ih / 2, iw, ih);
      } else coverImage(c, image.img, -w / 2, -h / 2, w, h);
    } else if (variant === "electric") {
      drawFluidObject(c, -w / 2, -h / 2, w, h, theme.accent, seed, true);
    }
    c.restore();
  }

  function drawFlatCourses(c, data, w, h, theme) {
    if (data.style === "teacher-workshop") {
      drawTeacherWorkshopCourses(c, data, w, h, theme);
      return;
    }
    const courses = (data.workshopCourses || []).slice(0, 8);
    const cols = 2, gap = w * .025;
    const cardW = (w - gap) / cols;
    const rows = Math.max(1, Math.ceil(courses.length / cols));
    const cardH = (h - gap * (rows - 1)) / rows;
    courses.forEach((course, index) => {
      const col = index % cols, row = Math.floor(index / cols);
      const x = -w / 2 + col * (cardW + gap), y = -h / 2 + row * (cardH + gap);
      c.fillStyle = index % 3 === 0 ? alpha(theme.accent, .13) : "#f6f5f1"; c.fillRect(x, y, cardW, cardH);
      c.strokeStyle = theme.ink; c.lineWidth = Math.max(1.5, w * .0025); c.strokeRect(x, y, cardW, cardH);
      c.fillStyle = theme.ink; c.textAlign = "left"; c.textBaseline = "top";
      c.font = `900 ${Math.max(13, cardH * .15)}px Arial, "Microsoft YaHei", sans-serif`; c.fillText(`${String(index + 1).padStart(2, "0")}  ${course.title}`, x + cardW * .055, y + cardH * .12, cardW * .88);
      c.font = `700 ${Math.max(9, cardH * .085)}px Arial, "Microsoft YaHei", sans-serif`; c.fillText(course.meta, x + cardW * .055, y + cardH * .48, cardW * .88);
      c.font = `500 ${Math.max(8, cardH * .07)}px Arial, "Microsoft YaHei", sans-serif`; c.fillText(course.desc, x + cardW * .055, y + cardH * .68, cardW * .88);
    });
  }

  function drawTeacherWorkshopCourses(c, data, w, h, theme) {
    const courses = (Array.isArray(data.workshopCourses) && data.workshopCourses.length
      ? data.workshopCourses
      : TEACHER_WORKSHOP_COURSES).slice(0, 4);
    const unit = w / 900;
    const left = -w / 2;
    const top = -h / 2;
    const columnCenters = [left + w * .25, left + w * .75];
    const rowOffsets = [h * .09, h * .52];

    c.fillStyle = theme.ink;
    c.textAlign = "center";
    c.textBaseline = "alphabetic";

    courses.forEach((course, index) => {
      const column = index % 2;
      const row = Math.floor(index / 2);
      const x = columnCenters[column];
      const y = top + rowOffsets[row];
      const rawDescription = String(course.desc || "");
      const divider = rawDescription.indexOf(" / ");
      const english = divider >= 0 ? rawDescription.slice(0, divider) : rawDescription;
      const detail = divider >= 0 ? rawDescription.slice(divider + 3) : "";

      c.fillStyle = theme.ink;
      c.font = `900 ${31 * unit}px Arial, "Microsoft YaHei", "PingFang SC", sans-serif`;
      c.fillText(course.title || "工坊课程", x, y, w * .40);

      c.fillStyle = "#777777";
      c.font = `italic 500 ${25 * unit}px Arial, sans-serif`;
      c.fillText(english, x, y + h * .085, w * .40);

      c.fillStyle = theme.ink;
      c.font = `900 ${25 * unit}px Arial, "Microsoft YaHei", "PingFang SC", sans-serif`;
      c.fillText(course.meta || "时间 · 教室", x, y + h * .18, w * .42);

      c.fillStyle = "#555555";
      c.font = `500 ${22 * unit}px Arial, "Microsoft YaHei", "PingFang SC", sans-serif`;
      c.fillText(detail, x, y + h * .255, w * .42);
    });

    const centerX = 0;
    const signalY = top + h * .18;
    const signalW = 13 * unit;
    const signalH = 34 * unit;
    roundedRectPath(c, centerX - signalW / 2, signalY - signalH / 2, signalW, signalH, signalW / 2);
    c.fillStyle = "#343434";
    c.fill();
    ["#ef365f", "#f3d532", "#54b96a"].forEach((color, index) => {
      c.fillStyle = color;
      c.beginPath();
      c.arc(centerX, signalY - signalH * .27 + index * signalH * .27, 3.1 * unit, 0, Math.PI * 2);
      c.fill();
    });

    const barrierY = top + h * .40;
    const barrierW = 34 * unit;
    const barrierH = 15 * unit;
    c.save();
    c.beginPath();
    c.rect(centerX - barrierW / 2, barrierY - barrierH / 2, barrierW, barrierH);
    c.clip();
    c.fillStyle = "#f5cc20";
    c.fillRect(centerX - barrierW / 2, barrierY - barrierH / 2, barrierW, barrierH);
    c.strokeStyle = "#181818";
    c.lineWidth = 6 * unit;
    for (let x = centerX - barrierW; x < centerX + barrierW; x += 13 * unit) {
      c.beginPath();
      c.moveTo(x, barrierY + barrierH);
      c.lineTo(x + 17 * unit, barrierY - barrierH);
      c.stroke();
    }
    c.restore();

    c.fillStyle = theme.ink;
    c.font = `400 ${20 * unit}px Georgia, "Times New Roman", serif`;
    c.fillText("QR", centerX, top + h * .615);

    c.fillStyle = theme.accent;
    c.font = `900 ${58 * unit}px Arial, sans-serif`;
    const marks = ["!", "!", "!", "!", "?"];
    const markX = [-.21, -.105, 0, .105, .225];
    marks.forEach((mark, index) => c.fillText(mark, w * markX[index], top + h * .985));
  }

  function drawCollageMaterials(c, data, W, H, seed) {
    const types = data.decorations.slice(0, 8);
    const base = W / 1080;
    const sizeScale = clamp((Number(data.materialScale) || 100) / 100, .7, 1.45);
    const anchors = [
      [.08, .14], [.77, .12], [.12, .72], [.78, .70],
      [.43, .08], [.44, .84], [.03, .43], [.83, .40]
    ];

    types.forEach((type, index) => {
      const random = mulberry32(seed ^ hashString(`${type}-${index}`));
      const anchor = anchors[(index + Math.floor(random() * anchors.length)) % anchors.length];
      const autoX = (anchor[0] + (random() - .5) * .12) * W;
      const autoY = (anchor[1] + (random() - .5) * .10) * H;
      const transform = data.materialTransforms?.[type] || {};
      const x = Number.isFinite(transform.x) ? transform.x * W : autoX;
      const y = Number.isFinite(transform.y) ? transform.y * H : autoY;
      const elementScale = clamp(Number(transform.scale) || 1, .4, 2.5);
      const unit = base * sizeScale * (.82 + random() * .38) * elementScale;
      const rotation = (random() - .5) * .48;
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.globalAlpha = .84;
      c.lineCap = "round";
      c.lineJoin = "round";

      if (type === "tape") {
        const w = 220 * unit, h = 58 * unit;
        c.fillStyle = "rgba(230,207,148,.76)";
        c.fillRect(-w / 2, -h / 2, w, h);
        c.strokeStyle = "rgba(96,77,42,.16)"; c.lineWidth = 1.2 * unit;
        for (let px = -w / 2 + 9 * unit; px < w / 2; px += 13 * unit) {
          c.beginPath(); c.moveTo(px, -h / 2); c.lineTo(px + 17 * unit, h / 2); c.stroke();
        }
      } else if (type === "torn-paper") {
        const w = 236 * unit, h = 160 * unit;
        const randomEdge = mulberry32(seed + index * 97);
        c.shadowColor = "rgba(0,0,0,.18)"; c.shadowBlur = 14 * unit; c.shadowOffsetY = 8 * unit;
        c.beginPath(); c.moveTo(-w / 2, -h / 2 + 9 * unit);
        for (let i = 1; i <= 8; i++) c.lineTo(-w / 2 + w * i / 8, -h / 2 + randomEdge() * 14 * unit);
        for (let i = 1; i <= 6; i++) c.lineTo(w / 2 - randomEdge() * 10 * unit, -h / 2 + h * i / 6);
        for (let i = 1; i <= 8; i++) c.lineTo(w / 2 - w * i / 8, h / 2 - randomEdge() * 14 * unit);
        for (let i = 1; i <= 6; i++) c.lineTo(-w / 2 + randomEdge() * 10 * unit, h / 2 - h * i / 6);
        c.closePath(); c.fillStyle = "#f2ebdc"; c.fill();
        c.shadowColor = "transparent";
        c.strokeStyle = "rgba(70,64,52,.22)"; c.lineWidth = 1.2 * unit; c.stroke();
      } else if (type === "halftone") {
        const radius = 88 * unit;
        c.fillStyle = alpha(data.accent, .72);
        for (let iy = -6; iy <= 6; iy++) for (let ix = -6; ix <= 6; ix++) {
          const dx = ix * 14 * unit, dy = iy * 14 * unit;
          const fade = Math.max(0, 1 - Math.hypot(dx, dy) / radius);
          if (fade > .05) { c.beginPath(); c.arc(dx, dy, Math.max(1.1, 4.2 * fade) * unit, 0, Math.PI * 2); c.fill(); }
        }
      } else if (type === "scribble") {
        c.strokeStyle = data.style === "ici-electric" ? "#fff" : "#171716";
        c.lineWidth = 5 * unit;
        for (let line = 0; line < 3; line++) {
          c.beginPath();
          c.moveTo(-112 * unit, (-28 + line * 24) * unit);
          c.bezierCurveTo(-54 * unit, (-96 + line * 12) * unit, 18 * unit, (76 - line * 16) * unit, 112 * unit, (-24 + line * 22) * unit);
          c.stroke();
        }
      } else if (type === "starburst") {
        const outer = 78 * unit, inner = 38 * unit;
        c.beginPath();
        for (let i = 0; i < 28; i++) {
          const radius = i % 2 ? inner : outer;
          const angle = -Math.PI / 2 + i * Math.PI / 14;
          const px = Math.cos(angle) * radius, py = Math.sin(angle) * radius;
          i ? c.lineTo(px, py) : c.moveTo(px, py);
        }
        c.closePath(); c.fillStyle = data.accent; c.fill();
        c.fillStyle = "#fff"; c.font = `900 ${24 * unit}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("NEW", 0, 1 * unit);
      } else if (type === "arrow") {
        c.strokeStyle = data.accent; c.fillStyle = data.accent; c.lineWidth = 12 * unit;
        c.beginPath(); c.moveTo(-108 * unit, 30 * unit); c.quadraticCurveTo(-8 * unit, -44 * unit, 94 * unit, 4 * unit); c.stroke();
        c.beginPath(); c.moveTo(92 * unit, 4 * unit); c.lineTo(57 * unit, -18 * unit); c.lineTo(66 * unit, 29 * unit); c.closePath(); c.fill();
      } else if (type === "stamp") {
        const ink = data.style === "art-blue" ? "#165fc5" : "#d64d3e";
        c.strokeStyle = ink; c.fillStyle = ink; c.lineWidth = 4 * unit;
        c.beginPath(); c.arc(0, 0, 63 * unit, 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.arc(0, 0, 49 * unit, 0, Math.PI * 2); c.stroke();
        c.font = `900 ${23 * unit}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("ICI", 0, -9 * unit);
        c.font = `700 ${10 * unit}px Arial, sans-serif`; c.fillText("CREATIVE / 2026", 0, 15 * unit);
      } else if (type === "barcode") {
        c.fillStyle = data.style === "ici-electric" ? "#fff" : "#151514";
        let px = -82 * unit;
        for (let i = 0; i < 26; i++) {
          const w = (i % 5 === 0 ? 7 : i % 3 === 0 ? 4 : 2) * unit;
          const h = (54 + (i % 4) * 8) * unit;
          c.fillRect(px, -h / 2, w, h); px += w + (3 + i % 2) * unit;
        }
        c.font = `700 ${9 * unit}px ui-monospace, monospace`; c.textAlign = "left"; c.textBaseline = "top"; c.fillText("FORM·01 / 0826", -82 * unit, 46 * unit);
      } else if (type === "grid-patch") {
        const w = 170 * unit, h = 135 * unit;
        c.strokeStyle = alpha(data.accent, .72); c.lineWidth = 1.5 * unit;
        for (let gx = -w / 2; gx <= w / 2; gx += 21 * unit) { c.beginPath(); c.moveTo(gx, -h / 2); c.lineTo(gx, h / 2); c.stroke(); }
        for (let gy = -h / 2; gy <= h / 2; gy += 21 * unit) { c.beginPath(); c.moveTo(-w / 2, gy); c.lineTo(w / 2, gy); c.stroke(); }
        c.lineWidth = 3 * unit; c.strokeRect(-w / 2, -h / 2, w, h);
      } else if (type === "target") {
        c.strokeStyle = data.style === "ici-electric" ? "#fff" : "#171716"; c.lineWidth = 4 * unit;
        [74, 51, 28].forEach((radius) => { c.beginPath(); c.arc(0, 0, radius * unit, 0, Math.PI * 2); c.stroke(); });
        c.beginPath(); c.moveTo(-88 * unit, 0); c.lineTo(88 * unit, 0); c.moveTo(0, -88 * unit); c.lineTo(0, 88 * unit); c.stroke();
      } else if (type === "confetti") {
        const colors = [data.accent, "#ffd12f", "#ff5e55", "#2c72e8", "#161615"];
        for (let i = 0; i < 28; i++) {
          const cx = (random() - .5) * 210 * unit, cy = (random() - .5) * 150 * unit;
          c.save(); c.translate(cx, cy); c.rotate(random() * Math.PI); c.fillStyle = colors[i % colors.length];
          if (i % 4 === 0) { c.beginPath(); c.arc(0, 0, (3 + random() * 5) * unit, 0, Math.PI * 2); c.fill(); }
          else c.fillRect(-8 * unit, -3 * unit, 16 * unit, 6 * unit);
          c.restore();
        }
      } else if (type === "gradient-orb") {
        const radius = 96 * unit;
        const gradient = c.createRadialGradient(-30 * unit, -34 * unit, 5 * unit, 0, 0, radius);
        gradient.addColorStop(0, "rgba(255,255,255,.98)");
        gradient.addColorStop(.22, alpha(data.accent, .5));
        gradient.addColorStop(.66, data.accent);
        gradient.addColorStop(1, "rgba(24,24,24,.18)");
        c.fillStyle = gradient; c.beginPath(); c.arc(0, 0, radius, 0, Math.PI * 2); c.fill();
      } else if (type === "neon-brush") {
        const brushRandom = mulberry32(seed ^ (index + 17) * 2389);
        c.globalAlpha = .96;
        c.strokeStyle = "#2dff00";
        for (let i = 0; i < 15; i++) {
          const sy = (-54 + i * 7 + (brushRandom() - .5) * 10) * unit;
          c.lineWidth = (8 + brushRandom() * 17) * unit;
          c.beginPath();
          c.moveTo((-118 + brushRandom() * 18) * unit, sy);
          c.bezierCurveTo(-56 * unit, (sy / unit - 23 + brushRandom() * 38) * unit, 42 * unit, (sy / unit + 20 - brushRandom() * 36) * unit, (118 - brushRandom() * 16) * unit, sy + (brushRandom() - .5) * 18 * unit);
          c.stroke();
        }
      } else if (type === "neon-blob") {
        c.globalAlpha = .95;
        c.fillStyle = "#2dff00";
        const lobes = [
          [-68, -5, 82, 116, -.38], [-15, -22, 92, 132, .18], [48, -2, 88, 118, -.12],
          [-42, 37, 102, 88, .22], [32, 34, 112, 90, -.18]
        ];
        lobes.forEach(([lx, ly, lw, lh, lr]) => {
          c.save(); c.translate(lx * unit, ly * unit); c.rotate(lr); c.beginPath(); c.ellipse(0, 0, lw * unit / 2, lh * unit / 2, 0, 0, Math.PI * 2); c.fill(); c.restore();
        });
      } else if (type === "charcoal-brush") {
        const charcoalRandom = mulberry32(seed ^ (index + 31) * 3571);
        c.lineCap = "butt";
        for (let i = 0; i < 52; i++) {
          const sy = (-67 + charcoalRandom() * 134) * unit;
          const start = (-120 + charcoalRandom() * 34) * unit;
          const end = (40 + charcoalRandom() * 92) * unit;
          c.strokeStyle = `rgba(18,18,18,${(.13 + charcoalRandom() * .68).toFixed(2)})`;
          c.lineWidth = (1.5 + charcoalRandom() * 8.5) * unit;
          c.beginPath();
          c.moveTo(start, sy);
          c.quadraticCurveTo((charcoalRandom() - .5) * 28 * unit, sy + (charcoalRandom() - .5) * 24 * unit, end, sy + (charcoalRandom() - .5) * 15 * unit);
          c.stroke();
        }
      } else if (type === "charcoal-flower") {
        const petalRandom = mulberry32(seed ^ (index + 43) * 4211);
        for (let i = 0; i < 7; i++) {
          const angle = i * Math.PI * 2 / 7 + .12;
          const length = (82 + petalRandom() * 34) * unit;
          const width = (28 + petalRandom() * 18) * unit;
          c.save(); c.rotate(angle);
          c.beginPath(); c.moveTo(0, 0);
          c.bezierCurveTo(width, -length * .2, width * .9, -length * .78, 0, -length);
          c.bezierCurveTo(-width * .9, -length * .78, -width, -length * .2, 0, 0);
          c.fillStyle = `rgba(20,20,20,${(.56 + petalRandom() * .28).toFixed(2)})`; c.fill();
          c.strokeStyle = "rgba(245,245,240,.28)"; c.lineWidth = 1.7 * unit;
          for (let hatch = -2; hatch <= 2; hatch++) {
            c.beginPath(); c.moveTo(hatch * width * .12, -10 * unit); c.lineTo(hatch * width * .22, -length * .78); c.stroke();
          }
          c.restore();
        }
        c.fillStyle = "#181818"; c.beginPath(); c.arc(0, 0, 18 * unit, 0, Math.PI * 2); c.fill();
      } else if (type === "neon-loop") {
        c.globalAlpha = .96;
        c.strokeStyle = "#2dff00"; c.lineWidth = 5.5 * unit;
        c.beginPath(); c.moveTo(-126 * unit, 18 * unit);
        c.bezierCurveTo(-102 * unit, -88 * unit, -62 * unit, -88 * unit, -48 * unit, 8 * unit);
        c.bezierCurveTo(-34 * unit, 92 * unit, 4 * unit, 90 * unit, 16 * unit, 0);
        c.bezierCurveTo(28 * unit, -78 * unit, 66 * unit, -78 * unit, 78 * unit, 3 * unit);
        c.bezierCurveTo(89 * unit, 75 * unit, 112 * unit, 60 * unit, 127 * unit, -18 * unit);
        c.stroke();
      } else if (type === "contour-line") {
        c.globalAlpha = .9;
        c.strokeStyle = "#202020"; c.lineWidth = 3.2 * unit;
        c.beginPath(); c.moveTo(-126 * unit, 58 * unit);
        c.bezierCurveTo(-73 * unit, 40 * unit, -119 * unit, -42 * unit, -49 * unit, -57 * unit);
        c.bezierCurveTo(8 * unit, -69 * unit, -29 * unit, 38 * unit, 31 * unit, 54 * unit);
        c.bezierCurveTo(88 * unit, 70 * unit, 68 * unit, -47 * unit, 128 * unit, -60 * unit);
        c.stroke();
        c.beginPath(); c.moveTo(-91 * unit, 79 * unit); c.bezierCurveTo(-45 * unit, 11 * unit, 38 * unit, 112 * unit, 103 * unit, 35 * unit); c.stroke();
      }
      c.restore();
      if (c === ctx) {
        const baseRadius = { tape: 120, "torn-paper": 135, halftone: 95, scribble: 125, starburst: 84, arrow: 125, stamp: 72, barcode: 95, "grid-patch": 105, target: 92, confetti: 122, "gradient-orb": 104, "neon-brush": 135, "neon-blob": 128, "charcoal-brush": 135, "charcoal-flower": 122, "neon-loop": 138, "contour-line": 138 }[type] || 100;
        interactiveHitAreas.push({ kind: "material", id: type, x, y, radius: baseRadius * unit });
      }
    });
  }

  function drawEmojiStickers(c, data, W, H) {
    const base = W / 1080;
    const globalScale = clamp((Number(data.materialScale) || 100) / 100, .7, 1.45);
    data.emojiStickers.slice(0, 32).forEach((sticker, index) => {
      const random = mulberry32(hashString(`${sticker.id}-${sticker.emoji}`));
      const autoX = (.12 + random() * .76) * W;
      const autoY = (.13 + random() * .74) * H;
      const x = Number.isFinite(sticker.x) ? sticker.x * W : autoX;
      const y = Number.isFinite(sticker.y) ? sticker.y * H : autoY;
      const scale = clamp(Number(sticker.scale) || 1, .4, 2.8);
      const size = 92 * base * globalScale * scale;
      const rotation = Number.isFinite(sticker.rotation) ? sticker.rotation : (random() - .5) * .34;
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.globalAlpha = .98;
      c.font = `${size}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.shadowColor = "rgba(0,0,0,.16)";
      c.shadowBlur = 9 * base;
      c.shadowOffsetY = 5 * base;
      c.fillText(sticker.emoji, 0, 0);
      c.restore();
      if (c === ctx) interactiveHitAreas.push({ kind: "emoji", id: sticker.id, x, y, radius: size * .64 });
    });
  }

  function elementKey(element) {
    return element ? `${element.kind}:${element.id}` : "";
  }

  function drawActiveElementOutline(c) {
    const hit = interactiveHitAreas.find((area) => elementKey(area) === elementKey(activeElement));
    if (!hit) return;
    c.save();
    c.strokeStyle = "rgba(255,255,255,.96)";
    c.lineWidth = Math.max(3, canvas.width / 360);
    c.setLineDash([10 * canvas.width / 1080, 7 * canvas.width / 1080]);
    if (hit.w && hit.h) c.strokeRect(hit.x - hit.w / 2 - 8 * canvas.width / 1080, hit.y - hit.h / 2 - 8 * canvas.width / 1080, hit.w + 16 * canvas.width / 1080, hit.h + 16 * canvas.width / 1080);
    else { c.beginPath(); c.arc(hit.x, hit.y, hit.radius + 13 * canvas.width / 1080, 0, Math.PI * 2); c.stroke(); }
    c.strokeStyle = "rgba(20,20,18,.92)";
    c.lineDashOffset = 8 * canvas.width / 1080;
    if (hit.w && hit.h) c.strokeRect(hit.x - hit.w / 2 - 8 * canvas.width / 1080, hit.y - hit.h / 2 - 8 * canvas.width / 1080, hit.w + 16 * canvas.width / 1080, hit.h + 16 * canvas.width / 1080);
    else { c.beginPath(); c.arc(hit.x, hit.y, hit.radius + 13 * canvas.width / 1080, 0, Math.PI * 2); c.stroke(); }
    c.setLineDash([]);
    c.fillStyle = "#fff"; c.strokeStyle = "#1b1b19"; c.lineWidth = 3 * canvas.width / 1080;
    const handleX = hit.w ? hit.x + hit.w / 2 : hit.x + hit.radius * .7;
    const handleY = hit.h ? hit.y - hit.h / 2 : hit.y - hit.radius * .7;
    c.beginPath(); c.arc(handleX, handleY, 10 * canvas.width / 1080, 0, Math.PI * 2); c.fill(); c.stroke();
    c.restore();
  }

  function drawSmartGuides(c, W, H) {
    const unit = W / 1080;
    c.save();
    c.lineWidth = Math.max(1.25, 1.6 * unit);
    c.setLineDash([7 * unit, 8 * unit]);
    c.strokeStyle = "rgba(36, 170, 205, .46)";
    c.strokeRect(W * .05, H * .05, W * .90, H * .90);
    c.beginPath();
    c.moveTo(W * .50, 0); c.lineTo(W * .50, H);
    c.moveTo(0, H * .50); c.lineTo(W, H * .50);
    c.stroke();

    c.setLineDash([]);
    c.strokeStyle = "rgba(240, 41, 105, .96)";
    c.fillStyle = "rgba(240, 41, 105, .96)";
    c.lineWidth = Math.max(2, 2.4 * unit);
    c.font = `800 ${12 * unit}px Arial, "Microsoft YaHei", sans-serif`;
    c.textBaseline = "top";

    const vertical = [...new Map((activeSmartGuides.vertical || []).map((guide) => [Math.round(guide.value), guide])).values()];
    const horizontal = [...new Map((activeSmartGuides.horizontal || []).map((guide) => [Math.round(guide.value), guide])).values()];
    vertical.forEach((guide) => {
      c.beginPath(); c.moveTo(guide.value, 0); c.lineTo(guide.value, H); c.stroke();
      const label = guide.label || "对齐";
      const labelWidth = c.measureText(label).width + 12 * unit;
      c.fillRect(clamp(guide.value + 6 * unit, 2 * unit, W - labelWidth - 2 * unit), 6 * unit, labelWidth, 20 * unit);
      c.fillStyle = "#ffffff";
      c.fillText(label, clamp(guide.value + 12 * unit, 8 * unit, W - labelWidth + 4 * unit), 9 * unit);
      c.fillStyle = "rgba(240, 41, 105, .96)";
    });
    horizontal.forEach((guide) => {
      c.beginPath(); c.moveTo(0, guide.value); c.lineTo(W, guide.value); c.stroke();
      const label = guide.label || "对齐";
      const labelWidth = c.measureText(label).width + 12 * unit;
      const labelY = clamp(guide.value - 26 * unit, 4 * unit, H - 24 * unit);
      c.fillRect(6 * unit, labelY, labelWidth, 20 * unit);
      c.fillStyle = "#ffffff";
      c.fillText(label, 12 * unit, labelY + 3 * unit);
      c.fillStyle = "rgba(240, 41, 105, .96)";
    });
    c.restore();
  }

  function drawIciGrid(c, data, W, H, s, seed) {
    const ink = "#141416";
    const margin = 26 * s;
    const dense = Number(data.density);
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);
    if (data.showGrid) drawGrid(c, W, H, 24 * s, "#65b8c7", 5);

    if (imageAssets.length) {
      c.save();
      c.translate(W * .64, H * .46);
      c.rotate(-.13);
      roundedRectPath(c, -W * .27, -H * .22, W * .52, H * .39, W * .22);
      c.clip();
      coverImage(c, imageAssets[0].img, -W * .27, -H * .22, W * .52, H * .39);
      c.globalCompositeOperation = "multiply";
      c.fillStyle = alpha(data.accent, .34); c.fillRect(-W * .3, -H * .25, W * .6, H * .5);
      c.restore();
      c.save(); c.strokeStyle = ink; c.lineWidth = 15 * s;
      c.beginPath(); c.ellipse(W * .63, H * .45, W * .27, H * .19, -.13, 0, Math.PI * 2); c.stroke(); c.restore();
    } else {
      drawRibbonSculpture(c, W, H, data.accent, seed);
    }

    c.fillStyle = ink;
    c.font = `900 ${36 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, "ICI", margin, 58 * s, -2 * s);
    c.font = `700 ${12 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin + 89 * s, 54 * s, 1.4 * s);

    const titleMax = H < W * 1.15 ? W * .52 : W * .66;
    const titleSize = fitFont(c, data.title, titleMax, (dense === 0 ? 91 : 102) * s, 52 * s, 'Arial, "Microsoft YaHei", sans-serif', 900);
    c.font = `900 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    const titleLines = wrapLines(c, data.title, titleMax, H > W * 1.35 ? 3 : 2);
    drawLines(c, titleLines, margin, 150 * s, titleSize * .95, { spacing: -2.6 * s });

    c.font = `800 ${23 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), margin, 195 * s + titleLines.length * titleSize * .9, .3 * s);

    const qrSize = 102 * s;
    drawPseudoQR(c, W - margin - qrSize, 25 * s, qrSize, ink, seed);

    const infoY = H * (H > W * 1.55 ? .70 : .67);
    c.fillStyle = ink;
    c.font = `900 ${56 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.date.toUpperCase(), margin, infoY, -2.4 * s);
    c.fillRect(margin, infoY + 16 * s, W * .16, 4 * s);
    c.font = `700 ${18 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.time.toUpperCase(), margin, infoY + 52 * s, 1 * s);

    const venueWidth = W * .36;
    c.font = `850 ${26 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const venueLines = wrapLines(c, data.venue, venueWidth, 3);
    drawLines(c, venueLines, W - margin, infoY + 4 * s, 31 * s, { align: "right", spacing: -.7 * s });

    if (dense > 0 && H > W * 1.16) {
      const bodyWidth = W * .45;
      c.font = `500 ${14 * s}px Arial, "Microsoft YaHei", sans-serif`;
      const bodyLines = wrapLines(c, data.body, bodyWidth, dense === 2 ? 5 : 3);
      drawLines(c, bodyLines, W - margin, infoY + 107 * s, 23 * s, { align: "right", spacing: .2 * s });
    }

    const footerY = H - 52 * s;
    c.fillStyle = ink;
    c.fillRect(margin, H - 180 * s, 3 * s, 125 * s);
    c.font = `900 ${48 * s}px Arial, sans-serif`;
    drawSpacedText(c, "ICI", margin + 18 * s, H - 120 * s, -2 * s);
    c.font = `800 ${17 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const org = wrapLines(c, data.organizer.toUpperCase(), W * .47, 3);
    drawLines(c, org, margin + 18 * s, H - 88 * s, 20 * s, { spacing: .2 * s });

    c.strokeStyle = ink; c.lineWidth = 3 * s;
    c.strokeRect(W - margin - 56 * s, H - 112 * s, 56 * s, 56 * s);
    c.beginPath(); c.moveTo(W - margin - 43 * s, H - 99 * s); c.lineTo(W - margin - 13 * s, H - 69 * s); c.moveTo(W - margin - 13 * s, H - 99 * s); c.lineTo(W - margin - 13 * s, H - 69 * s); c.lineTo(W - margin - 43 * s, H - 69 * s); c.stroke();
    c.font = `600 ${9 * s}px Arial, sans-serif`;
    drawSpacedText(c, String(data.seed).slice(-4).padStart(4, "0"), W - margin, footerY + 22 * s, 1.6 * s, "right");
  }

  function drawIciElectric(c, data, W, H, s, seed) {
    const bg = data.background;
    const ink = contrastColor(bg);
    const margin = 34 * s;
    c.fillStyle = bg; c.fillRect(0, 0, W, H);

    const vertical = H > W * 1.2;
    const fluidW = vertical ? W * .68 : W * .5;
    const fluidH = vertical ? H * .46 : H * .68;
    if (imageAssets.length) {
      c.save();
      c.translate(W * .68, H * .48);
      c.rotate(.08);
      const blob = new Path2D();
      blob.moveTo(-fluidW * .48, -fluidH * .25);
      blob.bezierCurveTo(-fluidW * .55, -fluidH * .54, fluidW * .05, -fluidH * .63, fluidW * .39, -fluidH * .24);
      blob.bezierCurveTo(fluidW * .58, fluidH * .09, fluidW * .31, fluidH * .55, -fluidW * .08, fluidH * .48);
      blob.bezierCurveTo(-fluidW * .48, fluidH * .42, -fluidW * .58, fluidH * .08, -fluidW * .48, -fluidH * .25);
      c.clip(blob);
      coverImage(c, imageAssets[0].img, -fluidW * .55, -fluidH * .62, fluidW * 1.12, fluidH * 1.2);
      c.globalCompositeOperation = "screen";
      const wash = c.createLinearGradient(-fluidW / 2, -fluidH / 2, fluidW / 2, fluidH / 2);
      wash.addColorStop(0, alpha(data.accent, .85)); wash.addColorStop(1, "rgba(30,15,120,.18)");
      c.fillStyle = wash; c.fill(blob);
      c.restore();
    } else {
      drawFluidObject(c, W * .37, H * .20, fluidW, fluidH, data.accent, seed, true);
    }

    c.save(); c.globalAlpha = .96; c.fillStyle = ink;
    const marquee = `${data.organizer.toUpperCase()}   /   `;
    c.font = `800 ${16 * s}px Arial, sans-serif`;
    const repeat = marquee.repeat(5);
    drawSpacedText(c, repeat, -W * .18, 29 * s, 2.8 * s);
    drawSpacedText(c, repeat, -W * .1, H - 18 * s, 2.8 * s);
    c.restore();

    c.fillStyle = ink;
    c.font = `900 ${30 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 89 * s, .2 * s);
    c.strokeStyle = ink; c.lineWidth = 2 * s;
    c.beginPath(); c.moveTo(margin, 108 * s); c.lineTo(W - margin, 108 * s); c.stroke();

    const titleWidth = vertical ? W * .78 : W * .58;
    const titleSize = fitFont(c, data.title, titleWidth, (Number(data.density) === 0 ? 112 : 132) * s, 58 * s, 'Arial, "Microsoft YaHei", sans-serif', 900);
    c.font = `900 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    const lines = wrapLines(c, data.title, titleWidth, vertical ? 4 : 3);
    const titleY = vertical ? H * .25 : H * .3;
    drawLines(c, lines, margin, titleY, titleSize * .88, { spacing: -4 * s });

    c.save();
    c.translate(W - 24 * s, H * .16);
    c.rotate(Math.PI / 2);
    c.font = `800 ${18 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), 0, 0, 2 * s);
    c.restore();

    const infoY = H - (vertical ? 250 : 165) * s;
    c.fillStyle = ink;
    c.font = `900 ${50 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.date.toUpperCase(), margin, infoY, -1.5 * s);
    c.font = `700 ${17 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.time.toUpperCase(), margin, infoY + 34 * s, 1.1 * s);
    const venueLines = wrapLines(c, data.venue, W * .4, 2);
    drawLines(c, venueLines, W - margin, infoY, 25 * s, { align: "right", spacing: -.3 * s });

    if (Number(data.density) > 0 && vertical) {
      c.font = `500 ${13 * s}px Arial, "Microsoft YaHei", sans-serif`;
      const bodyLines = wrapLines(c, data.body, W * .44, 4);
      drawLines(c, bodyLines, W - margin, infoY + 65 * s, 21 * s, { align: "right", spacing: .3 * s });
    }
  }

  function drawSwiss(c, data, W, H, s, seed) {
    const ink = "#151512";
    const accent = data.accent;
    const margin = 48 * s;
    const rng = mulberry32(seed);
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);

    const col = (W - margin * 2) / 12;
    if (data.showGrid) {
      c.save(); c.strokeStyle = alpha(ink, .14); c.lineWidth = 1 * s;
      for (let i = 0; i <= 12; i++) { c.beginPath(); c.moveTo(margin + i * col, margin); c.lineTo(margin + i * col, H - margin); c.stroke(); }
      for (let y = margin; y < H - margin; y += col) { c.beginPath(); c.moveTo(margin, y); c.lineTo(W - margin, y); c.stroke(); }
      c.restore();
    }

    c.fillStyle = accent;
    const circleR = (H < W * 1.15 ? 150 : 190) * s;
    c.beginPath(); c.arc(W - margin - circleR, margin + circleR * .8, circleR, 0, Math.PI * 2); c.fill();
    c.fillStyle = data.background;
    c.beginPath(); c.arc(W - margin - circleR * .55, margin + circleR * .55, circleR * .52, 0, Math.PI * 2); c.fill();

    c.fillStyle = ink;
    c.font = `800 ${14 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 72 * s, 2.2 * s);
    c.font = `900 ${24 * s}px Arial, sans-serif`;
    drawSpacedText(c, String(data.seed).slice(-2).padStart(2, "0"), W - margin, 72 * s, 1 * s, "right");

    const titleWidth = W * (H < W * 1.15 ? .58 : .73);
    const titleSize = fitFont(c, data.title, titleWidth, 126 * s, 55 * s, 'Arial, "Microsoft YaHei", sans-serif', 900);
    c.font = `900 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    const titleLines = wrapLines(c, data.title, titleWidth, H < W * 1.15 ? 2 : 4);
    const titleY = H * (H < W * 1.15 ? .31 : .27);
    drawLines(c, titleLines, margin, titleY, titleSize * .88, { spacing: -4.5 * s });

    c.font = `700 ${23 * s}px Arial, sans-serif`;
    const subY = titleY + titleLines.length * titleSize * .9 + 28 * s;
    drawSpacedText(c, data.subtitle.toUpperCase(), margin, subY, .5 * s);

    const imageY = Math.max(subY + 72 * s, H * .52);
    const imageH = H - imageY - 170 * s;
    if (imageAssets.length && imageH > 110 * s) {
      const imageW = W * .48;
      c.save();
      c.globalAlpha = .96;
      drawImageFrame(c, imageAssets[0].img, W - margin - imageW, imageY, imageW, imageH, { overlay: alpha(accent, .08) });
      c.restore();
      drawCropMarks(c, W - margin - imageW, imageY, imageW, imageH, ink, s);
    } else {
      c.fillStyle = ink;
      const blockW = W * (.31 + rng() * .1);
      c.fillRect(W - margin - blockW, imageY, blockW, imageH * .58);
      c.fillStyle = accent;
      c.fillRect(W - margin - blockW - col * 2, imageY + imageH * .58, blockW + col * 2, imageH * .19);
      c.strokeStyle = ink; c.lineWidth = 7 * s;
      c.beginPath(); c.moveTo(W - margin - blockW - col * 2, imageY + imageH * .94); c.lineTo(W - margin, imageY + imageH * .78); c.stroke();
    }

    const infoY = H - 112 * s;
    c.fillStyle = ink;
    c.font = `900 ${34 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.date.toUpperCase(), margin, infoY, -1 * s);
    c.font = `650 ${13 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.time.toUpperCase(), margin, infoY + 28 * s, 1.2 * s);
    const venueLines = wrapLines(c, data.venue, W * .33, 2);
    drawLines(c, venueLines, W - margin, infoY, 20 * s, { align: "right", spacing: .1 * s });

    if (Number(data.density) > 0 && H > W * 1.18) {
      c.font = `500 ${13 * s}px Arial, "Microsoft YaHei", sans-serif`;
      const bodyLines = wrapLines(c, data.body, W * .38, Number(data.density) === 2 ? 6 : 4);
      drawLines(c, bodyLines, margin, imageY + 18 * s, 20 * s, { spacing: .3 * s });
    }
  }

  function drawEditorial(c, data, W, H, s, seed) {
    const ink = "#16201c";
    const accent = data.accent;
    const margin = 44 * s;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);

    const landscape = H < W * 1.15;
    const photoX = landscape ? W * .48 : W * .39;
    const photoY = landscape ? 0 : H * .18;
    const photoW = W - photoX;
    const photoH = landscape ? H : H * .57;
    if (imageAssets.length) {
      drawImageFrame(c, imageAssets[0].img, photoX, photoY, photoW, photoH, { overlay: alpha(accent, .13) });
    } else {
      const grad = c.createLinearGradient(photoX, photoY, W, photoY + photoH);
      grad.addColorStop(0, alpha(accent, .98)); grad.addColorStop(1, "#a9c5ab");
      c.fillStyle = grad; c.fillRect(photoX, photoY, photoW, photoH);
      c.save(); c.translate(photoX + photoW * .45, photoY + photoH * .56); c.rotate(-.38);
      c.fillStyle = alpha("#f4eadc", .82);
      for (let i = 0; i < 5; i++) {
        c.beginPath(); c.ellipse(i * 38 * s, -i * 20 * s, 110 * s, 23 * s, i * .28, 0, Math.PI * 2); c.fill();
      }
      c.restore();
    }

    c.fillStyle = ink;
    c.font = `700 ${12 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 57 * s, 2.8 * s);
    c.fillRect(margin, 73 * s, 48 * s, 2 * s);

    const titleWidth = landscape ? W * .42 : W * .76;
    const titleSize = fitFont(c, data.title, titleWidth, 118 * s, 52 * s, 'Georgia, "Songti SC", serif', 400);
    c.font = `italic 400 ${titleSize}px Georgia, "Songti SC", serif`;
    const titleLines = wrapLines(c, data.title, titleWidth, 4);
    drawLines(c, titleLines, margin, landscape ? H * .31 : H * .15, titleSize * .93, { spacing: -2.4 * s });

    c.save();
    c.translate(photoX + 24 * s, photoY + photoH - 24 * s);
    c.rotate(-Math.PI / 2);
    c.fillStyle = "#fff";
    c.font = `700 ${11 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), 0, 0, 2.2 * s);
    c.restore();

    const lowerY = landscape ? H * .68 : H * .79;
    c.fillStyle = ink;
    c.font = `500 ${17 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const bodyWidth = landscape ? W * .37 : W * .56;
    const bodyLines = wrapLines(c, data.body, bodyWidth, Number(data.density) === 0 ? 3 : 6);
    drawLines(c, bodyLines, margin, lowerY, 27 * s, { spacing: .5 * s });

    c.strokeStyle = alpha(ink, .7); c.lineWidth = 1 * s;
    c.beginPath(); c.moveTo(margin, lowerY - 31 * s); c.lineTo(W - margin, lowerY - 31 * s); c.stroke();

    c.font = `400 ${52 * s}px Georgia, serif`;
    drawSpacedText(c, data.date.toUpperCase(), W - margin, lowerY + 8 * s, -1.8 * s, "right");
    c.font = `700 ${13 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const info = `${data.time}  /  ${data.venue}`;
    const infoLines = wrapLines(c, info, W * .38, 3);
    drawLines(c, infoLines, W - margin, lowerY + 43 * s, 20 * s, { align: "right", spacing: .3 * s });

    c.fillStyle = accent;
    c.beginPath(); c.arc(W - margin - 13 * s, H - 38 * s, 13 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = ink;
    c.font = `700 ${10 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.organizer.toUpperCase(), margin, H - 34 * s, 1.8 * s);
  }

  function drawCollage(c, data, W, H, s, seed) {
    const ink = "#171614";
    const rng = mulberry32(seed);
    const margin = 34 * s;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);

    c.fillStyle = data.accent;
    c.save(); c.translate(W * .72, H * .18); c.rotate(.11);
    c.fillRect(-W * .27, -H * .13, W * .54, H * .27); c.restore();
    c.fillStyle = "#3970f2";
    c.beginPath(); c.arc(W * .18, H * .33, W * .15, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff5e4";
    c.save(); c.translate(W * .56, H * .56); c.rotate(-.07); c.fillRect(-W * .32, -H * .16, W * .64, H * .34); c.restore();

    const photos = imageAssets.slice(0, 3);
    if (photos.length) {
      const placements = [
        [W * .48, H * .26, W * .42, H * .34, -.08],
        [W * .08, H * .52, W * .36, H * .29, .075],
        [W * .58, H * .59, W * .31, H * .25, -.045]
      ];
      photos.forEach((asset, index) => {
        const [x, y, w, h, rot] = placements[index];
        c.save(); c.shadowColor = "rgba(0,0,0,.2)"; c.shadowBlur = 12 * s; c.shadowOffsetY = 8 * s;
        c.translate(x + w / 2, y + h / 2); c.rotate(rot);
        c.fillStyle = "#f8f3e8"; c.fillRect(-w / 2 - 10 * s, -h / 2 - 10 * s, w + 20 * s, h + 38 * s);
        coverImage(c, asset.img, -w / 2, -h / 2, w, h);
        c.restore();
      });
    } else {
      c.save(); c.translate(W * .57, H * .47); c.rotate(-.1);
      c.fillStyle = "#191817"; c.fillRect(-W * .22, -H * .14, W * .44, H * .29);
      c.globalCompositeOperation = "screen";
      c.fillStyle = data.accent;
      c.beginPath(); c.arc(0, 0, W * .17, 0, Math.PI * 2); c.fill();
      c.restore();
    }

    for (let i = 0; i < 3; i++) {
      c.save(); c.translate((.16 + rng() * .68) * W, (.18 + rng() * .65) * H); c.rotate((rng() - .5) * 1.2);
      c.fillStyle = "rgba(241,233,201,.76)"; c.fillRect(-38 * s, -7 * s, 76 * s, 14 * s); c.restore();
    }

    c.fillStyle = ink;
    c.font = `900 ${15 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 54 * s, 2.1 * s);
    c.fillRect(margin, 66 * s, W - margin * 2, 4 * s);

    const titleWidth = W * .82;
    const titleSize = fitFont(c, data.title, titleWidth, 128 * s, 62 * s, 'Arial, "Microsoft YaHei", sans-serif', 900);
    c.save(); c.translate(margin, H * .22); c.rotate(-.025);
    c.font = `900 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    c.lineWidth = 9 * s; c.strokeStyle = "#fff4df"; c.fillStyle = ink;
    const lines = wrapLines(c, data.title, titleWidth, 3);
    lines.forEach((line, i) => { c.strokeText(line, 0, i * titleSize * .86); c.fillText(line, 0, i * titleSize * .86); });
    c.restore();

    c.save(); c.translate(W - 24 * s, H * .22); c.rotate(Math.PI / 2);
    c.fillStyle = ink; c.font = `900 ${18 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), 0, 0, 1.5 * s); c.restore();

    const infoY = H - 175 * s;
    c.fillStyle = "#fff8e9";
    c.save(); c.translate(W * .38, infoY); c.rotate(.018); c.fillRect(-W * .35, -52 * s, W * .7, 129 * s); c.restore();
    c.fillStyle = ink;
    c.font = `900 ${42 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.date.toUpperCase(), margin, infoY, -1.3 * s);
    c.font = `700 ${13 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const details = wrapLines(c, `${data.time}  ·  ${data.venue}`, W * .58, 2);
    drawLines(c, details, margin, infoY + 31 * s, 19 * s, { spacing: .2 * s });

    if (Number(data.density) === 2) {
      c.fillStyle = ink; c.font = `600 ${11 * s}px Arial, "Microsoft YaHei", sans-serif`;
      const body = wrapLines(c, data.body, W * .32, 5);
      drawLines(c, body, W - margin, infoY - 4 * s, 17 * s, { align: "right", spacing: .1 * s });
    }
    c.fillStyle = ink; c.font = `900 ${11 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.organizer.toUpperCase(), margin, H - 28 * s, 1.6 * s);
  }

  function drawQuiet(c, data, W, H, s, seed) {
    const ink = "#25241f";
    const accent = data.accent;
    const margin = 52 * s;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);
    c.strokeStyle = alpha(ink, .72); c.lineWidth = 1 * s;
    c.beginPath(); c.moveTo(margin, 61 * s); c.lineTo(W - margin, 61 * s); c.stroke();

    c.fillStyle = ink;
    c.font = `600 ${10 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 46 * s, 3.3 * s);
    drawSpacedText(c, String(data.seed).slice(-3).padStart(3, "0"), W - margin, 46 * s, 2 * s, "right");

    const portrait = H > W * 1.16;
    const artX = portrait ? W * .18 : W * .46;
    const artY = portrait ? H * .26 : H * .18;
    const artW = portrait ? W * .48 : W * .38;
    const artH = portrait ? H * .36 : H * .62;
    if (imageAssets.length) {
      drawImageFrame(c, imageAssets[0].img, artX, artY, artW, artH, { overlay: alpha(accent, .045) });
    } else {
      c.save(); c.translate(artX + artW / 2, artY + artH / 2); c.rotate(-.03);
      const grad = c.createLinearGradient(-artW / 2, -artH / 2, artW / 2, artH / 2);
      grad.addColorStop(0, alpha(accent, .05)); grad.addColorStop(.46, alpha(accent, .9)); grad.addColorStop(1, "#1c2a25");
      c.fillStyle = grad;
      c.beginPath(); c.moveTo(-artW * .5, -artH * .38); c.bezierCurveTo(-artW * .14, -artH * .59, artW * .5, -artH * .34, artW * .42, artH * .16); c.bezierCurveTo(artW * .36, artH * .51, -artW * .24, artH * .56, -artW * .49, artH * .26); c.closePath(); c.fill();
      c.restore();
    }

    c.strokeStyle = ink; c.lineWidth = 1 * s;
    drawCropMarks(c, artX, artY, artW, artH, ink, s);

    const chars = Array.from(data.title.replace(/\s/g, ""));
    const size = clamp((portrait ? 85 : 68) * s, 48 * s, 92 * s);
    c.fillStyle = ink; c.font = `400 ${size}px "Songti SC", "SimSun", Georgia, serif`;
    if (portrait && chars.length <= 9) {
      const x = W * .77;
      const y = artY + 28 * s;
      chars.slice(0, 9).forEach((char, index) => c.fillText(char, x, y + index * size * .98));
    } else {
      const titleWidth = portrait ? W * .72 : W * .38;
      const lines = wrapLines(c, data.title, titleWidth, 3);
      drawLines(c, lines, portrait ? margin : margin, portrait ? H * .16 : H * .32, size * 1.05, { spacing: 3 * s });
    }

    c.fillStyle = accent;
    c.beginPath(); c.arc(W - margin - 24 * s, H * .65, 24 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = contrastColor(accent);
    c.font = `700 ${9 * s}px Arial, sans-serif`;
    drawSpacedText(c, "ICI", W - margin - 24 * s, H * .65 + 3 * s, .5 * s, "center");

    const bottomY = H - 134 * s;
    c.strokeStyle = alpha(ink, .72); c.beginPath(); c.moveTo(margin, bottomY - 30 * s); c.lineTo(W - margin, bottomY - 30 * s); c.stroke();
    c.fillStyle = ink;
    c.font = `400 ${35 * s}px Georgia, serif`;
    drawSpacedText(c, data.date.toUpperCase(), margin, bottomY, -.6 * s);
    c.font = `600 ${12 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.time.toUpperCase(), margin, bottomY + 28 * s, 1.2 * s);
    const venue = wrapLines(c, data.venue, W * .36, 2);
    drawLines(c, venue, W - margin, bottomY, 20 * s, { align: "right", spacing: .2 * s });

    if (Number(data.density) > 0) {
      c.font = `400 ${12 * s}px Arial, "Microsoft YaHei", sans-serif`;
      const body = wrapLines(c, data.body, W * .44, Number(data.density) === 2 ? 5 : 3);
      drawLines(c, body, W - margin, bottomY + 54 * s, 19 * s, { align: "right", spacing: .4 * s });
    }

    c.font = `600 ${9 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), margin, H - 31 * s, 2.1 * s);
    drawSpacedText(c, data.organizer.toUpperCase(), W - margin, H - 31 * s, 1.2 * s, "right");
  }

  function drawReferenceFrame(c, image, x, y, w, h, accent, s, shape = "rect", label = "IMAGE / MATERIAL") {
    c.save();
    if (shape === "circle") {
      c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); c.clip();
    } else {
      c.beginPath(); c.rect(x, y, w, h); c.clip();
    }
    if (image) coverImage(c, image, x, y, w, h);
    else { c.fillStyle = alpha(accent, .42); c.fillRect(x, y, w, h); }
    if (image) { c.fillStyle = alpha(accent, .13); c.fillRect(x, y, w, h); }
    c.restore();

    c.save();
    c.strokeStyle = accent; c.lineWidth = 2.2 * s;
    if (shape === "circle") { c.beginPath(); c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); c.stroke(); }
    else c.strokeRect(x, y, w, h);
    if (!image) {
      c.setLineDash([5 * s, 5 * s]); c.globalAlpha = .45; c.lineWidth = 1 * s;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + h); c.moveTo(x + w, y); c.lineTo(x, y + h); c.stroke();
    }
    c.setLineDash([]); c.globalAlpha = 1; c.fillStyle = accent;
    c.font = `700 ${7.5 * s}px Arial, sans-serif`;
    drawSpacedText(c, label, x + w / 2, y + h - 11 * s, 1.3 * s, "center");
    c.restore();
  }

  function drawLayoutLab(c, data, W, H, s, seed) {
    const ink = "#171615";
    const accent = data.accent;
    const margin = 32 * s;
    const variant = seed % 8;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);
    c.fillStyle = ink; c.font = `700 ${8 * s}px Arial, sans-serif`;
    drawSpacedText(c, "LAYOUT DESIGN", W * .5, 23 * s, 1.8 * s, "center");
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 23 * s, 1.1 * s);
    drawSpacedText(c, "DESIGN TUTORIAL", W - margin, 23 * s, 1.1 * s, "right");
    c.strokeStyle = alpha(ink, .25); c.lineWidth = 1 * s;
    c.beginPath(); c.moveTo(margin, 32 * s); c.lineTo(W - margin, 32 * s); c.stroke();

    const image = (index) => imageAssets[index % Math.max(1, imageAssets.length)]?.img || null;
    let titleX = margin;
    let titleY = 115 * s;
    let titleW = W * .72;
    let align = "left";
    let frames = [];

    if (variant === 0) {
      frames = [[W * .3, H * .13, W * .39, H * .64, "rect"]];
      titleX = margin; titleY = 112 * s; titleW = W * .25;
    } else if (variant === 1) {
      frames = [[W * .08, H * .53, W * .43, H * .27, "rect"], [W * .53, H * .10, W * .39, H * .46, "rect"]];
      titleX = margin; titleY = 138 * s; titleW = W * .37;
    } else if (variant === 2) {
      frames = [[W * .07, H * .08, W * .86, H * .43, "rect"]];
      titleX = margin; titleY = H * .63; titleW = W * .58;
    } else if (variant === 3) {
      frames = [[-W * .07, H * .15, W * .35, W * .35, "circle"], [W * .29, H * .27, W * .29, W * .29, "circle"], [W * .68, H * .12, W * .35, W * .35, "circle"], [W * .05, H * .62, W * .3, W * .3, "circle"], [W * .62, H * .63, W * .32, W * .32, "circle"]];
      titleX = W * .51; titleY = H * .36; titleW = W * .42; align = "center";
    } else if (variant === 4) {
      frames = [[W * .08, H * .31, W * .84, H * .42, "rect"]];
      titleX = W * .5; titleY = 115 * s; titleW = W * .82; align = "center";
    } else if (variant === 5) {
      frames = [[W * .43, H * .12, W * .48, H * .65, "rect"]];
      titleX = margin; titleY = 130 * s; titleW = W * .32;
    } else if (variant === 6) {
      frames = [[W * .17, H * .25, W * .66, W * .66, "circle"]];
      titleX = W * .5; titleY = 105 * s; titleW = W * .82; align = "center";
    } else {
      frames = [[W * .11, H * .13, W * .27, H * .31, "rect"], [W * .47, H * .27, W * .44, H * .22, "rect"], [W * .17, H * .58, W * .68, H * .22, "rect"]];
      titleX = margin; titleY = 118 * s; titleW = W * .42;
    }

    frames.forEach((frame, index) => drawReferenceFrame(c, image(index), frame[0], frame[1], frame[2], frame[3], accent, s, frame[4], `MATERIAL ${String(index + 1).padStart(2, "0")}`));

    c.fillStyle = ink;
    const maxTitle = variant === 4 || variant === 6 ? 96 * s : 112 * s;
    const titleSize = fitFont(c, data.title, titleW, maxTitle, 48 * s, 'Arial, "Microsoft YaHei", sans-serif', 900);
    c.font = `900 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    const titleLines = wrapLines(c, data.title, titleW, 4);
    drawLines(c, titleLines, titleX, titleY, titleSize * .91, { align, spacing: -3 * s });

    if (variant === 1 || variant === 7) {
      c.strokeStyle = ink; c.lineWidth = 2.5 * s;
      c.beginPath(); c.moveTo(W * .33, H * .43); c.lineTo(W * .72, H * .64); c.stroke();
    }

    const footerY = H - 92 * s;
    c.fillStyle = ink; c.font = `700 ${13 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), margin, footerY, 1.2 * s);
    c.font = `500 ${10 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const bodyLines = wrapLines(c, data.body, W * .62, Number(data.density) === 0 ? 2 : 4);
    drawLines(c, bodyLines, margin, footerY + 24 * s, 15 * s, { spacing: .2 * s });
    c.font = `800 ${11 * s}px Arial, sans-serif`;
    drawSpacedText(c, `${data.date}  /  ${data.time}`.toUpperCase(), W - margin, footerY, .5 * s, "right");
    c.font = `600 ${9 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.venue, W - margin, footerY + 22 * s, .2 * s, "right");
  }

  function drawArtBlue(c, data, W, H, s, seed) {
    const accent = data.accent;
    const margin = 36 * s;
    const variant = seed % 4;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);

    if (imageAssets.length) {
      const imageY = variant === 2 ? H * .24 : H * .43;
      const imageH = variant === 2 ? H * .59 : H * .38;
      drawImageFrame(c, imageAssets[0].img, variant === 2 ? 0 : W * .14, imageY, variant === 2 ? W : W * .72, imageH, { overlay: alpha(accent, variant === 2 ? .38 : .17) });
    } else if (variant === 2) {
      const grad = c.createLinearGradient(0, H * .31, 0, H * .82);
      grad.addColorStop(0, alpha(accent, 0)); grad.addColorStop(.55, alpha(accent, .18)); grad.addColorStop(1, alpha(accent, .8));
      c.fillStyle = grad; c.fillRect(0, H * .26, W, H * .58);
      c.fillStyle = "rgba(255,255,255,.48)";
      c.beginPath(); c.moveTo(W * .35, H * .62); c.quadraticCurveTo(W * .54, H * .38, W * .67, H * .69); c.quadraticCurveTo(W * .49, H * .76, W * .35, H * .62); c.fill();
    }

    c.fillStyle = accent;
    c.font = `800 ${12 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 28 * s, 2 * s);

    const titleW = variant === 1 ? W * .72 : W * .61;
    const titleSize = fitFont(c, data.title, titleW, 104 * s, 52 * s, 'Arial, "Microsoft YaHei", sans-serif', 800);
    c.font = `800 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    const titleLines = wrapLines(c, data.title, titleW, 4);
    const titleY = variant === 1 ? H * .11 : H * .13;
    drawLines(c, titleLines, margin, titleY, titleSize * .9, { spacing: -3 * s });

    c.font = `700 ${25 * s}px Arial, sans-serif`;
    const subtitle = wrapLines(c, data.subtitle.toUpperCase(), W * .52, 4);
    drawLines(c, subtitle, margin, titleY + titleLines.length * titleSize * .92 + 30 * s, 28 * s, { spacing: .3 * s });

    c.font = `800 ${36 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.date.toUpperCase(), W - margin, 70 * s, -1 * s, "right");
    c.font = `700 ${12 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const side = wrapLines(c, data.venue, W * .26, 3);
    drawLines(c, side, W - margin, 101 * s, 18 * s, { align: "right", spacing: .2 * s });

    const bandH = variant === 3 ? 184 * s : 136 * s;
    const bandY = H - bandH;
    c.fillStyle = variant === 3 ? "#92e000" : (variant === 0 ? "#8cdd09" : data.background);
    c.fillRect(0, bandY, W, bandH);
    c.strokeStyle = accent; c.lineWidth = 2 * s;
    c.beginPath(); c.moveTo(0, bandY); c.lineTo(W, bandY); c.stroke();
    c.fillStyle = accent;
    c.font = `800 ${33 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, data.time.toUpperCase(), margin, bandY + 49 * s, -1 * s);
    c.font = `700 ${13 * s}px Arial, sans-serif`;
    drawSpacedText(c, "OPENING / PUBLIC PROGRAMME", margin, bandY + 80 * s, 1.4 * s);
    c.font = `500 ${10 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const bodyLines = wrapLines(c, data.body, W * .46, Number(data.density) === 0 ? 2 : 4);
    drawLines(c, bodyLines, W - margin, bandY + 44 * s, 16 * s, { align: "right", spacing: .2 * s });
    c.font = `800 ${10 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.organizer.toUpperCase(), W - margin, H - 19 * s, 1.3 * s, "right");
  }

  function drawCompositionAtlas(c, data, W, H, s, seed) {
    const ink = "#171713";
    const accent = data.accent;
    const margin = 42 * s;
    const variant = seed % 6;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);

    const blob = new Path2D();
    if (variant === 0 || variant === 4) {
      blob.ellipse(W * .5, H * .45, W * .31, H * .24, -.08, 0, Math.PI * 2);
    } else if (variant === 1) {
      blob.moveTo(W * .22, H * .67); blob.bezierCurveTo(W * .28, H * .25, W * .54, H * .04, W * .75, H * .13); blob.bezierCurveTo(W * .7, H * .51, W * .48, H * .78, W * .22, H * .67); blob.closePath();
    } else if (variant === 2) {
      blob.moveTo(-W * .05, H * .44); blob.bezierCurveTo(W * .14, H * .35, W * .17, H * .73, W * .31, H); blob.lineTo(-W * .05, H); blob.closePath();
      blob.moveTo(W * .71, H); blob.bezierCurveTo(W * .76, H * .75, W * .81, H * .46, W * 1.04, H * .52); blob.lineTo(W * 1.04, H); blob.closePath();
    } else if (variant === 3) {
      blob.ellipse(W * .52, H * .49, W * .12, H * .47, .3, 0, Math.PI * 2);
    } else {
      blob.moveTo(W * .13, H * .12); blob.bezierCurveTo(W * .46, H * .04, W * .86, H * .17, W * .85, H * .62); blob.bezierCurveTo(W * .74, H * .87, W * .31, H * .84, W * .13, H * .63); blob.closePath();
    }

    c.save(); c.clip(blob);
    if (imageAssets.length) {
      coverImage(c, imageAssets[0].img, 0, 0, W, H);
      c.fillStyle = alpha(data.background, .72); c.fillRect(0, 0, W, H);
    } else { c.fillStyle = alpha(accent, .22); c.fillRect(0, 0, W, H); }
    c.restore();

    if (variant === 2) {
      c.strokeStyle = alpha(accent, .7); c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(W * .5, 0); c.bezierCurveTo(W * .35, H * .22, W * .67, H * .41, W * .48, H * .6); c.bezierCurveTo(W * .34, H * .77, W * .55, H * .85, W * .45, H); c.stroke();
    }

    c.fillStyle = ink;
    c.font = `500 ${13 * s}px Georgia, serif`;
    drawSpacedText(c, "∞  /  COMPOSITION ATLAS", margin, 31 * s, 1.4 * s);
    c.font = `500 ${12 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), W - margin, 31 * s, 1.2 * s, "right");

    const titleW = variant === 1 ? W * .44 : W * .74;
    const titleX = variant === 1 ? W - margin : (variant === 3 ? margin : W * .5);
    const titleAlign = variant === 1 ? "right" : (variant === 3 ? "left" : "center");
    const titleY = variant === 1 ? H * .53 : (variant === 3 ? H * .14 : H * .16);
    const titleSize = fitFont(c, data.title, titleW, 88 * s, 46 * s, '"Songti SC", "SimSun", Georgia, serif', 500);
    c.font = `500 ${titleSize}px "Songti SC", "SimSun", Georgia, serif`;
    const titleLines = wrapLines(c, data.title, titleW, 4);
    drawLines(c, titleLines, titleX, titleY, titleSize * 1.08, { align: titleAlign, spacing: 2.5 * s });

    c.font = `400 ${28 * s}px Georgia, serif`;
    const subtitleLines = wrapLines(c, data.subtitle.toUpperCase(), W * .46, 4);
    drawLines(c, subtitleLines, variant === 3 ? W - margin : margin, H * .68, 31 * s, { align: variant === 3 ? "right" : "left", spacing: .4 * s });

    c.font = `500 ${10 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const bodyLines = wrapLines(c, data.body, W * .46, Number(data.density) === 0 ? 2 : 5);
    drawLines(c, bodyLines, W - margin, H * .67, 16 * s, { align: "right", spacing: .2 * s });

    const footerY = H - 48 * s;
    c.strokeStyle = ink; c.lineWidth = 1.5 * s; c.beginPath(); c.moveTo(margin, footerY - 24 * s); c.lineTo(W - margin, footerY - 24 * s); c.stroke();
    c.fillStyle = ink; c.font = `500 ${25 * s}px Georgia, serif`;
    drawSpacedText(c, data.date.toUpperCase(), margin, footerY, -.5 * s);
    c.font = `700 ${10 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, `${data.time}  /  ${data.venue}`, W - margin, footerY, .5 * s, "right");
    c.font = `500 ${16 * s}px Georgia, serif`;
    drawSpacedText(c, "∞", W * .5, footerY, 0, "center");
  }

  function motifCellOn(row, col, rows, cols, preset, rng) {
    const x = col / Math.max(1, cols - 1) * 2 - 1;
    const y = row / Math.max(1, rows - 1) * 2 - 1;
    if (preset === "x") return Math.abs(x - y) < .18 || Math.abs(x + y) < .18;
    if (preset === "arrow") return (y < -.05 && Math.abs(x) < .16) || (y < -.12 && Math.abs(x) < -y * .68 + .08);
    if (preset === "heart") {
      const hx = x * 1.4;
      const hy = -(y + .08) * 1.35;
      const a = hx * hx + hy * hy - 1;
      return a * a * a - hx * hx * hy * hy * hy <= .08;
    }
    if (preset === "scatter") return rng() > .66;
    const leftX = (col + .5) / cols;
    const topY = (row + .5) / rows;
    const zero = leftX < .48 && (((leftX - .25) / .2) ** 2 + ((topY - .5) / .39) ** 2 > .52) && (((leftX - .25) / .2) ** 2 + ((topY - .5) / .39) ** 2 < 1.28);
    const one = leftX > .61 && leftX < .77 || (topY > .83 && leftX > .56 && leftX < .88) || (topY < .19 && leftX > .57 && leftX < .72);
    return zero || one;
  }

  function drawWorkshop(c, data, W, H, s, seed) {
    const ink = "#191816";
    const accent = data.accent;
    const margin = 30 * s;
    const rng = mulberry32(seed);
    const courses = Array.isArray(data.workshopCourses) && data.workshopCourses.length ? data.workshopCourses.slice(0, 8) : DEFAULT_COURSES;
    c.fillStyle = data.background; c.fillRect(0, 0, W, H);

    c.fillStyle = ink;
    const titleSize = fitFont(c, data.title, W * .66, 88 * s, 48 * s, 'Arial, "Microsoft YaHei", sans-serif', 900);
    c.font = `900 ${titleSize}px Arial, "Microsoft YaHei", sans-serif`;
    const titleLines = wrapLines(c, data.title, W * .66, 2);
    drawLines(c, titleLines, margin, 78 * s, titleSize * .9, { spacing: -2.6 * s });
    c.font = `700 ${18 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.subtitle.toUpperCase(), margin, 105 * s + titleLines.length * titleSize * .83, 1.1 * s);

    c.font = `700 ${11 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.kicker.toUpperCase(), margin, 25 * s, 1.7 * s);
    c.font = `900 ${34 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.date.toUpperCase(), W - margin, 59 * s, -1.2 * s, "right");
    c.font = `700 ${11 * s}px Arial, "Microsoft YaHei", sans-serif`;
    drawSpacedText(c, `${data.time} / ${data.venue}`, W - margin, 84 * s, .3 * s, "right");

    c.font = `${54 * s}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    c.fillText(data.motifEmoji || "👀", W - margin - 54 * s, 145 * s);

    const courseTop = 190 * s;
    const cols = W < 700 * s ? 1 : 2;
    const gap = 10 * s;
    const cardW = (W - margin * 2 - gap * (cols - 1)) / cols;
    const rows = Math.ceil(courses.length / cols);
    const availableCourseH = Math.min(H * .34, rows * 99 * s);
    const cardH = Math.max(72 * s, (availableCourseH - gap * (rows - 1)) / rows);

    courses.forEach((course, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      const x = margin + col * (cardW + gap);
      const y = courseTop + row * (cardH + gap);
      c.fillStyle = index % 3 === 0 ? accent : (index % 3 === 1 ? alpha(accent, .18) : "#ffffff");
      roundedRectPath(c, x, y, cardW, cardH, 5 * s); c.fill();
      c.strokeStyle = ink; c.lineWidth = 1.4 * s; roundedRectPath(c, x, y, cardW, cardH, 5 * s); c.stroke();
      c.fillStyle = index % 3 === 0 && luminance(accent) < .6 ? "#fff" : ink;
      c.font = `900 ${22 * s}px Arial, "Microsoft YaHei", sans-serif`;
      drawSpacedText(c, course.title || "新课程", x + 12 * s, y + 29 * s, -.6 * s);
      c.font = `700 ${9 * s}px Arial, "Microsoft YaHei", sans-serif`;
      drawSpacedText(c, (course.meta || "时间 · 地点").toUpperCase(), x + cardW - 10 * s, y + 20 * s, .3 * s, "right");
      c.font = `600 ${8.5 * s}px Arial, "Microsoft YaHei", sans-serif`;
      const desc = wrapLines(c, course.desc || "WORKSHOP", cardW - 24 * s, 2);
      drawLines(c, desc, x + 12 * s, y + cardH - 20 * s, 12 * s, { spacing: .2 * s });
    });

    const courseBottom = courseTop + rows * (cardH + gap) - gap;
    const mosaicTop = Math.min(H - 380 * s, courseBottom + 28 * s);
    const qrSize = 78 * s;
    if (qrAsset?.img) drawImageFrame(c, qrAsset.img, W - margin - qrSize, mosaicTop - qrSize - 12 * s, qrSize, qrSize, { border: { color: ink, width: 2 * s } });
    else drawPseudoQR(c, W - margin - qrSize, mosaicTop - qrSize - 12 * s, qrSize, ink, seed);

    c.fillStyle = ink; c.font = `800 ${12 * s}px Arial, "Microsoft YaHei", sans-serif`;
    const body = wrapLines(c, data.body, W * .53, Number(data.density) === 0 ? 2 : 4);
    drawLines(c, body, margin, mosaicTop - 58 * s, 17 * s, { spacing: .2 * s });

    c.strokeStyle = ink; c.lineWidth = 2 * s;
    c.beginPath(); c.moveTo(margin, mosaicTop); c.lineTo(W - margin, mosaicTop); c.stroke();
    const gridCols = 12;
    const gridRows = Math.max(5, Math.floor((H - mosaicTop - 58 * s) / ((W - margin * 2) / gridCols)));
    const cell = (W - margin * 2) / gridCols;
    c.font = `${cell * .72}px "Segoe UI Emoji", "Apple Color Emoji", sans-serif`;
    c.textAlign = "center"; c.textBaseline = "middle";
    for (let row = 0; row < gridRows; row++) {
      for (let col = 0; col < gridCols; col++) {
        if (!motifCellOn(row, col, gridRows, gridCols, data.motifPreset, rng)) continue;
        c.fillText(data.motifEmoji || "👀", margin + (col + .5) * cell, mosaicTop + (row + .5) * cell);
      }
    }
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.fillStyle = ink; c.font = `800 ${9 * s}px Arial, sans-serif`;
    drawSpacedText(c, data.organizer.toUpperCase(), margin, H - 20 * s, 1.2 * s);
    drawSpacedText(c, `PATTERN / ${(data.motifPreset || "01").toUpperCase()}`, W - margin, H - 20 * s, 1.2 * s, "right");
  }

  function toggleWorkshopSection() {
    const isTeacherTemplate = state.style === "teacher-workshop";
    const isWorkshopTemplate = state.style === "workshop";
    $("#workshop-section").hidden = !isTeacherTemplate && !isWorkshopTemplate;
    $("#workshop-heading").textContent = isTeacherTemplate ? "老师工坊课程表" : "工坊拼豆主视觉";
    $("#add-course-btn").hidden = !isTeacherTemplate;
    $("#course-list").hidden = !isTeacherTemplate;
    $("#workshop-pattern-row").hidden = !isWorkshopTemplate;
    $("#workshop-qr-upload").hidden = !isWorkshopTemplate;
  }

  function renderWorkshopCourses() {
    if (!Array.isArray(state.workshopCourses) || !state.workshopCourses.length) {
      state.workshopCourses = DEFAULT_COURSES.map((course) => ({ ...course }));
    }
    const container = $("#course-list");
    if (!container) return;
    container.innerHTML = "";
    state.workshopCourses.forEach((course, index) => {
      const item = document.createElement("div");
      item.className = "course-item";
      item.innerHTML = `
        <span class="course-index">${String(index + 1).padStart(2, "0")}</span>
        <span class="course-fields">
          <input data-course-field="title" value="${escapeHtml(course.title || "")}" maxlength="18" aria-label="课程 ${index + 1} 名称" placeholder="课程名称">
          <input data-course-field="meta" value="${escapeHtml(course.meta || "")}" maxlength="32" aria-label="课程 ${index + 1} 时间地点" placeholder="时间 · 地点">
          <input class="course-desc" data-course-field="desc" value="${escapeHtml(course.desc || "")}" maxlength="56" aria-label="课程 ${index + 1} 简介" placeholder="英文名 / 课程简介">
        </span>
        <button class="remove-course-btn" type="button" aria-label="删除课程 ${index + 1}">×</button>`;
      $$('[data-course-field]', item).forEach((input) => {
        input.addEventListener("input", () => {
          state.workshopCourses[index][input.dataset.courseField] = input.value;
          scheduleRender();
        });
      });
      $(".remove-course-btn", item).addEventListener("click", () => {
        if (state.workshopCourses.length <= 1) { showToast("至少保留一门课程"); return; }
        state.workshopCourses.splice(index, 1);
        renderWorkshopCourses(); scheduleRender();
      });
      container.appendChild(item);
    });
  }

  function syncQRPreview() {
    const preview = $("#qr-preview");
    if (!preview) return;
    preview.innerHTML = qrAsset ? `<img src="${qrAsset.dataUrl}" alt="二维码预览">` : "QR";
  }

  function renderMaterials() {
    if (!Array.isArray(state.decorations)) state.decorations = [];
    $$(".material-card").forEach((card) => {
      const active = state.decorations.includes(card.dataset.material);
      card.classList.toggle("active", active);
      card.classList.toggle("editing", activeElement?.kind === "material" && activeElement.id === card.dataset.material);
      card.setAttribute("aria-pressed", String(active));
    });
    renderBlockControls();
    updateMaterialScaleLabel();
    updateElementEditor();
    updateTypographyEditor();
  }

  function renderBlockControls() {
    if (!Array.isArray(state.hiddenBlocks)) state.hiddenBlocks = [];
    $$('[data-block]').forEach((button) => {
      const id = button.dataset.block;
      const visibleForStyle = id !== "courses" || state.style === "teacher-workshop";
      if (button.hasAttribute("data-workshop-part")) button.hidden = !visibleForStyle;
      const hidden = state.hiddenBlocks.includes(id);
      button.classList.toggle("active", !hidden && visibleForStyle);
      button.classList.toggle("is-hidden", hidden);
      button.classList.toggle("editing", activeElement?.kind === "block" && activeElement.id === id);
      button.setAttribute("aria-pressed", String(!hidden));
    });
  }

  function selectBlock(id) {
    if (state.hiddenBlocks.includes(id)) state.hiddenBlocks = state.hiddenBlocks.filter((item) => item !== id);
    activeElement = { kind: "block", id };
    renderMaterials();
    scheduleRender();
    showToast(`已选中“${BLOCK_LABELS[id]}”，可在海报上直接拖动`);
  }

  function updateTypographyEditor() {
    const editor = $("#typography-editor");
    if (!editor) return;
    const editable = activeElement?.kind === "block" && TEXT_BLOCK_IDS.includes(activeElement.id) && !state.hiddenBlocks.includes(activeElement.id);
    editor.hidden = !editable;
    if (!editable) return;
    const id = activeElement.id;
    const textStyle = state.textStyles?.[id] || {};
    $("#typography-target").textContent = `正在编辑：${BLOCK_LABELS[id]}`;
    $("#font-family-select").value = FONT_FAMILIES[textStyle.font] ? textStyle.font : "auto";
    const size = clamp(Number(textStyle.size) || 100, 50, 220);
    $("#font-size-range").value = String(size);
    $("#font-size-value").textContent = `${size}%`;
  }

  function updateActiveTextStyle(key, value) {
    if (activeElement?.kind !== "block" || !TEXT_BLOCK_IDS.includes(activeElement.id)) return;
    const id = activeElement.id;
    const styles = { ...(state.textStyles || {}) };
    const current = { ...(styles[id] || {}) };
    if ((key === "font" && value === "auto") || (key === "size" && Number(value) === 100)) delete current[key];
    else current[key] = key === "size" ? clamp(Number(value) || 100, 50, 220) : value;
    if (Object.keys(current).length) styles[id] = current;
    else delete styles[id];
    state.textStyles = styles;
    updateTypographyEditor();
    scheduleRender();
  }

  function resetActiveTypography() {
    if (activeElement?.kind !== "block" || !TEXT_BLOCK_IDS.includes(activeElement.id)) return;
    const styles = { ...(state.textStyles || {}) };
    delete styles[activeElement.id];
    state.textStyles = styles;
    updateTypographyEditor();
    scheduleRender();
    showToast(`“${BLOCK_LABELS[activeElement.id]}”已恢复模板字体与字号`);
  }

  function toggleMaterial(material) {
    const selected = new Set(Array.isArray(state.decorations) ? state.decorations : []);
    if (!selected.has(material)) {
      if (selected.size >= 8) { showToast("一张海报最多叠加 8 种拼贴素材"); return; }
      selected.add(material);
    }
    state.decorations = [...selected];
    activeElement = { kind: "material", id: material };
    renderMaterials();
    scheduleRender();
    showToast(`已选中“${MATERIAL_LABELS[material]}”，可在海报上直接拖动`);
  }

  function randomizeMaterials() {
    const choices = $$(".material-card").map((card) => card.dataset.material);
    const random = mulberry32(Date.now() ^ state.seed);
    const shuffled = [...choices].sort(() => random() - .5);
    const count = 3 + Math.floor(random() * 3);
    state.decorations = shuffled.slice(0, count);
    state.materialTransforms = {};
    activeElement = { kind: "material", id: state.decorations[0] };
    state.seed = Math.floor(Math.random() * 99999);
    renderMaterials();
    scheduleRender();
    showToast(`已组合 ${count} 种拼贴素材`);
  }

  function addEmojiSticker(emoji) {
    if (!Array.isArray(state.emojiStickers)) state.emojiStickers = [];
    if (state.emojiStickers.length >= 24) { showToast("一张海报最多添加 24 个 Emoji"); return; }
    const id = `emoji-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sticker = { id, emoji, scale: 1 };
    state.emojiStickers = [...state.emojiStickers, sticker];
    activeElement = { kind: "emoji", id };
    renderMaterials();
    scheduleRender();
    showToast(`已添加 ${emoji}，可在海报上直接拖动`);
  }

  function updateElementEditor() {
    const editor = $("#element-editor");
    const hint = $("#drag-hint");
    if (!editor || !hint) return;
    const exists = activeElement?.kind === "material"
      ? state.decorations.includes(activeElement.id)
      : activeElement?.kind === "emoji"
        ? state.emojiStickers.some((item) => item.id === activeElement.id)
        : activeElement?.kind === "block" && !state.hiddenBlocks.includes(activeElement.id);
    if (!exists) activeElement = null;
    editor.hidden = !activeElement;
    hint.hidden = !activeElement;
    canvas.classList.toggle("can-drag", Boolean(activeElement));
    if (!activeElement) return;
    const sticker = activeElement.kind === "emoji" ? state.emojiStickers.find((item) => item.id === activeElement.id) : null;
    const name = activeElement.kind === "material" ? MATERIAL_LABELS[activeElement.id]
      : activeElement.kind === "block" ? BLOCK_LABELS[activeElement.id]
        : `${sticker?.emoji || "Emoji"} Emoji`;
    $("#active-element-name").textContent = name;
    hint.textContent = `拖动${name}调整位置`;
  }

  function updateActiveElementScale(direction) {
    if (!activeElement) return;
    if (activeElement.kind === "material") {
      const current = state.materialTransforms?.[activeElement.id] || {};
      state.materialTransforms = {
        ...(state.materialTransforms || {}),
        [activeElement.id]: { ...current, scale: clamp((Number(current.scale) || 1) + direction * .12, .4, 2.5) }
      };
    } else if (activeElement.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.map((sticker) => sticker.id === activeElement.id
        ? { ...sticker, scale: clamp((Number(sticker.scale) || 1) + direction * .12, .4, 2.8) }
        : sticker);
    } else {
      const current = state.blockTransforms?.[activeElement.id] || {};
      state.blockTransforms = {
        ...(state.blockTransforms || {}),
        [activeElement.id]: { ...current, scale: clamp((Number(current.scale) || 1) + direction * .12, .38, 2.6) }
      };
    }
    scheduleRender();
  }

  function resetActiveElementPosition() {
    if (!activeElement) return;
    if (activeElement.kind === "material") {
      const transforms = { ...(state.materialTransforms || {}) };
      const current = { ...(transforms[activeElement.id] || {}) };
      delete current.x; delete current.y;
      if (Object.keys(current).length) transforms[activeElement.id] = current;
      else delete transforms[activeElement.id];
      state.materialTransforms = transforms;
    } else if (activeElement.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.map((sticker) => {
        if (sticker.id !== activeElement.id) return sticker;
        const reset = { ...sticker }; delete reset.x; delete reset.y; return reset;
      });
    } else {
      const transforms = { ...(state.blockTransforms || {}) };
      const current = { ...(transforms[activeElement.id] || {}) };
      delete current.x; delete current.y;
      if (Object.keys(current).length) transforms[activeElement.id] = current;
      else delete transforms[activeElement.id];
      state.blockTransforms = transforms;
    }
    scheduleRender();
    showToast("已恢复自动位置");
  }

  function removeActiveElement() {
    if (!activeElement) return;
    if (activeElement.kind === "material") {
      state.decorations = state.decorations.filter((material) => material !== activeElement.id);
      const transforms = { ...(state.materialTransforms || {}) }; delete transforms[activeElement.id]; state.materialTransforms = transforms;
    } else if (activeElement.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.filter((sticker) => sticker.id !== activeElement.id);
    } else {
      if (!state.hiddenBlocks.includes(activeElement.id)) state.hiddenBlocks = [...state.hiddenBlocks, activeElement.id];
    }
    activeElement = null;
    renderMaterials();
    scheduleRender();
    showToast("已移除当前元素");
  }

  function canvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * canvas.width / rect.width,
      y: (event.clientY - rect.top) * canvas.height / rect.height
    };
  }

  function setElementPosition(element, x, y) {
    const nx = clamp(x / canvas.width, .015, .985);
    const ny = clamp(y / canvas.height, .015, .985);
    if (element.kind === "material") {
      const current = state.materialTransforms?.[element.id] || {};
      state.materialTransforms = { ...(state.materialTransforms || {}), [element.id]: { ...current, x: nx, y: ny } };
    } else if (element.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.map((sticker) => sticker.id === element.id ? { ...sticker, x: nx, y: ny } : sticker);
    } else {
      const current = state.blockTransforms?.[element.id] || {};
      state.blockTransforms = { ...(state.blockTransforms || {}), [element.id]: { ...current, x: nx, y: ny } };
    }
  }

  function snapDraggedPosition(element, x, y, draggedHit) {
    const rect = canvas.getBoundingClientRect();
    const threshold = clamp(7 * canvas.width / Math.max(1, rect.width), 8, 40);
    const halfW = draggedHit?.w ? draggedHit.w / 2 : draggedHit?.radius || 0;
    const halfH = draggedHit?.h ? draggedHit.h / 2 : draggedHit?.radius || 0;
    const verticalTargets = [
      { value: canvas.width * .05, label: "安全边距" },
      { value: canvas.width * .25, label: "四分线" },
      { value: canvas.width * .50, label: "画布中心" },
      { value: canvas.width * .75, label: "四分线" },
      { value: canvas.width * .95, label: "安全边距" }
    ];
    const horizontalTargets = [
      { value: canvas.height * .05, label: "安全边距" },
      { value: canvas.height * .25, label: "四分线" },
      { value: canvas.height * .50, label: "画布中心" },
      { value: canvas.height * .75, label: "四分线" },
      { value: canvas.height * .95, label: "安全边距" }
    ];

    interactiveHitAreas.forEach((area) => {
      if (elementKey(area) === elementKey(element)) return;
      const otherHalfW = area.w ? area.w / 2 : area.radius || 0;
      const otherHalfH = area.h ? area.h / 2 : area.radius || 0;
      verticalTargets.push({ value: area.x, label: "元素中心" });
      horizontalTargets.push({ value: area.y, label: "元素中心" });
      if (otherHalfW) {
        verticalTargets.push({ value: area.x - otherHalfW, label: "边缘对齐" });
        verticalTargets.push({ value: area.x + otherHalfW, label: "边缘对齐" });
      }
      if (otherHalfH) {
        horizontalTargets.push({ value: area.y - otherHalfH, label: "边缘对齐" });
        horizontalTargets.push({ value: area.y + otherHalfH, label: "边缘对齐" });
      }
    });

    const findSnap = (position, halfSize, targets) => {
      const probes = [{ value: position, offset: 0 }];
      if (halfSize) probes.push({ value: position - halfSize, offset: -halfSize }, { value: position + halfSize, offset: halfSize });
      let best = null;
      probes.forEach((probe) => targets.forEach((target) => {
        const distance = Math.abs(probe.value - target.value);
        if (distance <= threshold && (!best || distance < best.distance)) best = { ...target, distance, position: target.value - probe.offset };
      }));
      return best;
    };

    const vertical = findSnap(x, halfW, verticalTargets);
    const horizontal = findSnap(y, halfH, horizontalTargets);
    return {
      x: vertical ? vertical.position : x,
      y: horizontal ? horizontal.position : y,
      vertical: vertical ? [vertical] : [],
      horizontal: horizontal ? [horizontal] : []
    };
  }

  function beginElementDrag(event) {
    const point = canvasPoint(event);
    const hit = [...interactiveHitAreas].reverse().find((area) => area.w && area.h
      ? Math.abs(point.x - area.x) <= area.w * .56 && Math.abs(point.y - area.y) <= area.h * .56
      : Math.hypot(point.x - area.x, point.y - area.y) <= area.radius * 1.08);
    if (!hit) return;
    event.preventDefault();
    activeElement = { kind: hit.kind, id: hit.id };
    draggingElement = {
      pointerId: event.pointerId,
      element: { ...activeElement },
      hit: { ...hit },
      offsetX: point.x - hit.x,
      offsetY: point.y - hit.y
    };
    activeSmartGuides = { vertical: [], horizontal: [] };
    canvas.setPointerCapture?.(event.pointerId);
    canvas.classList.add("is-dragging");
    renderMaterials();
    renderPreview();
  }

  function moveElementDrag(event) {
    if (!draggingElement || draggingElement.pointerId !== event.pointerId) return;
    event.preventDefault();
    const point = canvasPoint(event);
    let x = point.x - draggingElement.offsetX;
    let y = point.y - draggingElement.offsetY;
    if (state.smartGuides) {
      const snapped = snapDraggedPosition(draggingElement.element, x, y, draggingElement.hit);
      x = snapped.x;
      y = snapped.y;
      activeSmartGuides = { vertical: snapped.vertical, horizontal: snapped.horizontal };
      draggingElement.snapLabel = [...snapped.vertical, ...snapped.horizontal].map((guide) => guide.label).filter((label, index, labels) => labels.indexOf(label) === index).join(" + ");
    } else {
      activeSmartGuides = { vertical: [], horizontal: [] };
      draggingElement.snapLabel = "";
    }
    setElementPosition(draggingElement.element, x, y);
    renderPreview();
  }

  function endElementDrag(event) {
    if (!draggingElement || draggingElement.pointerId !== event.pointerId) return;
    const snapLabel = draggingElement.snapLabel;
    canvas.releasePointerCapture?.(event.pointerId);
    draggingElement = null;
    activeSmartGuides = { vertical: [], horizontal: [] };
    canvas.classList.remove("is-dragging");
    renderPreview();
    saveState();
    if (snapLabel) showToast(`已吸附：${snapLabel}`);
  }

  function nudgeActiveElement(dx, dy) {
    if (!activeElement) return;
    const hit = interactiveHitAreas.find((area) => elementKey(area) === elementKey(activeElement));
    if (!hit) return;
    setElementPosition(activeElement, hit.x + dx * canvas.width, hit.y + dy * canvas.height);
    renderPreview();
    saveState();
  }

  function onFieldInput(event) {
    const el = event.currentTarget;
    const key = el.dataset.field;
    state[key] = el.type === "checkbox" ? el.checked : el.type === "range" ? Number(el.value) : el.value;
    if (key === "accent" || key === "background") updateColorLabels();
    if (key === "density") updateDensityLabel();
    if (key === "materialScale") updateMaterialScaleLabel();
    if (el.maxLength > 0) {
      const count = $(`[data-count-for="${el.id}"]`);
      if (count) count.textContent = Array.from(el.value).length;
    }
    if (key === "format") zoomMultiplier = 1;
    scheduleRender();
  }

  function captureWorkspace() {
    const snapshot = {
      format: state.format,
      showGrain: Boolean(state.showGrain),
      hiddenBlocks: [...(state.hiddenBlocks || [])],
      blockTransforms: JSON.parse(JSON.stringify(state.blockTransforms || {})),
      textStyles: JSON.parse(JSON.stringify(state.textStyles || {})),
      decorations: [...(state.decorations || [])],
      materialTransforms: JSON.parse(JSON.stringify(state.materialTransforms || {})),
      emojiStickers: JSON.parse(JSON.stringify(state.emojiStickers || [])),
      materialScale: Number(state.materialScale) || 100,
      workshopCourses: (state.workshopCourses || []).map((course) => ({ ...course }))
    };
    TEXT_BLOCK_IDS.forEach((key) => { snapshot[key] = state[key]; });
    return snapshot;
  }

  function createTeacherWorkspace() {
    return {
      ...TEACHER_WORKSHOP_DEFAULTS,
      format: "story",
      showGrain: false,
      hiddenBlocks: [],
      blockTransforms: {},
      textStyles: {},
      decorations: [],
      materialTransforms: {},
      emojiStickers: [],
      materialScale: 100,
      workshopCourses: TEACHER_WORKSHOP_COURSES.map((course) => ({ ...course }))
    };
  }

  function createNeonDoodleWorkspace() {
    return {
      ...NEON_DOODLE_DEFAULTS,
      format: "poster",
      showGrain: false,
      hiddenBlocks: ["visual", "date", "time", "venue", "qr"],
      blockTransforms: {},
      textStyles: {},
      decorations: ["neon-blob", "charcoal-flower", "charcoal-brush", "neon-loop", "contour-line"],
      materialTransforms: {
        "neon-blob": { x: .64, y: .43, scale: 1.45 },
        "charcoal-flower": { x: .77, y: .35, scale: 1.04 },
        "charcoal-brush": { x: .82, y: .72, scale: 1.42 },
        "neon-loop": { x: .57, y: .79, scale: 1.12 },
        "contour-line": { x: .72, y: .52, scale: .86 }
      },
      emojiStickers: [],
      materialScale: 100,
      workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course }))
    };
  }

  function applyWorkspace(snapshot) {
    if (!snapshot) return;
    TEXT_BLOCK_IDS.forEach((key) => {
      if (key in snapshot) state[key] = snapshot[key];
    });
    state.format = snapshot.format || state.format;
    state.showGrain = Boolean(snapshot.showGrain);
    state.hiddenBlocks = [...(snapshot.hiddenBlocks || [])];
    state.blockTransforms = JSON.parse(JSON.stringify(snapshot.blockTransforms || {}));
    state.textStyles = JSON.parse(JSON.stringify(snapshot.textStyles || {}));
    state.decorations = [...(snapshot.decorations || [])];
    state.materialTransforms = JSON.parse(JSON.stringify(snapshot.materialTransforms || {}));
    state.emojiStickers = JSON.parse(JSON.stringify(snapshot.emojiStickers || []));
    state.materialScale = Number(snapshot.materialScale) || 100;
    state.workshopCourses = (snapshot.workshopCourses || DEFAULT_COURSES).map((course) => ({ ...course }));
  }

  function syncWorkspaceFields() {
    $$('[data-field]').forEach((field) => {
      const key = field.dataset.field;
      if (!(key in state)) return;
      if (field.type === "checkbox") field.checked = Boolean(state[key]);
      else field.value = state[key];
    });
    updateAllCounts();
    renderWorkshopCourses();
    updateTypographyEditor();
  }

  function selectStyle(style, applyPalette = true) {
    const previousStyle = state.style;
    if (previousStyle === "teacher-workshop" && style !== "teacher-workshop") {
      state.teacherWorkshopDraft = captureWorkspace();
      const returnWorkspace = state.teacherWorkshopReturn;
      if (returnWorkspace) applyWorkspace(returnWorkspace);
      state.teacherWorkshopReturn = null;
    }
    if (previousStyle === "neon-doodle" && style !== "neon-doodle") {
      state.neonDoodleDraft = captureWorkspace();
      const returnWorkspace = state.neonDoodleReturn;
      if (returnWorkspace) applyWorkspace(returnWorkspace);
      state.neonDoodleReturn = null;
    }
    if (previousStyle !== "teacher-workshop" && style === "teacher-workshop") {
      state.teacherWorkshopReturn = captureWorkspace();
      applyWorkspace(state.teacherWorkshopDraft || createTeacherWorkspace());
      state.format = "story";
      zoomMultiplier = 1;
    }
    if (previousStyle !== "neon-doodle" && style === "neon-doodle") {
      state.neonDoodleReturn = captureWorkspace();
      applyWorkspace(state.neonDoodleDraft || createNeonDoodleWorkspace());
      state.format = "poster";
      zoomMultiplier = 1;
    }
    state.style = style;
    if (previousStyle !== style) syncWorkspaceFields();
    if (applyPalette) {
      state.accent = STYLE_DEFAULTS[style].accent;
      state.background = STYLE_DEFAULTS[style].background;
      $("#accent-color").value = state.accent;
      $("#background-color").value = state.background;
      updateColorLabels();
    }
    $$(".style-card").forEach((card) => {
      const selected = card.dataset.style === style;
      card.classList.toggle("selected", selected);
      card.setAttribute("aria-checked", String(selected));
    });
    toggleWorkshopSection();
    if (activeElement?.kind === "block" && activeElement.id === "courses" && style !== "teacher-workshop") activeElement = null;
    renderMaterials();
    state.seed = Math.floor(Math.random() * 99999);
    scheduleRender();
  }

  function randomizeLayout() {
    state.seed = Math.floor(Math.random() * 99999);
    scheduleRender();
    showToast("已根据相同内容生成一个新的版式变体");
  }

  function randomizeStyle() {
    const styles = Object.keys(STYLE_DEFAULTS).filter((style) => style !== state.style);
    selectStyle(styles[Math.floor(Math.random() * styles.length)]);
  }

  function fillDemo() {
    demoIndex = (demoIndex + 1) % DEMOS.length;
    Object.assign(state, DEMOS[demoIndex]);
    Object.keys(DEMOS[demoIndex]).forEach((key) => {
      const el = $(`[data-field="${key}"]`);
      if (el) el.value = state[key];
    });
    updateAllCounts();
    state.seed = Math.floor(Math.random() * 99999);
    scheduleRender();
  }

  function resetAll() {
    state = { ...defaultState, decorations: [], materialTransforms: {}, emojiStickers: [], blockTransforms: {}, textStyles: {}, hiddenBlocks: [], workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course })) };
    imageAssets = [];
    qrAsset = null;
    activeElement = null;
    interactiveHitAreas = [];
    draggingElement = null;
    activeSmartGuides = { vertical: [], horizontal: [] };
    draggingAssetIndex = null;
    draggingAssetPointer = null;
    zoomMultiplier = 1;
    localStorage.removeItem("form01-poster-state");
    syncUIFromState();
    renderAssets();
    syncQRPreview();
    renderPreview();
    showToast("已恢复初始示例");
  }

  function readImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const image = new Image();
        image.onload = () => resolve({
          id: `image-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          dataUrl: reader.result,
          img: image,
          originalDataUrl: reader.result,
          originalImg: image,
          placedOnCanvas: false,
          cutout: false,
          processing: false,
          progress: 0,
          status: ""
        });
        image.onerror = reject;
        image.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  async function handleFiles(files) {
    const allowed = [...files].filter((file) => /image\/(png|jpeg|webp)/.test(file.type));
    if (!allowed.length) { showToast("请选择 JPG、PNG 或 WEBP 图片"); return; }
    const remaining = Math.max(0, 4 - imageAssets.length);
    if (!remaining) { showToast("最多可以使用 4 张图片"); return; }
    try {
      const loaded = await Promise.all(allowed.slice(0, remaining).map(readImage));
      imageAssets.push(...loaded);
      renderAssets();
      scheduleRender();
      showToast(`已加入 ${loaded.length} 张图片`);
    } catch {
      showToast("有一张图片无法读取，请换一张试试");
    }
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  }

  function loadImageFromUrl(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = url;
    });
  }

  async function getBackgroundRemover() {
    if (!backgroundRemoverPromise) {
      backgroundRemoverPromise = import("https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.7.0/+esm")
        .then((module) => module.removeBackground || module.default)
        .then((removeBackground) => {
          if (typeof removeBackground !== "function") throw new Error("抠图模块没有正确加载");
          return removeBackground;
        })
        .catch((error) => {
          backgroundRemoverPromise = null;
          throw error;
        });
    }
    return backgroundRemoverPromise;
  }

  function describeCutoutProgress(key) {
    const label = String(key || "").toLowerCase();
    if (label.includes("fetch") || label.includes("download")) return "正在加载 AI 模型";
    if (label.includes("compute") || label.includes("inference")) return "正在识别主体";
    if (label.includes("encode")) return "正在生成透明 PNG";
    return "正在处理图片";
  }

  async function toggleCutout(index) {
    const asset = imageAssets[index];
    if (!asset || asset.processing) return;

    if (asset.cutout) {
      asset.dataUrl = asset.originalDataUrl;
      asset.img = asset.originalImg || await loadImageFromUrl(asset.originalDataUrl);
      asset.cutout = false;
      renderAssets();
      scheduleRender();
      showToast("已恢复原图");
      return;
    }

    asset.processing = true;
    asset.progress = 2;
    asset.status = "正在加载抠图引擎";
    renderAssets();
    showToast("首次使用会加载约 40 MB 的模型，之后浏览器会缓存");

    try {
      const removeBackground = await getBackgroundRemover();
      const source = await (await fetch(asset.originalDataUrl)).blob();
      let lastProgressUpdate = 0;
      const result = await removeBackground(source, {
        model: "isnet_quint8",
        device: "cpu",
        output: { format: "image/png", quality: 1, type: "foreground" },
        progress: (key, current, total) => {
          const now = performance.now();
          if (now - lastProgressUpdate < 140 && current !== total) return;
          lastProgressUpdate = now;
          const ratio = total > 0 ? current / total : .08;
          asset.progress = clamp(Math.round(ratio * 100), 3, 96);
          asset.status = describeCutoutProgress(key);
          renderAssets();
        }
      });
      const dataUrl = await blobToDataUrl(result);
      const image = await loadImageFromUrl(dataUrl);
      asset.dataUrl = dataUrl;
      asset.img = image;
      asset.cutout = true;
      asset.progress = 100;
      asset.status = "";
      showToast("主体已抠出，可以下载透明 PNG");
    } catch (error) {
      console.error("Background removal failed:", error);
      asset.status = "";
      showToast("抠图模型加载失败，请检查网络后重试");
    } finally {
      asset.processing = false;
      renderAssets();
      scheduleRender();
    }
  }

  async function downloadAsset(index) {
    const asset = imageAssets[index];
    if (!asset?.cutout) return;
    const blob = await (await fetch(asset.dataUrl)).blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${safeFilename(asset.name.replace(/\.[^.]+$/, ""))}-透明背景.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("透明 PNG 已开始下载");
  }

  function beginAssetDrag(event, index, item) {
    const asset = imageAssets[index];
    if (!asset || asset.processing || event.target.closest("button")) {
      event.preventDefault();
      return;
    }
    draggingAssetIndex = index;
    item.classList.add("is-dragging-source");
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-form01-poster-asset", String(index));
    event.dataTransfer.setData("text/plain", String(index));
  }

  function endAssetDrag(item) {
    draggingAssetIndex = null;
    item.classList.remove("is-dragging-source");
    stage.classList.remove("asset-dragover");
  }

  function draggedAssetIndex(event) {
    const raw = event.dataTransfer?.getData("application/x-form01-poster-asset");
    const index = raw === "" ? draggingAssetIndex : Number(raw);
    return Number.isInteger(index) && index >= 0 && index < imageAssets.length ? index : null;
  }

  function placeAssetAt(index, clientX, clientY) {
    stage.classList.remove("asset-dragover");
    if (!Number.isInteger(index) || index < 0 || index >= imageAssets.length) return;

    if (index !== 0) {
      const [asset] = imageAssets.splice(index, 1);
      imageAssets.unshift(asset);
    }
    imageAssets[0].placedOnCanvas = true;
    state.hiddenBlocks = (state.hiddenBlocks || []).filter((id) => id !== "visual");
    const point = canvasPoint({ clientX, clientY });
    activeElement = { kind: "block", id: "visual" };
    setElementPosition(activeElement, point.x, point.y);
    draggingAssetIndex = null;
    renderAssets();
    renderMaterials();
    renderPreview();
    saveState();
    showToast("图片已放到海报中，可继续拖动和缩放");
  }

  function placeAssetOnCanvas(event) {
    event.preventDefault();
    const index = draggedAssetIndex(event);
    if (index !== null) placeAssetAt(index, event.clientX, event.clientY);
  }

  function pointIsOverCanvas(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
  }

  function beginAssetPointerDrag(event, index, item, thumb) {
    const asset = imageAssets[index];
    if (!asset || asset.processing || event.target.closest("button") || (event.pointerType === "mouse" && event.button !== 0)) return;
    event.preventDefault();
    draggingAssetPointer = { pointerId: event.pointerId, index, item, thumb, startX: event.clientX, startY: event.clientY, active: false };
    thumb.setPointerCapture?.(event.pointerId);
  }

  function moveAssetPointerDrag(event) {
    if (!draggingAssetPointer || draggingAssetPointer.pointerId !== event.pointerId) return;
    const distance = Math.hypot(event.clientX - draggingAssetPointer.startX, event.clientY - draggingAssetPointer.startY);
    if (!draggingAssetPointer.active && distance > 7) {
      draggingAssetPointer.active = true;
      draggingAssetIndex = draggingAssetPointer.index;
      draggingAssetPointer.item.classList.add("is-dragging-source");
    }
    if (!draggingAssetPointer.active) return;
    event.preventDefault();
    stage.classList.toggle("asset-dragover", pointIsOverCanvas(event.clientX, event.clientY));
  }

  function endAssetPointerDrag(event) {
    if (!draggingAssetPointer || draggingAssetPointer.pointerId !== event.pointerId) return;
    const drag = draggingAssetPointer;
    try { drag.thumb.releasePointerCapture?.(event.pointerId); } catch {}
    draggingAssetPointer = null;
    draggingAssetIndex = null;
    drag.item.classList.remove("is-dragging-source");
    stage.classList.remove("asset-dragover");
    if (drag.active && pointIsOverCanvas(event.clientX, event.clientY)) placeAssetAt(drag.index, event.clientX, event.clientY);
  }

  function renderAssets() {
    const container = $("#asset-list");
    container.innerHTML = "";
    imageAssets.forEach((asset, index) => {
      const item = document.createElement("div");
      item.className = `asset-item${index === 0 ? " is-primary" : ""}${asset.cutout ? " is-cutout" : ""}`;
      item.dataset.assetIndex = String(index);
      const badge = asset.cutout ? "透明 PNG" : index === 0 ? "主图" : `素材 ${index + 1}`;
      item.innerHTML = `
        <div class="asset-thumb" draggable="false" title="拖到右侧海报中" aria-label="拖动 ${escapeHtml(asset.name)} 到右侧海报">
          <img alt="${escapeHtml(asset.name)}" src="${asset.dataUrl}" draggable="false">
          <span class="asset-badge">${badge}</span>
          <button class="asset-remove" type="button" aria-label="移除 ${escapeHtml(asset.name)}" ${asset.processing ? "disabled" : ""}>×</button>
          ${asset.processing ? `<span class="asset-progress" style="--progress:${asset.progress || 3}%">${escapeHtml(asset.status || "正在处理图片")}<i></i></span>` : ""}
        </div>
        <div class="asset-tools">
          <button class="asset-tool asset-cutout" type="button" ${asset.processing ? "disabled" : ""}>${asset.cutout ? "↶ 恢复原图" : "✂ 一键抠图"}</button>
          ${asset.cutout ? `<button class="asset-tool asset-download" type="button" aria-label="下载透明 PNG" title="下载透明 PNG">⇩</button>` : ""}
        </div>`;
      $(".asset-remove", item).addEventListener("click", () => {
        imageAssets.splice(index, 1);
        renderAssets(); scheduleRender();
      });
      $(".asset-cutout", item).addEventListener("click", () => toggleCutout(index));
      $(".asset-download", item)?.addEventListener("click", () => downloadAsset(index));
      const thumb = $(".asset-thumb", item);
      thumb.addEventListener("dragstart", (event) => beginAssetDrag(event, index, item));
      thumb.addEventListener("dragend", () => endAssetDrag(item));
      thumb.addEventListener("pointerdown", (event) => beginAssetPointerDrag(event, index, item, thumb));
      container.appendChild(item);
    });
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
  }

  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    $("#toast-region").appendChild(toast);
    setTimeout(() => {
      toast.classList.add("out");
      setTimeout(() => toast.remove(), 220);
    }, 2300);
  }

  function safeFilename(value) {
    const name = String(value || "海报").trim().replace(/[\\/:*?"<>|\s]+/g, "-").replace(/-+/g, "-").slice(0, 38);
    return name || "海报";
  }

  async function exportPoster() {
    const [W, H] = FORMATS[state.format].export;
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = W;
    exportCanvas.height = H;
    const exportContext = exportCanvas.getContext("2d", { alpha: false });
    drawPoster(exportContext, state, W, H);

    exportCanvas.toBlob((blob) => {
      if (!blob) { showToast("导出失败，请再试一次"); return; }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${safeFilename(state.title)}-${state.style}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      $("#export-size-label").textContent = `${W} × ${H} px`;
      openExportModal();
    }, "image/png");
  }

  function openExportModal() {
    const modal = $("#export-modal");
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
  }

  function closeExportModal() {
    const modal = $("#export-modal");
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  }

  function bindEvents() {
    $$('[data-field]').forEach((el) => el.addEventListener(el.tagName === "SELECT" || el.type === "checkbox" ? "change" : "input", onFieldInput));
    $$(".style-card").forEach((card) => card.addEventListener("click", () => selectStyle(card.dataset.style)));
    $$(".material-card").forEach((card) => card.addEventListener("click", () => toggleMaterial(card.dataset.material)));
    $$('[data-emoji]').forEach((button) => button.addEventListener("click", () => addEmojiSticker(button.dataset.emoji)));
    $$('[data-block]').forEach((button) => button.addEventListener("click", () => selectBlock(button.dataset.block)));
    $("#shuffle-style-btn").addEventListener("click", randomizeStyle);
    $("#shuffle-layout-btn").addEventListener("click", randomizeLayout);
    $("#random-materials-btn").addEventListener("click", randomizeMaterials);
    $("#clear-materials-btn").addEventListener("click", () => {
      state.decorations = [];
      state.materialTransforms = {};
      if (activeElement?.kind === "material") activeElement = null;
      renderMaterials();
      scheduleRender();
      showToast("已清空拼贴素材");
    });
    $("#load-demo-btn").addEventListener("click", fillDemo);
    $("#reset-btn").addEventListener("click", resetAll);
    $("#export-btn").addEventListener("click", exportPoster);
    $("#element-smaller-btn").addEventListener("click", () => updateActiveElementScale(-1));
    $("#element-larger-btn").addEventListener("click", () => updateActiveElementScale(1));
    $("#element-reset-btn").addEventListener("click", resetActiveElementPosition);
    $("#element-remove-btn").addEventListener("click", removeActiveElement);
    $("#font-family-select").addEventListener("change", (event) => updateActiveTextStyle("font", event.currentTarget.value));
    $("#font-size-range").addEventListener("input", (event) => updateActiveTextStyle("size", Number(event.currentTarget.value)));
    $("#typography-reset-btn").addEventListener("click", resetActiveTypography);
    $("#add-course-btn").addEventListener("click", () => {
      if (state.workshopCourses.length >= 8) { showToast("一张海报最多排 8 门课程"); return; }
      state.workshopCourses.push({ title: "新课程", meta: "时间 · 地点", desc: "NEW WORKSHOP / 课程简介" });
      renderWorkshopCourses(); scheduleRender();
    });

    const upload = $("#image-upload");
    const zone = $("#upload-zone");
    upload.addEventListener("change", () => { handleFiles(upload.files); upload.value = ""; });
    ["dragenter", "dragover"].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.add("dragover"); }));
    ["dragleave", "drop"].forEach((type) => zone.addEventListener(type, (event) => { event.preventDefault(); zone.classList.remove("dragover"); }));
    zone.addEventListener("drop", (event) => handleFiles(event.dataTransfer.files));

    $("#qr-upload").addEventListener("change", async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;
      try {
        qrAsset = await readImage(file);
        syncQRPreview(); scheduleRender(); showToast("二维码已加入工坊海报");
      } catch { showToast("二维码图片无法读取，请换一张试试"); }
      event.target.value = "";
    });

    $("#zoom-in-btn").addEventListener("click", () => { zoomMultiplier = clamp(zoomMultiplier + .15, .45, 2); fitCanvas(); });
    $("#zoom-out-btn").addEventListener("click", () => { zoomMultiplier = clamp(zoomMultiplier - .15, .45, 2); fitCanvas(); });
    $("#zoom-reset-btn").addEventListener("click", () => { zoomMultiplier = 1; fitCanvas(); });
    canvas.addEventListener("pointerdown", beginElementDrag);
    canvas.addEventListener("pointermove", moveElementDrag);
    canvas.addEventListener("pointerup", endElementDrag);
    canvas.addEventListener("pointercancel", endElementDrag);
    canvas.addEventListener("dragenter", (event) => {
      if (draggedAssetIndex(event) === null) return;
      event.preventDefault();
      stage.classList.add("asset-dragover");
    });
    canvas.addEventListener("dragover", (event) => {
      if (draggedAssetIndex(event) === null) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "copy";
      stage.classList.add("asset-dragover");
    });
    canvas.addEventListener("dragleave", (event) => {
      if (!canvas.contains(event.relatedTarget)) stage.classList.remove("asset-dragover");
    });
    canvas.addEventListener("drop", placeAssetOnCanvas);
    window.addEventListener("pointermove", moveAssetPointerDrag);
    window.addEventListener("pointerup", endAssetPointerDrag);
    window.addEventListener("pointercancel", endAssetPointerDrag);
    window.addEventListener("mouseup", (event) => {
      if (!draggingAssetPointer) return;
      endAssetPointerDrag({ pointerId: draggingAssetPointer.pointerId, clientX: event.clientX, clientY: event.clientY });
    });
    window.addEventListener("resize", fitCanvas);

    $$('[data-close-modal]').forEach((el) => el.addEventListener("click", closeExportModal));
    document.addEventListener("keydown", (event) => {
      if (!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && activeElement) {
        event.preventDefault();
        const step = event.shiftKey ? .025 : .006;
        nudgeActiveElement(event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0, event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
      }
      if (!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && (event.key === "Delete" || event.key === "Backspace") && activeElement) { event.preventDefault(); removeActiveElement(); }
      if (event.key.toLowerCase() === "r" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) randomizeLayout();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); exportPoster(); }
      if (event.key === "Escape") { closeExportModal(); activeElement = null; renderMaterials(); renderPreview(); }
    });
  }

  syncUIFromState();
  bindEvents();
  renderPreview();
  requestAnimationFrame(fitCanvas);
})();
