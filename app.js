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
    a4: { label: "印刷 A4 · 210 × 297 mm", preview: [1080, 1528], export: [2480, 3508] },
    psd: { label: "原版 PSD · 3000:4290", preview: [1080, 1544], export: [1080, 1544] }
  };

  const STYLE_DEFAULTS = {
    "white-studio": { accent: "#f0527e", background: "#fbfbfb" },
    "ici-grid": { accent: "#f2f2f2", background: "#090909" },
    "ici-electric": { accent: "#155dff", background: "#f5f5f3" },
    swiss: { accent: "#38a99f", background: "#3fb6c6" },
    editorial: { accent: "#161616", background: "#eee6d5" },
    collage: { accent: "#151515", background: "#b8b6b7" },
    quiet: { accent: "#171717", background: "#b6b4b5" },
    "layout-lab": { accent: "#087ee8", background: "#d7dceb" },
    "art-blue": { accent: "#f05b31", background: "#eeeae7" },
    "composition-atlas": { accent: "#087ed5", background: "#e8e8e6" },
    "teacher-workshop": { accent: "#ed315f", background: "#ffffff" },
  };

  const TEMPLATE_POLICIES = {
    "white-studio": { purpose: "01 · 作为意志与表象的世界", scope: "由原始 PSD 分层转换；成品模式可改文字，自由模式可调整独立图层。", format: "psd", blocks: [] },
    "ici-grid": { purpose: "02 · 宇宙与荒原", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    "ici-electric": { purpose: "03 · 城市旷野", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    swiss: { purpose: "04 · 过家家", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    editorial: { purpose: "05 · 苏联电影展", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    collage: { purpose: "06 · 感觉的潮汐", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    quiet: { purpose: "07 · 咖啡咖", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    "layout-lab": { purpose: "08 · 诗转场", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    "art-blue": { purpose: "09 · 落日贩卖机", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    "composition-atlas": { purpose: "10 · 枷锁女性", scope: "由原始 PSD 分层转换；保留原稿图像、字体位置和构图比例。", format: "psd", blocks: [] },
    "teacher-workshop": { purpose: "老师工坊课程表", scope: "保留老师原稿 9:16 比例、四组课程与底部署名。", format: "story", blocks: ["title", "date", "courses", "organizer"] },
  };

  const ACTIVE_STYLE_IDS = ["white-studio", "ici-grid", "ici-electric", "swiss", "editorial", "collage", "quiet", "layout-lab", "art-blue", "composition-atlas", "teacher-workshop"];
  const REDESIGNED_PRODUCTION_STYLES = new Set(ACTIVE_STYLE_IDS.filter((style) => style !== "teacher-workshop"));
  const PSD_TEMPLATE_STYLES = new Set(Object.keys(window.PSD_TEMPLATES || {}));
  const GENERATED_VISUAL_STYLES = new Set(REDESIGNED_PRODUCTION_STYLES);
  const CONTENT_FIELD_IDS = ["kicker", "title", "subtitle", "date", "time", "venue", "body", "organizer"];

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
    editorMode: "guided",
    smartGuides: true,
    showGrid: true,
    showGrain: false,
    decorations: [],
    materialTransforms: {},
    emojiStickers: [],
    extraTextBoxes: [],
    blockTransforms: {},
    textStyles: {},
    hiddenBlocks: [],
    psdLayerOverrides: {},
    styleDrafts: {},
    materialScale: 100,
    motifPreset: "01",
    motifEmoji: "👀",
    workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course })),
    teacherWorkshopDraft: null,
    teacherWorkshopReturn: null,
    neonDoodleDraft: null,
    neonDoodleReturn: null,
    neonDoodleVersion: 4,
    materialSchemaVersion: 2,
    productionSystemVersion: 2,
    seed: 48271
  };

  let state = loadState();
  if (currentPsdTemplate(state.style)) state.format = "psd";
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
  let materialSerial = 0;
  let extraTextSerial = 0;
  const psdImageCache = new Map();
  let psdLoadingStyle = "";

  function materialType(entry) {
    return typeof entry === "string" ? entry : String(entry?.type || "");
  }

  function materialId(entry, index = 0) {
    if (entry && typeof entry === "object" && entry.id) return String(entry.id);
    const type = materialType(entry) || "material";
    return `material-${type}-${index + 1}`;
  }

  function createMaterialInstance(type, preferredId = "") {
    materialSerial += 1;
    return {
      id: preferredId || `material-${type}-${Date.now().toString(36)}-${materialSerial.toString(36)}`,
      type
    };
  }

  function normalizeMaterialWorkspace(workspace) {
    if (!workspace || typeof workspace !== "object") return workspace;
    const source = Array.isArray(workspace.decorations) ? workspace.decorations : [];
    const oldTransforms = workspace.materialTransforms && typeof workspace.materialTransforms === "object" ? workspace.materialTransforms : {};
    const used = new Set();
    const decorations = [];
    const materialTransforms = {};
    source.forEach((entry, index) => {
      const type = materialType(entry);
      if (!type || !MATERIAL_LABELS[type]) return;
      let id = materialId(entry, index);
      while (used.has(id)) id = `${id}-${index + 1}`;
      used.add(id);
      decorations.push({ id, type });
      const transform = oldTransforms[id] || oldTransforms[type];
      if (transform && typeof transform === "object") materialTransforms[id] = { ...transform };
    });
    workspace.decorations = decorations;
    workspace.materialTransforms = materialTransforms;
    workspace.materialSchemaVersion = 2;
    return workspace;
  }

  function findMaterialInstance(id, source = state.decorations) {
    return (Array.isArray(source) ? source : []).find((entry, index) => materialId(entry, index) === id) || null;
  }

  function normalizeExtraTextBoxes(boxes) {
    return (Array.isArray(boxes) ? boxes : []).slice(0, 8).map((box, index) => ({
      id: String(box?.id || `extra-text-${index + 1}`),
      text: String(box?.text || "补充文字").slice(0, 120),
      preset: ["caption", "label", "statement"].includes(box?.preset) ? box.preset : "caption",
      x: Number.isFinite(box?.x) ? box.x : .16 + (index % 3) * .04,
      y: Number.isFinite(box?.y) ? box.y : .84 - (index % 3) * .055,
      scale: clamp(Number(box?.scale) || 1, .4, 2.8),
      rotation: clamp(Number(box?.rotation) || 0, -180, 180)
    }));
  }

  function findExtraTextBox(id) {
    return (state.extraTextBoxes || []).find((box) => box.id === id) || null;
  }

  function currentPsdTemplate(style = state.style) {
    return window.PSD_TEMPLATES?.[style] || null;
  }

  function findPsdLayer(id, style = state.style) {
    return currentPsdTemplate(style)?.layers?.find((layer) => layer.id === id) || null;
  }

  function psdLayerOverride(id) {
    return state.psdLayerOverrides?.[id] || {};
  }

  function normalizePsdLayerOverrides(overrides) {
    if (!overrides || typeof overrides !== "object") return {};
    const normalized = {};
    Object.entries(overrides).forEach(([id, value]) => {
      if (!value || typeof value !== "object") return;
      normalized[id] = {
        ...(typeof value.text === "string" ? { text: value.text.slice(0, 500) } : {}),
        ...(Number.isFinite(value.x) ? { x: clamp(value.x, -.5, 1.5) } : {}),
        ...(Number.isFinite(value.y) ? { y: clamp(value.y, -.5, 1.5) } : {}),
        ...(Number.isFinite(value.scale) ? { scale: clamp(value.scale, .15, 4) } : {}),
        ...(Number.isFinite(value.rotation) ? { rotation: clamp(value.rotation, -180, 180) } : {}),
        ...(value.hidden === true ? { hidden: true } : {})
      };
    });
    return normalized;
  }

  function createStyleDraft(source, style) {
    const policy = TEMPLATE_POLICIES[style] || TEMPLATE_POLICIES["white-studio"];
    const defaults = STYLE_DEFAULTS[style] || STYLE_DEFAULTS["white-studio"];
    const materialWorkspace = normalizeMaterialWorkspace({
      decorations: JSON.parse(JSON.stringify(source?.decorations || [])),
      materialTransforms: JSON.parse(JSON.stringify(source?.materialTransforms || {}))
    });
    return {
      format: PSD_TEMPLATE_STYLES.has(style) ? policy.format : (source?.format || policy.format),
      accent: typeof source?.accent === "string" ? source.accent : defaults.accent,
      background: typeof source?.background === "string" ? source.background : defaults.background,
      showGrain: Boolean(source?.showGrain),
      hiddenBlocks: [...(Array.isArray(source?.hiddenBlocks) ? source.hiddenBlocks : [])],
      blockTransforms: JSON.parse(JSON.stringify(source?.blockTransforms || {})),
      textStyles: JSON.parse(JSON.stringify(source?.textStyles || {})),
      decorations: materialWorkspace.decorations,
      materialTransforms: materialWorkspace.materialTransforms,
      emojiStickers: JSON.parse(JSON.stringify(Array.isArray(source?.emojiStickers) ? source.emojiStickers : [])),
      extraTextBoxes: normalizeExtraTextBoxes(source?.extraTextBoxes),
      psdLayerOverrides: normalizePsdLayerOverrides(source?.psdLayerOverrides),
      materialScale: clamp(Number(source?.materialScale) || 100, 40, 280),
      motifPreset: String(source?.motifPreset || "01"),
      motifEmoji: String(source?.motifEmoji || "👀")
    };
  }

  function saveStyleDraft(style) {
    if (!ACTIVE_STYLE_IDS.includes(style) || style === "teacher-workshop") return;
    state.styleDrafts = { ...(state.styleDrafts || {}), [style]: createStyleDraft(state, style) };
  }

  function applyStyleDraft(style, draft) {
    const normalized = createStyleDraft(draft || {}, style);
    state.format = normalized.format;
    state.accent = normalized.accent;
    state.background = normalized.background;
    state.showGrain = normalized.showGrain;
    state.hiddenBlocks = normalized.hiddenBlocks;
    state.blockTransforms = normalized.blockTransforms;
    state.textStyles = normalized.textStyles;
    state.decorations = normalized.decorations;
    state.materialTransforms = normalized.materialTransforms;
    state.emojiStickers = normalized.emojiStickers;
    state.extraTextBoxes = normalized.extraTextBoxes;
    state.psdLayerOverrides = normalized.psdLayerOverrides;
    state.materialScale = normalized.materialScale;
    state.motifPreset = normalized.motifPreset;
    state.motifEmoji = normalized.motifEmoji;
  }

  function elementCanBeEdited(element) {
    if (!element) return false;
    if (element.kind === "psd-layer") return state.editorMode === "free";
    return state.editorMode === "free" || element.kind === "extra-text";
  }

  function loadState() {
    const fresh = { ...defaultState, decorations: [], materialTransforms: {}, emojiStickers: [], extraTextBoxes: [], blockTransforms: {}, textStyles: {}, hiddenBlocks: [], psdLayerOverrides: {}, styleDrafts: {}, workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course })) };
    try {
      const saved = JSON.parse(localStorage.getItem("form01-poster-state") || "null");
      if (!saved) return fresh;
      const merged = { ...fresh, ...saved };
      if (!ACTIVE_STYLE_IDS.includes(merged.style)) merged.style = "white-studio";
      if (merged.kicker === "ICI DESIGN SEASON · 2026") merged.kicker = "ICI RP";
      if (merged.venue === "厦门 · 海上世界文化艺术中心") merged.venue = "厦门大学创意与创新学院204";
      if (!Array.isArray(merged.decorations)) merged.decorations = [];
      if (!merged.materialTransforms || typeof merged.materialTransforms !== "object") merged.materialTransforms = {};
      if (!Array.isArray(merged.emojiStickers)) merged.emojiStickers = [];
      merged.extraTextBoxes = normalizeExtraTextBoxes(merged.extraTextBoxes);
      if (!['guided', 'free'].includes(merged.editorMode)) merged.editorMode = "guided";
      if (!merged.blockTransforms || typeof merged.blockTransforms !== "object") merged.blockTransforms = {};
      if (!merged.textStyles || typeof merged.textStyles !== "object") merged.textStyles = {};
      if (!Array.isArray(merged.hiddenBlocks)) merged.hiddenBlocks = [];
      merged.psdLayerOverrides = normalizePsdLayerOverrides(merged.psdLayerOverrides);
      normalizeMaterialWorkspace(merged);
      ["teacherWorkshopDraft", "teacherWorkshopReturn", "neonDoodleDraft", "neonDoodleReturn"].forEach((key) => {
        if (merged[key]) {
          normalizeMaterialWorkspace(merged[key]);
          merged[key].extraTextBoxes = normalizeExtraTextBoxes(merged[key].extraTextBoxes);
        }
      });
      const savedDrafts = merged.styleDrafts && typeof merged.styleDrafts === "object" ? merged.styleDrafts : {};
      merged.styleDrafts = {};
      Object.entries(savedDrafts).forEach(([style, draft]) => {
        if (ACTIVE_STYLE_IDS.includes(style) && style !== "teacher-workshop") merged.styleDrafts[style] = createStyleDraft(draft, style);
      });
      if (saved.productionSystemVersion !== 2 && merged.style !== "teacher-workshop") {
        merged.styleDrafts[merged.style] = createStyleDraft(merged, merged.style);
      }
      merged.productionSystemVersion = 2;
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
    syncEditorMode();
    updateMaterialScaleLabel();
    renderMaterials();
    renderExtraTextList();
    updateAllCounts();
    toggleWorkshopSection();
    renderWorkshopCourses();
    renderPsdLayerPanel();
    ensurePsdTemplateLoaded(state.style);
  }

  function syncEditorMode() {
    const guided = state.editorMode !== "free";
    document.body.classList.toggle("guided-mode", guided);
    document.body.classList.toggle("psd-template-active", Boolean(currentPsdTemplate()));
    $$('[data-editor-mode]').forEach((button) => {
      const selected = button.dataset.editorMode === (guided ? "guided" : "free");
      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
    $("#mode-status").textContent = guided ? "核心版式已锁定" : "全部编辑能力已开启";
    $("#mode-description").textContent = guided
      ? "只替换内容和主图，核心构图保持稳定，适合直接生产活动海报。"
      : "可移动、旋转、隐藏版面部件并叠加素材，适合学习与视觉实验。";

    const policy = TEMPLATE_POLICIES[state.style] || TEMPLATE_POLICIES["white-studio"];
    $("#template-purpose").textContent = policy.purpose;
    $("#template-scope").textContent = guided ? policy.scope : "自由模式已开启：模板规则作为起点，所有部件均可继续调整。";
    const formatSelect = $("#format");
    formatSelect.disabled = guided || Boolean(currentPsdTemplate());
    $("#format-group").classList.toggle("locked-control", guided || Boolean(currentPsdTemplate()));

    CONTENT_FIELD_IDS.forEach((id) => {
      const input = $("#" + id);
      const enabled = !guided || policy.blocks.includes(id);
      input.disabled = !enabled;
      input.closest(".field-group")?.classList.toggle("field-disabled", !enabled);
    });
    if (activeElement && !elementCanBeEdited(activeElement)) activeElement = null;
    const addButton = $("#add-text-box-btn");
    if (addButton) addButton.disabled = (state.extraTextBoxes || []).length >= (guided ? 3 : 8);
  }

  function setEditorMode(mode) {
    const nextMode = mode === "free" ? "free" : "guided";
    if (state.editorMode === nextMode) return;
    state.editorMode = nextMode;
    if (nextMode === "guided") {
      const policy = TEMPLATE_POLICIES[state.style] || TEMPLATE_POLICIES["white-studio"];
      if (state.format !== policy.format) {
        state.format = policy.format;
        $("#format").value = state.format;
        zoomMultiplier = 1;
      }
    }
    activeElement = null;
    syncEditorMode();
    renderMaterials();
    renderExtraTextList();
    scheduleRender();
    showToast(nextMode === "guided" ? "已进入成品模式：核心构图已锁定" : "已进入自由模式：可以调整全部版面部件");
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
    const slider = $("#material-scale");
    const output = $("#material-scale-value");
    const label = $('label[for="material-scale"]');
    if (!slider || !output) return;
    let scale = null;
    let maxScale = 2.5;
    let caption = "当前素材大小";
    if (activeElement?.kind === "material" && findMaterialInstance(activeElement.id)) {
      scale = Number(state.materialTransforms?.[activeElement.id]?.scale) || 1;
      const instance = findMaterialInstance(activeElement.id);
      caption = `${MATERIAL_LABELS[materialType(instance)] || "素材"}大小`;
    } else if (activeElement?.kind === "emoji") {
      const sticker = state.emojiStickers.find((item) => item.id === activeElement.id);
      if (sticker) { scale = Number(sticker.scale) || 1; maxScale = 2.8; caption = `${sticker.emoji} 大小`; }
    } else if (activeElement?.kind === "extra-text") {
      const box = findExtraTextBox(activeElement.id);
      if (box) { scale = Number(box.scale) || 1; maxScale = 2.8; caption = "文本框大小"; }
    } else if (activeElement?.kind === "psd-layer" && findPsdLayer(activeElement.id)) {
      const layer = findPsdLayer(activeElement.id);
      scale = Number(psdLayerOverride(activeElement.id).scale) || 1;
      maxScale = 4;
      caption = `${layer.name || "PSD 图层"}大小`;
    }
    if (!elementCanBeEdited(activeElement)) scale = null;
    slider.disabled = scale == null;
    slider.min = activeElement?.kind === "psd-layer" ? "15" : "40";
    slider.max = String(Math.round(maxScale * 100));
    slider.value = String(Math.round(clamp(scale || 1, activeElement?.kind === "psd-layer" ? .15 : .4, maxScale) * 100));
    output.textContent = scale == null ? "选择素材" : `${Math.round(scale * 100)}%`;
    if (label) label.textContent = caption;
  }

  function updateMaterialRotationLabel() {
    const slider = $("#material-rotation");
    const output = $("#material-rotation-value");
    const label = $('label[for="material-rotation"]');
    if (!slider || !output) return;
    let angle = null;
    let caption = "当前元素角度";
    if (activeElement?.kind === "material" && findMaterialInstance(activeElement.id)) {
      const instance = findMaterialInstance(activeElement.id);
      angle = Number(state.materialTransforms?.[activeElement.id]?.rotation) || 0;
      caption = `${MATERIAL_LABELS[materialType(instance)] || "素材"}角度`;
    } else if (activeElement?.kind === "emoji") {
      const sticker = state.emojiStickers.find((item) => item.id === activeElement.id);
      if (sticker) {
        angle = Number.isFinite(sticker.rotation) ? sticker.rotation * 180 / Math.PI : 0;
        caption = `${sticker.emoji} 角度`;
      }
    } else if (activeElement?.kind === "block" && !state.hiddenBlocks.includes(activeElement.id)) {
      angle = Number(state.blockTransforms?.[activeElement.id]?.rotation) || 0;
      caption = `${BLOCK_LABELS[activeElement.id] || "版面元素"}角度`;
    } else if (activeElement?.kind === "extra-text") {
      const box = findExtraTextBox(activeElement.id);
      if (box) { angle = Number(box.rotation) || 0; caption = "文本框角度"; }
    } else if (activeElement?.kind === "psd-layer" && findPsdLayer(activeElement.id)) {
      const layer = findPsdLayer(activeElement.id);
      angle = Number(psdLayerOverride(activeElement.id).rotation) || 0;
      caption = `${layer.name || "PSD 图层"}角度`;
    }
    if (!elementCanBeEdited(activeElement)) angle = null;
    slider.disabled = angle == null;
    slider.value = String(Math.round(clamp(angle || 0, -180, 180)));
    output.textContent = angle == null ? "选择元素" : `${Math.round(angle)}°`;
    if (label) label.textContent = caption;
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

  function getPsdImage(src) {
    const cached = psdImageCache.get(src);
    if (cached?.complete) return cached;
    if (!cached) {
      const image = new Image();
      image.decoding = "async";
      image.onload = () => { psdImageCache.set(src, image); scheduleRender(false); };
      image.onerror = () => { psdImageCache.set(src, { complete: false, failed: true }); };
      image.src = src;
      psdImageCache.set(src, image);
    }
    return null;
  }

  function ensurePsdTemplateLoaded(style) {
    const template = currentPsdTemplate(style);
    if (!template) return;
    psdLoadingStyle = style;
    [template.preview, template.base, ...template.layers.map((layer) => layer.src)].forEach(getPsdImage);
  }

  function drawChangedPsdText(c, layer, override, width, height) {
    const text = String(override.text ?? layer.text ?? "");
    const sourceRotation = Number(layer.textRotation) || 0;
    const quarterTurn = Math.abs(Math.abs(sourceRotation) - 90) < 8;
    const boxWidth = Math.max(4, quarterTurn ? height : width);
    const boxHeight = Math.max(4, quarterTurn ? width : height);
    const lines = text.split(/\n/);
    const lineHeightRatio = Number(layer.lineHeight) || 1.15;
    let fontSize = Math.max(4, Number(layer.fontSize) || boxHeight * .55);
    const familyName = String(layer.fontFamily || layer.fontPostScript || "Arial").replaceAll('"', '');
    const family = `"${familyName}", "Microsoft YaHei", Arial, sans-serif`;
    const maxLineWidth = () => Math.max(...lines.map((line) => c.measureText(line || " ").width), 1);
    c.font = `500 ${fontSize}px ${family}`;
    while ((maxLineWidth() > boxWidth * .98 || lines.length * fontSize * lineHeightRatio > boxHeight * 1.08) && fontSize > 4) {
      fontSize *= .94;
      c.font = `500 ${fontSize}px ${family}`;
    }
    c.fillStyle = layer.color || "#111111";
    c.textBaseline = "middle";
    c.textAlign = layer.align === "right" ? "right" : layer.align === "center" ? "center" : "left";
    const anchorX = c.textAlign === "right" ? boxWidth / 2 : c.textAlign === "center" ? 0 : -boxWidth / 2;
    const lineHeight = fontSize * lineHeightRatio;
    const startY = -(lines.length - 1) * lineHeight / 2;
    c.save();
    c.rotate(sourceRotation * Math.PI / 180);
    lines.forEach((line, index) => c.fillText(line, anchorX, startY + index * lineHeight, boxWidth));
    c.restore();
  }

  function drawPsdTemplate(c, data, W, H) {
    const template = currentPsdTemplate(data.style);
    if (!template) return false;
    const scaleX = W / template.width;
    const scaleY = H / template.height;
    const hasOverrides = Object.values(data.psdLayerOverrides || {}).some((value) => value && Object.keys(value).length);
    const base = getPsdImage(hasOverrides ? template.base : template.preview);
    if (base?.complete) c.drawImage(base, 0, 0, W, H);
    else {
      c.fillStyle = "#f5f5f3";
      c.fillRect(0, 0, W, H);
      c.fillStyle = "#111";
      c.font = `700 ${Math.max(18, W * .024)}px Arial, sans-serif`;
      c.textAlign = "center";
      c.fillText("正在读取原始 PSD 图层…", W / 2, H / 2);
    }
    template.layers.forEach((layer) => {
      const override = data.psdLayerOverrides?.[layer.id] || {};
      if (override.hidden) return;
      const x = Number.isFinite(override.x) ? override.x * W : layer.x * scaleX;
      const y = Number.isFinite(override.y) ? override.y * H : layer.y * scaleY;
      const layerScale = clamp(Number(override.scale) || 1, .15, 4);
      const rotation = clamp(Number(override.rotation) || 0, -180, 180) * Math.PI / 180;
      const width = layer.w * scaleX;
      const height = layer.h * scaleY;
      if (hasOverrides) {
        const image = getPsdImage(layer.src);
        c.save();
        c.translate(x, y);
        c.rotate(rotation);
        c.scale(layerScale, layerScale);
        const textChanged = layer.type === "type" && typeof override.text === "string" && override.text !== layer.text;
        if (textChanged) drawChangedPsdText(c, layer, override, width, height);
        else if (image?.complete) c.drawImage(image, -width / 2, -height / 2, width, height);
        c.restore();
      }
      if (c === ctx) interactiveHitAreas.push({ kind: "psd-layer", id: layer.id, x, y, w: width * layerScale, h: height * layerScale, radius: Math.hypot(width, height) * layerScale / 2 });
    });
    return true;
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

    if (!drawPsdTemplate(c, data, W, H)) drawFlatPoster(c, data, W, H, s, seed);
    if (!currentPsdTemplate(data.style) && Array.isArray(data.extraTextBoxes) && data.extraTextBoxes.length) drawExtraTextBoxes(c, data, W, H);
    if (data.editorMode === "free" && Array.isArray(data.decorations) && data.decorations.length) {
      drawCollageMaterials(c, data, W, H, seed);
    } else if (data.editorMode !== "free" && data.style === "neon-doodle") {
      const templateDecorations = (data.decorations || []).filter((entry, index) => materialId(entry, index) === "neon-blob-main");
      if (templateDecorations.length) drawCollageMaterials(c, { ...data, decorations: templateDecorations }, W, H, seed);
    }
    if (data.editorMode === "free" && Array.isArray(data.emojiStickers) && data.emojiStickers.length) drawEmojiStickers(c, data, W, H);
    if (data.showGrain) drawGrain(c, W, H, seed, data.style === "collage" ? .075 : .045);
    if (c === ctx && activeElement) drawActiveElementOutline(c);
    if (c === ctx && draggingElement && data.smartGuides) drawSmartGuides(c, W, H);
    c.restore();
  }

  function drawExtraTextBoxes(c, data, W, H) {
    const unit = W / 1080;
    const theme = getFlatTheme(data);
    const visibleLimit = data.editorMode === "free" ? 8 : 3;
    data.extraTextBoxes.slice(0, visibleLimit).forEach((box) => {
      const preset = box.preset || "caption";
      const scale = clamp(Number(box.scale) || 1, .4, 2.8);
      const rotation = clamp(Number(box.rotation) || 0, -180, 180) * Math.PI / 180;
      const x = clamp(Number(box.x) || .16, .02, .98) * W;
      const y = clamp(Number(box.y) || .84, .02, .98) * H;
      const fontSize = (preset === "statement" ? 39 : preset === "label" ? 18 : 22) * unit;
      const maxWidth = (preset === "statement" ? .54 : preset === "label" ? .38 : .44) * W;
      const weight = preset === "caption" ? 650 : 900;
      const family = preset === "statement" ? theme.titleFont : 'Arial, "Microsoft YaHei", sans-serif';
      const text = String(box.text || "补充文字");

      c.save();
      c.translate(x, y); c.rotate(rotation); c.scale(scale, scale);
      c.font = `${weight} ${fontSize}px ${family}`;
      c.textAlign = "left"; c.textBaseline = "top";
      const lines = wrapLines(c, text, maxWidth, preset === "statement" ? 4 : 3);
      const lineHeight = fontSize * (preset === "caption" ? 1.36 : 1.08);
      const widths = lines.map((line) => c.measureText(line).width);
      const textWidth = Math.max(fontSize * 2.2, ...widths);
      const textHeight = Math.max(lineHeight, lines.length * lineHeight);
      const padX = preset === "label" ? 15 * unit : 0;
      const padY = preset === "label" ? 10 * unit : 0;
      const originX = -textWidth / 2;
      const originY = -textHeight / 2;
      if (preset === "label") {
        c.fillStyle = theme.accent;
        roundedRectPath(c, originX - padX, originY - padY, textWidth + padX * 2, textHeight + padY * 2, 4 * unit);
        c.fill();
        c.fillStyle = luminance(theme.accent) < .58 ? "#ffffff" : "#111111";
      } else c.fillStyle = theme.ink;
      lines.forEach((line, index) => c.fillText(line, originX, originY + index * lineHeight, maxWidth));
      if (preset === "caption") {
        c.fillStyle = theme.accent;
        c.fillRect(originX, originY + textHeight + 7 * unit, Math.min(textWidth, 64 * unit), Math.max(2, 3 * unit));
      }
      c.restore();

      if (c === ctx) interactiveHitAreas.push({
        kind: "extra-text", id: box.id, x, y,
        w: (textWidth + padX * 2) * scale,
        h: (textHeight + padY * 2 + (preset === "caption" ? 12 * unit : 0)) * scale,
        radius: Math.hypot(textWidth, textHeight) * scale / 2
      });
    });
  }

  function getFlatTheme(data) {
    const themes = {
      "white-studio": { bg: data.background, ink: "#11110f", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 500, titleSize: 82, visual: "will" },
      "ici-grid": { bg: data.background, ink: "#f1f1f1", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 86, visual: "cosmos" },
      "ici-electric": { bg: data.background, ink: "#11110f", titleFont: 'Georgia, "Songti SC", serif', titleWeight: 400, titleSize: 108, visual: "blue-mist" },
      swiss: { bg: data.background, ink: "#11110f", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 100, visual: "playhouse" },
      editorial: { bg: data.background, ink: "#11110f", titleFont: '"Courier New", "Microsoft YaHei", monospace', titleWeight: 700, titleSize: 84, visual: "soviet" },
      collage: { bg: data.background, ink: "#11110f", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 76, visual: "tide" },
      quiet: { bg: data.background, ink: "#11110f", titleFont: '"Arial Narrow", "Microsoft YaHei", sans-serif', titleWeight: 900, titleSize: 112, visual: "coffee" },
      "layout-lab": { bg: data.background, ink: "#11110f", titleFont: '"Arial Narrow", Georgia, "Songti SC", serif', titleWeight: 300, titleSize: 90, visual: "poem" },
      "art-blue": { bg: data.background, ink: "#ffffff", titleFont: 'Arial, "Microsoft YaHei", sans-serif', titleWeight: 600, titleSize: 78, visual: "sunset" },
      "composition-atlas": { bg: data.background, ink: "#087ed5", titleFont: 'Georgia, "Songti SC", serif', titleWeight: 700, titleSize: 94, visual: "chains" },
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
      "white-studio": { kicker: { x: .13, y: .06, w: .22, h: .028 }, title: { x: .73, y: .35, w: .48, h: .25 }, subtitle: { x: .23, y: .74, w: .34, h: .08 }, visual: { x: .39, y: .57, w: .34, h: .25 }, date: { x: .76, y: .72, w: .32, h: .075 }, venue: { x: .76, y: .82, w: .34, h: .09 }, body: { x: .22, y: .25, w: .32, h: .18 }, organizer: { x: .23, y: .91, w: .36, h: .05 } },
      "ici-grid": { kicker: { x: .22, y: .075, w: .38, h: .045 }, title: { x: .73, y: .26, w: .49, h: .24 }, subtitle: { x: .22, y: .18, w: .37, h: .07 }, visual: { x: .66, y: .68, w: .53, h: .36 }, date: { x: .76, y: .38, w: .40, h: .075 }, time: { x: .76, y: .44, w: .39, h: .04 }, venue: { x: .68, y: .89, w: .46, h: .07 }, body: { x: .22, y: .62, w: .37, h: .18 }, organizer: { x: .20, y: .92, w: .36, h: .05 } },
      "ici-electric": { kicker: { x: .50, y: .06, w: .50, h: .035, align: "center" }, title: { x: .50, y: .16, w: .82, h: .15, align: "center" }, subtitle: { x: .50, y: .28, w: .64, h: .07, align: "center" }, visual: { x: .50, y: .53, w: .82, h: .72 }, date: { x: .50, y: .48, w: .39, h: .13, align: "center" }, venue: { x: .50, y: .72, w: .42, h: .08, align: "center" }, organizer: { x: .50, y: .92, w: .52, h: .05, align: "center" } },
      swiss: { kicker: { x: .17, y: .055, w: .28, h: .035 }, title: { x: .77, y: .12, w: .37, h: .16, align: "right" }, subtitle: { x: .18, y: .88, w: .34, h: .10 }, visual: { x: .51, y: .54, w: .92, h: .75 }, date: { x: .80, y: .31, w: .28, h: .08, align: "right" }, venue: { x: .78, y: .88, w: .32, h: .08, align: "right" }, organizer: { x: .17, y: .95, w: .31, h: .035 } },
      editorial: { kicker: { x: .20, y: .055, w: .33, h: .055 }, title: { x: .50, y: .20, w: .91, h: .18, align: "center" }, subtitle: { x: .50, y: .32, w: .86, h: .06, align: "center" }, visual: { x: .78, y: .47, w: .32, h: .21 }, date: { x: .83, y: .83, w: .25, h: .06 }, time: { x: .83, y: .88, w: .25, h: .045 }, venue: { x: .36, y: .91, w: .47, h: .07 }, body: { x: .30, y: .61, w: .55, h: .38 }, organizer: { x: .17, y: .96, w: .28, h: .035 } },
      collage: { kicker: { x: .16, y: .05, w: .27, h: .035 }, title: { x: .22, y: .14, w: .34, h: .12 }, subtitle: { x: .20, y: .23, w: .34, h: .07 }, visual: { x: .50, y: .42, w: .36, h: .27 }, date: { x: .84, y: .15, w: .27, h: .10, align: "right" }, venue: { x: .19, y: .89, w: .33, h: .08 }, organizer: { x: .80, y: .94, w: .34, h: .045, align: "right" } },
      quiet: { kicker: { x: .87, y: .09, w: .23, h: .055, align: "right" }, title: { x: .52, y: .34, w: .68, h: .18, align: "center" }, subtitle: { x: .10, y: .50, w: .27, h: .11 }, visual: { x: .52, y: .53, w: .91, h: .80 }, date: { x: .78, y: .94, w: .38, h: .07, align: "right" }, venue: { x: .13, y: .79, w: .26, h: .12 }, body: { x: .68, y: .84, w: .50, h: .12 }, organizer: { x: .14, y: .95, w: .26, h: .04 } },
      "layout-lab": { kicker: { x: .50, y: .05, w: .58, h: .035, align: "center" }, title: { x: .39, y: .13, w: .72, h: .13 }, subtitle: { x: .43, y: .25, w: .72, h: .07 }, visual: { x: .50, y: .51, w: .88, h: .74 }, date: { x: .45, y: .38, w: .52, h: .09, align: "center" }, body: { x: .43, y: .73, w: .72, h: .17 }, organizer: { x: .50, y: .92, w: .58, h: .04, align: "center" } },
      "art-blue": { kicker: { x: .50, y: .05, w: .44, h: .04, align: "center" }, title: { x: .50, y: .46, w: .72, h: .14, align: "center" }, subtitle: { x: .50, y: .58, w: .62, h: .06, align: "center" }, date: { x: .50, y: .81, w: .34, h: .06, align: "center" }, venue: { x: .50, y: .88, w: .50, h: .06, align: "center" }, organizer: { x: .50, y: .95, w: .48, h: .035, align: "center" } },
      "composition-atlas": { kicker: { x: .50, y: .035, w: .40, h: .035, align: "center" }, title: { x: .50, y: .10, w: .94, h: .14, align: "center" }, subtitle: { x: .50, y: .74, w: .78, h: .13, align: "center" }, visual: { x: .50, y: .48, w: .50, h: .70 }, date: { x: .16, y: .16, w: .25, h: .06 }, body: { x: .18, y: .86, w: .29, h: .11 }, organizer: { x: .50, y: .95, w: .44, h: .035, align: "center" } },
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
      const policy = TEMPLATE_POLICIES[data.style] || TEMPLATE_POLICIES["white-studio"];
      if (!spec || (data.editorMode === "free" && data.hiddenBlocks?.includes(id))) return;
      if (data.editorMode !== "free" && !policy.blocks.includes(id)) return;
      // Empty image placeholders should be genuine whitespace. The visual block
      // appears only after an image is uploaded, except for styles whose visual
      // is generated by the template itself.
      if (id === "visual" && !imageAssets.length && !GENERATED_VISUAL_STYLES.has(data.style)) return;
      drawFlatBlock(c, data, W, H, s, seed, theme, id, spec);
    });
  }

  function drawFlatBackground(c, data, W, H, theme, seed) {
    c.fillStyle = theme.bg; c.fillRect(0, 0, W, H);
    const accent = theme.accent;
    if (data.style === "white-studio") {
      c.fillStyle = "#1594a8"; c.fillRect(0, H * .10, W * .09, H * .025); c.fillRect(W * .05, H * .72, W * .20, H * .04);
      c.fillStyle = "#43ad8d"; c.fillRect(W * .13, H * .72, W * .13, H * .04);
      c.fillStyle = accent; c.fillRect(W * .50, H * .095, W * .12, H * .21);
      c.fillStyle = "#ffef00"; c.fillRect(W * .535, H * .14, W * .06, H * .17);
      c.strokeStyle = "#171715"; c.lineWidth = Math.max(1.5, W * .0016);
      [[.34,.31,.34,.37],[.20,.59,.30,.59],[.34,.63,.34,.77],[.63,.83,.63,.95]].forEach(([x1,y1,x2,y2])=>{c.beginPath();c.moveTo(W*x1,H*y1);c.lineTo(W*x2,H*y2);c.stroke();});
      c.fillStyle = alpha("#171715", .45); c.font = `500 ${14 * W / 1080}px Arial, sans-serif`; c.fillText("AOI / EXHIBITION INDEX", W * .05, H * .96);
    } else if (data.style === "ici-grid") {
      c.strokeStyle = alpha(accent, .18); c.lineWidth = Math.max(1, W * .0011);
      for (let x = 0; x < W; x += W / 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
      for (let y = 0; y < H; y += H / 12) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
      c.strokeStyle = accent; c.lineWidth = Math.max(2, W * .002);
      c.beginPath(); c.moveTo(W * .50, H * .13); c.lineTo(W * .98, H * .13); c.moveTo(W * .50, H * .25); c.lineTo(W * .98, H * .25); c.stroke();
      c.fillStyle = accent; c.font = `900 ${18 * W / 1080}px Arial, sans-serif`; c.fillText("PHOTOGRAPHIC WORKS", W * .02, H * .59);
    } else if (data.style === "ici-electric") {
      const mist = c.createRadialGradient(W * .50, H * .50, W * .04, W * .50, H * .50, W * .55);
      mist.addColorStop(0, "#156eff"); mist.addColorStop(.42, "#245eff"); mist.addColorStop(.76, alpha("#6a7cf5", .64)); mist.addColorStop(1, alpha("#ffffff", 0));
      c.fillStyle = mist; c.fillRect(0, 0, W, H);
      c.fillStyle = "#11110f"; c.font = `400 ${46 * W / 1080}px Georgia, serif`;
      c.save(); c.translate(W * .035, H * .70); c.rotate(-Math.PI / 2); c.fillText("NOMADISM", 0, 0); c.restore();
      c.save(); c.translate(W * .965, H * .20); c.rotate(Math.PI / 2); c.fillText("SPIRITUAL", 0, 0); c.restore();
    } else if (data.style === "swiss") {
      c.fillStyle = "#76321f"; c.fillRect(W * .40, 0, W * .32, H * .58);
      c.fillStyle = "#e97dac"; c.beginPath(); c.moveTo(W * .66, H * .35); c.quadraticCurveTo(W * .78, H * .29, W * .84, H * .43); c.lineTo(W * .84, H * .78); c.lineTo(W * .62, H * .78); c.closePath(); c.fill();
      const cell = W / 16; c.fillStyle = "#f6f0dd";
      for (let row = 0; row < 7; row++) for (let col = 0; col < 16; col++) if ((row + col) % 2 === 0) c.fillRect(col * cell, H * .56 + row * cell, cell, cell);
      c.fillStyle = "#198946"; for (let row = 0; row < 7; row++) for (let col = 0; col < 16; col++) if ((row + col) % 2 === 1) c.fillRect(col * cell, H * .56 + row * cell, cell, cell);
    } else if (data.style === "editorial") {
      c.strokeStyle = "#11110f"; c.lineWidth = Math.max(2, W * .002);
      [[.03,.18,.97,.18],[.03,.58,.97,.58],[.03,.86,.97,.86]].forEach(([x1,y1,x2,y2])=>{c.beginPath();c.ellipse(W*(x1+x2)/2,H*(y1+y2)/2,W*(x2-x1)/2,H*.045,0,0,Math.PI*2);c.stroke();});
      c.fillStyle = alpha("#9b8d74", .11); for (let y = 0; y < H; y += 7) c.fillRect(0, y, W, 1);
      c.fillStyle = "#11110f"; c.font = `700 ${34 * W / 1080}px Georgia, serif`; c.fillText("MOSCOW DOES NOT", W * .02, H * .05); c.textAlign = "right"; c.fillText("BELIEVE IN TEARS", W * .98, H * .05); c.textAlign = "left";
    } else if (data.style === "collage") {
      c.fillStyle = "#050505"; c.beginPath(); c.arc(W * .50, H * .48, W * .38, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#998a84"; c.lineWidth = Math.max(4, W * .005);
      c.beginPath(); c.arc(-W * .08, H * .44, W * .30, 0, Math.PI * 2); c.stroke(); c.beginPath(); c.arc(W * 1.07, H * .44, W * .30, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#ffffff"; c.fillRect(W * .88, H * .06, W * .12, H * .12);
    } else if (data.style === "quiet") {
      c.strokeStyle = "#8e7f78"; c.lineWidth = Math.max(5, W * .006);
      [[-.05,.24,.30],[1.05,.26,.28],[-.02,.62,.34],[1.04,.65,.31]].forEach(([x,y,r])=>{c.beginPath();c.arc(W*x,H*y,W*r,0,Math.PI*2);c.stroke();});
      c.fillStyle = "#050505"; [[.40,.23,.33,.19],[.67,.52,.31,.17],[.52,.79,.34,.19]].forEach(([x,y,rx,ry])=>{c.beginPath();c.ellipse(W*x,H*y,W*rx,H*ry,0,0,Math.PI*2);c.fill();});
    } else if (data.style === "layout-lab") {
      c.fillStyle = "#11110f"; c.font = `300 ${40 * W / 1080}px Georgia, serif`;
      c.save(); c.translate(W * .03, H * .57); c.rotate(-Math.PI / 2); c.fillText("POEMS TRANSITION", 0, 0); c.restore();
      c.save(); c.translate(W * .97, H * .23); c.rotate(Math.PI / 2); c.fillText("POETRY / 2023", 0, 0); c.restore();
    } else if (data.style === "art-blue") {
      const sunset = c.createLinearGradient(0, 0, 0, H);
      sunset.addColorStop(0, "#f0ece8"); sunset.addColorStop(.16, "#ef4f27"); sunset.addColorStop(.28, "#476be7"); sunset.addColorStop(.40, "#f4f1ed"); sunset.addColorStop(.53, "#ed542c"); sunset.addColorStop(.69, "#4475e8"); sunset.addColorStop(.84, "#f4f0eb"); sunset.addColorStop(1, "#de3c22");
      c.fillStyle = sunset; c.fillRect(0, 0, W, H);
      c.strokeStyle = alpha("#ffffff", .78); c.lineWidth = Math.max(1, W * .001); for (let y = H * .12; y < H * .90; y += H * .14) { c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    } else if (data.style === "composition-atlas") {
      for (let i = 0; i < 7; i++) {
        const x = W * (i / 6); const col = c.createLinearGradient(x - W * .08, 0, x + W * .08, 0);
        col.addColorStop(0, alpha("#a5a7a8", .08)); col.addColorStop(.5, alpha("#ffffff", .72)); col.addColorStop(1, alpha("#929597", .12));
        c.fillStyle = col; c.fillRect(x - W * .12, 0, W * .24, H);
      }
      c.strokeStyle = alpha(accent, .28); c.lineWidth = Math.max(2, W * .002); for (let x = W * .10; x < W; x += W * .16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke(); }
    }
  }

  function drawFlatBlock(c, data, W, H, s, seed, theme, id, spec) {
    const transform = data.editorMode === "free" ? (data.blockTransforms?.[id] || {}) : {};
    const x = (Number.isFinite(transform.x) ? transform.x : spec.x) * W;
    const y = (Number.isFinite(transform.y) ? transform.y : spec.y) * H;
    const scale = clamp(Number(transform.scale) || 1, .38, 2.6);
    const w = spec.w * W, h = spec.h * H;
    const rotation = (Number(transform.rotation) || 0) * Math.PI / 180;
    c.save(); c.translate(x, y); c.rotate(rotation); c.scale(scale, scale);

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
    if (data.style === "white-studio") Object.assign(sizes, { kicker: 12, subtitle: 21, date: 38, venue: 20, body: 14, organizer: 18 });
    if (data.style === "ici-grid") Object.assign(sizes, { kicker: 18, subtitle: 28, date: 46, time: 17, venue: 15, body: 15, organizer: 17 });
    if (data.style === "ici-electric") Object.assign(sizes, { kicker: 12, subtitle: 34, date: 74, venue: 18, organizer: 13 });
    if (data.style === "swiss") Object.assign(sizes, { kicker: 13, date: 34, venue: 18, body: 13, organizer: 11 });
    if (data.style === "editorial") Object.assign(sizes, { kicker: 12, subtitle: 18, date: 27, venue: 15, body: 13, organizer: 10 });
    if (data.style === "collage") Object.assign(sizes, { kicker: 12, subtitle: 19, date: 32, venue: 16, body: 13, organizer: 10 });
    if (data.style === "quiet") Object.assign(sizes, { kicker: 12, subtitle: 16, date: 27, venue: 15, body: 12, organizer: 10 });
    if (data.style === "layout-lab") Object.assign(sizes, { kicker: 12, subtitle: 20, date: 36, venue: 18, body: 13, organizer: 10 });
    if (data.style === "art-blue") Object.assign(sizes, { kicker: 10, subtitle: 18, date: 24, venue: 12, organizer: 9 });
    if (data.style === "composition-atlas") Object.assign(sizes, { kicker: 12, subtitle: 42, date: 20, body: 12, organizer: 10 });
    const weights = { kicker: 800, subtitle: 750, date: 900, time: 750, venue: 760, body: 500, organizer: 800 };
    if (data.style === "neon-doodle") Object.assign(weights, { kicker: 850, subtitle: 900, date: 800, body: 600, organizer: 800 });
    const textStyle = data.editorMode === "free" ? (data.textStyles?.[id] || {}) : {};
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
    const dateUnderlineStyles = new Set(["workshop", "neon-doodle"]);
    if (id === "date" && dateUnderlineStyles.has(data.style)) c.fillRect(startX - (align === "right" ? w * .22 : 0), startY + fontSize + 10 * s, w * .22, Math.max(2, 3 * s));
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
    if (variant === "ring" || variant === "atlas") {
      c.beginPath(); c.arc(0, 0, Math.min(w, h) * .46, 0, Math.PI * 2); c.clip();
    } else {
      const squareVisuals = new Set(["will", "cosmos", "blue-mist", "playhouse", "soviet", "tide", "coffee", "poem", "sunset", "chains", "index", "caption", "type-study", "mono-photo", "ici-public"]);
      roundedRectPath(c, -w / 2, -h / 2, w, h, squareVisuals.has(variant) ? 0 : Math.min(w, h) * .025); c.clip();
    }
    if (image) {
      if (image.cutout) {
        const ratio = Math.min(w / image.img.naturalWidth, h / image.img.naturalHeight);
        const iw = image.img.naturalWidth * ratio, ih = image.img.naturalHeight * ratio;
        c.drawImage(image.img, -iw / 2, -ih / 2, iw, ih);
      } else coverImage(c, image.img, -w / 2, -h / 2, w, h);
    } else if (variant === "will") {
      c.fillStyle = "#6faed2"; c.fillRect(-w * .45, -h * .42, w * .84, h * .80);
      c.fillStyle = "#ef6e86"; c.fillRect(-w * .28, -h * .33, w * .57, h * .64);
      c.fillStyle = "#ff641b"; c.fillRect(-w * .12, -h * .22, w * .55, h * .50);
      c.fillStyle = "#76b9d2"; c.fillRect(-w * .28, -h * .08, w * .12, h * .35); c.fillRect(w * .13, -h * .08, w * .12, h * .35);
      c.fillStyle = "#f0527e"; c.fillRect(-w * .01, -h * .31, w * .12, h * .38);
    } else if (variant === "cosmos") {
      c.fillStyle = "#090909"; c.fillRect(-w / 2, -h / 2, w, h);
      const radius = Math.min(w, h) * .43; c.fillStyle = "#f2f2f2";
      for (let row = -15; row <= 15; row++) for (let col = -18; col <= 18; col++) {
        const nx = col / 18, ny = row / 15; const d = nx * nx + ny * ny;
        if (d > 1) continue;
        const wave = Math.sin((nx * 4 + ny * 2.4 + Math.sqrt(1 - d) * 7) * Math.PI);
        if (wave > .15) { c.globalAlpha = .25 + .75 * (1 - d); c.beginPath(); c.arc(nx * radius, ny * radius * .72, Math.max(1.2, w * .0038), 0, Math.PI * 2); c.fill(); }
      }
      c.globalAlpha = 1; c.strokeStyle = alpha("#f2f2f2", .45); c.lineWidth = Math.max(2, w * .003); c.beginPath(); c.ellipse(0, 0, radius * 1.15, radius * .47, -.12, 0, Math.PI * 2); c.stroke();
    } else if (variant === "blue-mist") {
      const orb = c.createRadialGradient(0, 0, 0, 0, 0, Math.min(w, h) * .52);
      orb.addColorStop(0, "#0f83f2"); orb.addColorStop(.38, "#1564ee"); orb.addColorStop(.72, alpha("#2264ef", .72)); orb.addColorStop(1, alpha("#ffffff", 0));
      c.fillStyle = orb; c.fillRect(-w / 2, -h / 2, w, h);
    } else if (variant === "playhouse") {
      c.fillStyle = "#f7f1df"; c.beginPath(); c.moveTo(-w * .44, -h * .28); c.lineTo(-w * .27, -h * .42); c.lineTo(-w * .12, -h * .27); c.lineTo(-w * .18, -h * .05); c.lineTo(-w * .39, -h * .08); c.closePath(); c.fill();
      c.fillStyle = "#11110f"; c.beginPath(); c.arc(-w * .28, -h * .22, Math.min(w, h) * .05, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#171715"; c.fillRect(-w * .14, h * .05, w * .22, h * .24); c.beginPath(); c.ellipse(-w * .03, h * .05, w * .12, h * .07, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#8b1f13"; c.beginPath(); c.ellipse(0, h * .29, w * .25, h * .08, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#171715"; c.lineWidth = Math.max(5, w * .01); c.strokeRect(w * .08, -h * .27, w * .24, h * .24);
    } else if (variant === "soviet") {
      c.fillStyle = "#11110f";
      const radius = Math.min(w, h) * .42;
      for (let y = -radius; y <= radius; y += Math.max(7, w * .018)) for (let x = -radius; x <= radius; x += Math.max(7, w * .018)) {
        const d = Math.hypot(x, y); if (d > radius || d < radius * .45) continue;
        const shift = Math.sin(y * .035) * radius * .13; c.beginPath(); c.arc(x + shift, y, Math.max(1.3, w * .006), 0, Math.PI * 2); c.fill();
      }
    } else if (variant === "tide") {
      const metal = c.createLinearGradient(-w * .35, -h * .4, w * .32, h * .35);
      metal.addColorStop(0, "#f8f8f8"); metal.addColorStop(.2, "#74787c"); metal.addColorStop(.43, "#ffffff"); metal.addColorStop(.62, "#85898d"); metal.addColorStop(.83, "#f6f6f5"); metal.addColorStop(1, "#34383c");
      c.fillStyle = metal; c.beginPath(); c.moveTo(-w * .24, -h * .46); c.bezierCurveTo(w * .35, -h * .44, w * .44, -h * .12, w * .22, h * .10); c.bezierCurveTo(w * .04, h * .28, w * .39, h * .45, 0, h * .48); c.bezierCurveTo(-w * .38, h * .44, -w * .29, h * .10, -w * .40, -h * .08); c.bezierCurveTo(-w * .50, -h * .24, -w * .38, -h * .38, -w * .24, -h * .46); c.fill();
      c.strokeStyle = alpha("#ffffff", .85); c.lineWidth = Math.max(3, w * .009); c.beginPath(); c.moveTo(-w * .19, -h * .28); c.bezierCurveTo(w * .12, -h * .35, w * .24, -h * .10, w * .10, h * .13); c.stroke();
    } else if (variant === "coffee") {
      c.fillStyle = "#050505"; c.beginPath(); c.ellipse(0, 0, w * .47, h * .43, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#f2ead2"; c.fillRect(-w * .47, -h * .10, w * .94, h * .22);
      c.strokeStyle = "#918079"; c.lineWidth = Math.max(5, w * .009); c.beginPath(); c.arc(0, 0, Math.min(w, h) * .34, 0, Math.PI * 2); c.stroke();
    } else if (variant === "poem") {
      const orb = c.createRadialGradient(0, -h * .05, 0, 0, -h * .05, Math.min(w, h) * .52);
      orb.addColorStop(0, "#28cdf5"); orb.addColorStop(.30, "#168bea"); orb.addColorStop(.62, "#1c64dc"); orb.addColorStop(.86, alpha("#466ce5", .55)); orb.addColorStop(1, alpha("#ffffff", 0));
      c.fillStyle = orb; c.fillRect(-w / 2, -h / 2, w, h);
    } else if (variant === "sunset") {
      // The sunset template's visual is carried by its full-bleed background.
    } else if (variant === "chains") {
      const marble = c.createLinearGradient(-w * .3, 0, w * .3, 0); marble.addColorStop(0, "#bfc1c2"); marble.addColorStop(.38, "#ffffff"); marble.addColorStop(.65, "#d8d9da"); marble.addColorStop(1, "#95989a");
      c.fillStyle = marble; c.beginPath(); c.arc(0, -h * .33, Math.min(w, h) * .13, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.moveTo(-w * .16, -h * .23); c.quadraticCurveTo(-w * .26, h * .04, -w * .21, h * .46); c.lineTo(w * .20, h * .46); c.quadraticCurveTo(w * .25, h * .06, w * .16, -h * .23); c.closePath(); c.fill();
      c.strokeStyle = "#888c90"; c.lineWidth = Math.max(2, w * .006); for (let i = -4; i <= 4; i++) { c.beginPath(); c.moveTo(i * w * .035, -h * .22); c.lineTo(i * w * .025, h * .38); c.stroke(); }
    } else if (variant === "electric") {
      drawFluidObject(c, -w / 2, -h / 2, w, h, theme.accent, seed, true);
    } else if (variant === "index") {
      c.fillStyle = "#d9d6cd"; c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = "#171715"; c.beginPath(); c.arc(w * .34, h * .30, Math.min(w, h) * .34, 0, Math.PI * 2); c.fill();
      c.fillStyle = theme.accent; c.fillRect(-w / 2, h * .31, w * .46, h * .11);
      c.strokeStyle = alpha("#171715", .45); c.lineWidth = Math.max(2, w * .004); c.beginPath(); c.moveTo(-w * .42, -h * .30); c.lineTo(w * .22, h * .23); c.stroke();
    } else if (variant === "caption") {
      const gradient = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      gradient.addColorStop(0, "#d8d7d1"); gradient.addColorStop(.52, "#9e9f9b"); gradient.addColorStop(1, "#4d4e4c");
      c.fillStyle = gradient; c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = alpha("#f1eee6", .72); c.beginPath(); c.moveTo(-w / 2, h * .18); c.quadraticCurveTo(-w * .05, -h * .09, w / 2, h * .03); c.lineTo(w / 2, h / 2); c.lineTo(-w / 2, h / 2); c.closePath(); c.fill();
      c.fillStyle = "#1d1d1b"; c.fillRect(w * .26, -h * .37, w * .025, h * .55);
    } else if (variant === "type-study") {
      c.fillStyle = theme.accent; c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = "#171715"; c.beginPath(); c.arc(w * .37, h * .28, Math.min(w, h) * .46, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#f2ede2"; c.font = `700 ${Math.min(w, h) * .64}px Georgia, serif`; c.textAlign = "left"; c.textBaseline = "middle"; c.fillText("A", -w * .43, h * .07);
      c.strokeStyle = "#f2ede2"; c.lineWidth = Math.max(3, w * .009); c.beginPath(); c.moveTo(-w * .43, h * .32); c.lineTo(w * .11, h * .32); c.stroke();
    } else if (variant === "mono-photo") {
      const gradient = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      gradient.addColorStop(0, "#171715"); gradient.addColorStop(.32, "#6b6b68"); gradient.addColorStop(.66, "#deded9"); gradient.addColorStop(1, "#8b8b87");
      c.fillStyle = gradient; c.fillRect(-w / 2, -h / 2, w, h);
      c.fillStyle = alpha("#f3f3f0", .68); c.beginPath(); c.moveTo(-w * .18, -h / 2); c.bezierCurveTo(w * .02, -h * .12, -w * .02, h * .08, w * .25, h / 2); c.lineTo(w / 2, h / 2); c.lineTo(w * .12, -h / 2); c.closePath(); c.fill();
      c.fillStyle = "#11110f"; c.fillRect(-w * .48, h * .34, w * .22, h * .08);
    } else if (variant === "ici-public") {
      c.fillStyle = theme.accent; c.fillRect(-w / 2, -h / 2, w, h);
      c.strokeStyle = "#151513"; c.lineWidth = Math.max(6, w * .035); c.beginPath(); c.arc(0, -h * .05, Math.min(w, h) * .27, 0, Math.PI * 2); c.stroke();
      c.fillStyle = "#151513"; c.font = `900 ${Math.min(w, h) * .22}px Arial, sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("01", 0, h * .34);
      c.fillStyle = "#f4f4ef"; c.fillRect(-w * .42, -h * .40, w * .14, w * .14);
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
    const instances = data.decorations.slice(0, 32);
    const base = W / 1080;
    const anchors = [
      [.08, .14], [.77, .12], [.12, .72], [.78, .70],
      [.43, .08], [.44, .84], [.03, .43], [.83, .40]
    ];

    instances.forEach((instance, index) => {
      const type = materialType(instance);
      const instanceId = materialId(instance, index);
      if (!type) return;
      const random = mulberry32(seed ^ hashString(`${type}-${instanceId}-${index}`));
      const anchor = anchors[(index + Math.floor(random() * anchors.length)) % anchors.length];
      const autoX = (anchor[0] + (random() - .5) * .12) * W;
      const autoY = (anchor[1] + (random() - .5) * .10) * H;
      const transform = data.materialTransforms?.[instanceId] || {};
      const x = Number.isFinite(transform.x) ? transform.x * W : autoX;
      const y = Number.isFinite(transform.y) ? transform.y * H : autoY;
      const elementScale = clamp(Number(transform.scale) || 1, .4, 2.5);
      const unit = base * (.82 + random() * .38) * elementScale;
      const rotation = (Number(transform.rotation) || 0) * Math.PI / 180;
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
        c.globalAlpha = .98;
        c.strokeStyle = "#3c55d8";
        c.lineWidth = 38 * unit;
        c.lineCap = "round";
        c.lineJoin = "round";
        c.beginPath(); c.moveTo(-105 * unit, 0); c.lineTo(72 * unit, 0); c.stroke();
        c.beginPath(); c.moveTo(32 * unit, -58 * unit); c.lineTo(94 * unit, 0); c.lineTo(32 * unit, 58 * unit); c.stroke();
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
        interactiveHitAreas.push({ kind: "material", id: instanceId, type, x, y, radius: baseRadius * unit });
      }
    });
  }

  function drawEmojiStickers(c, data, W, H) {
    const base = W / 1080;
    data.emojiStickers.slice(0, 32).forEach((sticker, index) => {
      const random = mulberry32(hashString(`${sticker.id}-${sticker.emoji}`));
      const autoX = (.12 + random() * .76) * W;
      const autoY = (.13 + random() * .74) * H;
      const x = Number.isFinite(sticker.x) ? sticker.x * W : autoX;
      const y = Number.isFinite(sticker.y) ? sticker.y * H : autoY;
      const scale = clamp(Number(sticker.scale) || 1, .4, 2.8);
      const size = 92 * base * scale;
      const rotation = Number.isFinite(sticker.rotation) ? sticker.rotation : 0;
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
      const count = state.decorations.filter((entry) => materialType(entry) === card.dataset.material).length;
      const editingInstance = activeElement?.kind === "material" ? findMaterialInstance(activeElement.id) : null;
      card.classList.toggle("active", count > 0);
      card.classList.toggle("editing", materialType(editingInstance) === card.dataset.material);
      card.setAttribute("aria-pressed", String(count > 0));
      card.dataset.count = String(count);
      card.title = count ? `已添加 ${count} 个；点击再添加一个` : "点击添加一个";
    });
    renderBlockControls();
    updateMaterialScaleLabel();
    updateMaterialRotationLabel();
    updateElementEditor();
    updateTypographyEditor();
    renderExtraTextList();
    renderPsdLayerPanel();
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
    if (state.editorMode !== "free") {
      showToast("成品模式已锁定核心版式；切换到自由模式后可移动这些部件");
      return;
    }
    if (state.hiddenBlocks.includes(id)) state.hiddenBlocks = state.hiddenBlocks.filter((item) => item !== id);
    activeElement = { kind: "block", id };
    renderMaterials();
    scheduleRender();
    showToast(`已选中“${BLOCK_LABELS[id]}”，可在海报上直接拖动`);
  }

  function updateTypographyEditor() {
    const editor = $("#typography-editor");
    if (!editor) return;
    const editable = state.editorMode === "free" && activeElement?.kind === "block" && TEXT_BLOCK_IDS.includes(activeElement.id) && !state.hiddenBlocks.includes(activeElement.id);
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
    if (!Array.isArray(state.decorations)) state.decorations = [];
    if (state.decorations.length >= 32) { showToast("一张海报最多添加 32 个拼贴素材"); return; }
    const instance = createMaterialInstance(material);
    state.decorations = [...state.decorations, instance];
    activeElement = { kind: "material", id: instance.id };
    const count = state.decorations.filter((entry) => materialType(entry) === material).length;
    renderMaterials();
    scheduleRender();
    showToast(`已添加“${MATERIAL_LABELS[material]}”${count > 1 ? `（第 ${count} 个）` : ""}，可直接拖动`);
  }

  function randomizeMaterials() {
    const choices = $$(".material-card").map((card) => card.dataset.material);
    const random = mulberry32(Date.now() ^ state.seed);
    const shuffled = [...choices].sort(() => random() - .5);
    const count = 3 + Math.floor(random() * 3);
    state.decorations = shuffled.slice(0, count).map((type) => createMaterialInstance(type));
    state.materialTransforms = Object.fromEntries(state.decorations.map((entry) => [entry.id, {
      rotation: Math.round((random() - .5) * 32)
    }]));
    activeElement = { kind: "material", id: state.decorations[0].id };
    state.seed = Math.floor(Math.random() * 99999);
    renderMaterials();
    scheduleRender();
    showToast(`已组合 ${count} 种拼贴素材`);
  }

  function addEmojiSticker(emoji) {
    if (!Array.isArray(state.emojiStickers)) state.emojiStickers = [];
    if (state.emojiStickers.length >= 24) { showToast("一张海报最多添加 24 个 Emoji"); return; }
    const id = `emoji-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
    const sticker = { id, emoji, scale: 1, rotation: 0 };
    state.emojiStickers = [...state.emojiStickers, sticker];
    activeElement = { kind: "emoji", id };
    renderMaterials();
    scheduleRender();
    showToast(`已添加 ${emoji}，可在海报上直接拖动`);
  }

  function renderPsdLayerPanel() {
    const panel = $("#psd-layer-panel");
    const container = $("#psd-layer-list");
    const template = currentPsdTemplate();
    const isPsd = Boolean(template);
    document.body.classList.toggle("psd-template-active", isPsd);
    if (!panel || !container) return;
    panel.hidden = !isPsd;
    if (!isPsd) { container.innerHTML = ""; return; }
    if (!state.psdLayerOverrides || typeof state.psdLayerOverrides !== "object") state.psdLayerOverrides = {};
    container.innerHTML = "";
    [...template.layers].reverse().forEach((layer) => {
      const override = psdLayerOverride(layer.id);
      const item = document.createElement("div");
      item.className = "psd-layer-item";
      item.classList.toggle("editing", activeElement?.kind === "psd-layer" && activeElement.id === layer.id);
      item.classList.toggle("is-hidden", override.hidden === true);
      item.dataset.layerId = layer.id;
      const typeLabel = layer.type === "type" ? "文字" : layer.type === "smartobject" ? "图像" : "图形";
      item.innerHTML = `
        <button class="psd-layer-visibility" type="button" title="显示或隐藏图层" aria-label="显示或隐藏 ${escapeHtml(layer.name)}">${override.hidden ? "○" : "●"}</button>
        <div class="psd-layer-main">
          <div class="psd-layer-label" role="button" tabindex="0"><b>${escapeHtml(layer.name)}</b><small>${typeLabel}</small></div>
          ${layer.type === "type" ? `<textarea class="psd-layer-text" maxlength="500" aria-label="编辑 ${escapeHtml(layer.name)}">${escapeHtml(override.text ?? layer.text ?? "")}</textarea>` : ""}
        </div>`;
      const activate = () => {
        activeElement = { kind: "psd-layer", id: layer.id };
        $$(".psd-layer-item", container).forEach((entry) => entry.classList.toggle("editing", entry.dataset.layerId === layer.id));
        updateMaterialScaleLabel();
        updateMaterialRotationLabel();
        updateElementEditor();
        renderPreview();
      };
      $(".psd-layer-label", item).addEventListener("click", activate);
      $(".psd-layer-label", item).addEventListener("keydown", (event) => { if (event.key === "Enter" || event.key === " ") activate(); });
      $(".psd-layer-visibility", item).addEventListener("click", () => {
        const next = { ...psdLayerOverride(layer.id), hidden: !psdLayerOverride(layer.id).hidden };
        if (!next.hidden) delete next.hidden;
        state.psdLayerOverrides = { ...state.psdLayerOverrides, [layer.id]: next };
        renderPsdLayerPanel();
        scheduleRender();
      });
      $(".psd-layer-text", item)?.addEventListener("focus", activate);
      $(".psd-layer-text", item)?.addEventListener("input", (event) => {
        const next = { ...psdLayerOverride(layer.id), text: event.currentTarget.value };
        if (next.text === layer.text) delete next.text;
        state.psdLayerOverrides = { ...state.psdLayerOverrides, [layer.id]: next };
        activeElement = { kind: "psd-layer", id: layer.id };
        scheduleRender();
      });
      container.appendChild(item);
    });
  }

  function renderExtraTextList() {
    const container = $("#extra-text-list");
    if (!container) return;
    if (!Array.isArray(state.extraTextBoxes)) state.extraTextBoxes = [];
    container.innerHTML = "";
    if (!state.extraTextBoxes.length) {
      const empty = document.createElement("div");
      empty.className = "extra-text-empty";
      empty.textContent = "还没有补充文本。适合放注释、标签或一句强调语。";
      container.appendChild(empty);
    }
    const visibleLimit = state.editorMode === "free" ? 8 : 3;
    state.extraTextBoxes.slice(0, visibleLimit).forEach((box, index) => {
      const item = document.createElement("div");
      item.className = "extra-text-item";
      item.dataset.extraTextId = box.id;
      item.classList.toggle("editing", activeElement?.kind === "extra-text" && activeElement.id === box.id);
      item.innerHTML = `
        <span class="extra-text-index">T${String(index + 1).padStart(2, "0")}</span>
        <input class="extra-text-input" value="${escapeHtml(box.text)}" maxlength="120" aria-label="补充文本 ${index + 1}">
        <select class="extra-text-preset" aria-label="补充文本 ${index + 1} 样式">
          <option value="caption"${box.preset === "caption" ? " selected" : ""}>注释</option>
          <option value="label"${box.preset === "label" ? " selected" : ""}>标签</option>
          <option value="statement"${box.preset === "statement" ? " selected" : ""}>强调</option>
        </select>
        <button class="extra-text-remove" type="button" aria-label="删除补充文本 ${index + 1}">×</button>`;
      const activate = () => {
        activeElement = { kind: "extra-text", id: box.id };
        $$(".extra-text-item", container).forEach((entry) => entry.classList.toggle("editing", entry.dataset.extraTextId === box.id));
        updateMaterialScaleLabel();
        updateMaterialRotationLabel();
        updateElementEditor();
        renderPreview();
      };
      $(".extra-text-input", item).addEventListener("focus", activate);
      $(".extra-text-input", item).addEventListener("input", (event) => {
        box.text = event.currentTarget.value;
        activeElement = { kind: "extra-text", id: box.id };
        scheduleRender();
      });
      $(".extra-text-preset", item).addEventListener("change", (event) => {
        box.preset = event.currentTarget.value;
        activeElement = { kind: "extra-text", id: box.id };
        renderMaterials();
        scheduleRender();
      });
      $(".extra-text-remove", item).addEventListener("click", () => {
        state.extraTextBoxes = state.extraTextBoxes.filter((entry) => entry.id !== box.id);
        if (activeElement?.kind === "extra-text" && activeElement.id === box.id) activeElement = null;
        syncEditorMode();
        renderMaterials();
        scheduleRender();
      });
      item.addEventListener("click", (event) => {
        if (!event.target.closest("button, input, select")) activate();
      });
      container.appendChild(item);
    });
    const addButton = $("#add-text-box-btn");
    if (addButton) addButton.disabled = state.extraTextBoxes.length >= (state.editorMode === "free" ? 8 : 3);
  }

  function addExtraTextBox() {
    if (!Array.isArray(state.extraTextBoxes)) state.extraTextBoxes = [];
    const limit = state.editorMode === "free" ? 8 : 3;
    if (state.extraTextBoxes.length >= limit) {
      showToast(state.editorMode === "free" ? "一张海报最多添加 8 个文本框" : "成品模式最多添加 3 个文本框，避免破坏信息层级");
      return;
    }
    extraTextSerial += 1;
    const index = state.extraTextBoxes.length;
    const box = {
      id: `extra-text-${Date.now().toString(36)}-${extraTextSerial.toString(36)}`,
      text: "补充文字",
      preset: index === 1 ? "label" : index === 2 ? "statement" : "caption",
      x: .18 + (index % 3) * .08,
      y: .84 - (index % 3) * .07,
      scale: 1,
      rotation: 0
    };
    state.extraTextBoxes = [...state.extraTextBoxes, box];
    activeElement = { kind: "extra-text", id: box.id };
    syncEditorMode();
    renderMaterials();
    scheduleRender();
    requestAnimationFrame(() => $(".extra-text-item.editing .extra-text-input")?.select());
    showToast("已添加文本框，可直接输入并在海报上拖动");
  }

  function updateElementEditor() {
    const editor = $("#element-editor");
    const hint = $("#drag-hint");
    if (!editor || !hint) return;
    const exists = activeElement?.kind === "material"
      ? Boolean(findMaterialInstance(activeElement.id))
      : activeElement?.kind === "emoji"
        ? state.emojiStickers.some((item) => item.id === activeElement.id)
        : activeElement?.kind === "extra-text"
          ? Boolean(findExtraTextBox(activeElement.id))
          : activeElement?.kind === "psd-layer"
            ? Boolean(findPsdLayer(activeElement.id) && !psdLayerOverride(activeElement.id).hidden)
            : activeElement?.kind === "block" && !state.hiddenBlocks.includes(activeElement.id);
    if (!exists) activeElement = null;
    const editable = elementCanBeEdited(activeElement);
    editor.hidden = !editable;
    hint.hidden = !editable;
    canvas.classList.toggle("can-drag", editable);
    if (!activeElement) return;
    const materialInstance = activeElement.kind === "material" ? findMaterialInstance(activeElement.id) : null;
    const sticker = activeElement.kind === "emoji" ? state.emojiStickers.find((item) => item.id === activeElement.id) : null;
    const name = activeElement.kind === "material" ? MATERIAL_LABELS[materialType(materialInstance)]
      : activeElement.kind === "block" ? BLOCK_LABELS[activeElement.id]
        : activeElement.kind === "extra-text" ? "补充文本"
          : activeElement.kind === "psd-layer" ? (findPsdLayer(activeElement.id)?.name || "PSD 图层")
            : `${sticker?.emoji || "Emoji"} Emoji`;
    $("#active-element-name").textContent = name;
    hint.textContent = `拖动${name}调整位置`;
  }

  function updateActiveElementScale(direction) {
    if (!elementCanBeEdited(activeElement)) return;
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
    } else if (activeElement.kind === "extra-text") {
      state.extraTextBoxes = state.extraTextBoxes.map((box) => box.id === activeElement.id
        ? { ...box, scale: clamp((Number(box.scale) || 1) + direction * .12, .4, 2.8) }
        : box);
    } else if (activeElement.kind === "psd-layer") {
      const current = psdLayerOverride(activeElement.id);
      state.psdLayerOverrides = { ...state.psdLayerOverrides, [activeElement.id]: { ...current, scale: clamp((Number(current.scale) || 1) + direction * .12, .15, 4) } };
    } else {
      const current = state.blockTransforms?.[activeElement.id] || {};
      state.blockTransforms = {
        ...(state.blockTransforms || {}),
        [activeElement.id]: { ...current, scale: clamp((Number(current.scale) || 1) + direction * .12, .38, 2.6) }
      };
    }
    updateMaterialScaleLabel();
    scheduleRender();
  }

  function setActiveMaterialScale(percent) {
    if (!elementCanBeEdited(activeElement) || !["material", "emoji", "extra-text", "psd-layer"].includes(activeElement.kind)) return;
    const minScale = activeElement.kind === "psd-layer" ? .15 : .4;
    const maxScale = activeElement.kind === "psd-layer" ? 4 : activeElement.kind === "material" ? 2.5 : 2.8;
    const scale = clamp((Number(percent) || 100) / 100, minScale, maxScale);
    if (activeElement.kind === "material") {
      const current = state.materialTransforms?.[activeElement.id] || {};
      state.materialTransforms = { ...(state.materialTransforms || {}), [activeElement.id]: { ...current, scale } };
    } else if (activeElement.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.map((sticker) => sticker.id === activeElement.id ? { ...sticker, scale } : sticker);
    } else if (activeElement.kind === "extra-text") {
      state.extraTextBoxes = state.extraTextBoxes.map((box) => box.id === activeElement.id ? { ...box, scale } : box);
    } else {
      const current = psdLayerOverride(activeElement.id);
      state.psdLayerOverrides = { ...state.psdLayerOverrides, [activeElement.id]: { ...current, scale } };
    }
    updateMaterialScaleLabel();
    scheduleRender();
  }

  function setActiveElementRotation(degrees) {
    if (!elementCanBeEdited(activeElement)) return;
    const angle = clamp(Number(degrees) || 0, -180, 180);
    if (activeElement.kind === "material" && findMaterialInstance(activeElement.id)) {
      const current = state.materialTransforms?.[activeElement.id] || {};
      state.materialTransforms = {
        ...(state.materialTransforms || {}),
        [activeElement.id]: { ...current, rotation: angle }
      };
    } else if (activeElement.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.map((sticker) => sticker.id === activeElement.id
        ? { ...sticker, rotation: angle * Math.PI / 180 }
        : sticker);
    } else if (activeElement.kind === "extra-text" && findExtraTextBox(activeElement.id)) {
      state.extraTextBoxes = state.extraTextBoxes.map((box) => box.id === activeElement.id ? { ...box, rotation: angle } : box);
    } else if (activeElement.kind === "block" && !state.hiddenBlocks.includes(activeElement.id)) {
      const current = state.blockTransforms?.[activeElement.id] || {};
      state.blockTransforms = {
        ...(state.blockTransforms || {}),
        [activeElement.id]: { ...current, rotation: angle }
      };
    } else if (activeElement.kind === "psd-layer" && findPsdLayer(activeElement.id)) {
      const current = psdLayerOverride(activeElement.id);
      state.psdLayerOverrides = { ...state.psdLayerOverrides, [activeElement.id]: { ...current, rotation: angle } };
    } else return;
    updateMaterialRotationLabel();
    scheduleRender();
  }

  function resetActiveElementPosition() {
    if (!elementCanBeEdited(activeElement)) return;
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
    } else if (activeElement.kind === "extra-text") {
      const index = state.extraTextBoxes.findIndex((box) => box.id === activeElement.id);
      state.extraTextBoxes = state.extraTextBoxes.map((box) => box.id === activeElement.id
        ? { ...box, x: .18 + (Math.max(0, index) % 3) * .08, y: .84 - (Math.max(0, index) % 3) * .07 }
        : box);
    } else if (activeElement.kind === "psd-layer") {
      const current = { ...psdLayerOverride(activeElement.id) };
      delete current.x; delete current.y;
      state.psdLayerOverrides = { ...state.psdLayerOverrides, [activeElement.id]: current };
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
    if (!elementCanBeEdited(activeElement)) return;
    if (activeElement.kind === "material") {
      state.decorations = state.decorations.filter((entry, index) => materialId(entry, index) !== activeElement.id);
      const transforms = { ...(state.materialTransforms || {}) }; delete transforms[activeElement.id]; state.materialTransforms = transforms;
    } else if (activeElement.kind === "emoji") {
      state.emojiStickers = state.emojiStickers.filter((sticker) => sticker.id !== activeElement.id);
    } else if (activeElement.kind === "extra-text") {
      state.extraTextBoxes = state.extraTextBoxes.filter((box) => box.id !== activeElement.id);
      syncEditorMode();
    } else if (activeElement.kind === "psd-layer") {
      const current = psdLayerOverride(activeElement.id);
      state.psdLayerOverrides = { ...state.psdLayerOverrides, [activeElement.id]: { ...current, hidden: true } };
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
    } else if (element.kind === "extra-text") {
      state.extraTextBoxes = state.extraTextBoxes.map((box) => box.id === element.id ? { ...box, x: nx, y: ny } : box);
    } else if (element.kind === "psd-layer") {
      const current = psdLayerOverride(element.id);
      state.psdLayerOverrides = { ...state.psdLayerOverrides, [element.id]: { ...current, x: nx, y: ny } };
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
    const candidate = { kind: hit.kind, id: hit.id };
    if (!elementCanBeEdited(candidate)) {
      showToast("成品模式已锁定核心构图；补充文本仍可直接拖动");
      return;
    }
    event.preventDefault();
    activeElement = candidate;
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
    if (!elementCanBeEdited(activeElement)) return;
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
      decorations: JSON.parse(JSON.stringify(state.decorations || [])),
      materialTransforms: JSON.parse(JSON.stringify(state.materialTransforms || {})),
      emojiStickers: JSON.parse(JSON.stringify(state.emojiStickers || [])),
      extraTextBoxes: JSON.parse(JSON.stringify(state.extraTextBoxes || [])),
      psdLayerOverrides: JSON.parse(JSON.stringify(state.psdLayerOverrides || {})),
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
      extraTextBoxes: [],
      psdLayerOverrides: {},
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
      decorations: [{ id: "neon-blob-main", type: "neon-blob" }],
      materialTransforms: {
        "neon-blob-main": { x: .84, y: .80, scale: 1.68 }
      },
      emojiStickers: [],
      extraTextBoxes: [],
      psdLayerOverrides: {},
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
    const materialWorkspace = normalizeMaterialWorkspace({
      decorations: JSON.parse(JSON.stringify(snapshot.decorations || [])),
      materialTransforms: JSON.parse(JSON.stringify(snapshot.materialTransforms || {}))
    });
    state.decorations = materialWorkspace.decorations;
    state.materialTransforms = materialWorkspace.materialTransforms;
    state.emojiStickers = JSON.parse(JSON.stringify(snapshot.emojiStickers || []));
    state.extraTextBoxes = normalizeExtraTextBoxes(snapshot.extraTextBoxes);
    state.psdLayerOverrides = normalizePsdLayerOverrides(snapshot.psdLayerOverrides);
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
    renderExtraTextList();
    updateMaterialScaleLabel();
    updateMaterialRotationLabel();
    updateElementEditor();
    updateTypographyEditor();
  }

  function selectStyle(style, applyPalette = true) {
    if (!ACTIVE_STYLE_IDS.includes(style)) style = "white-studio";
    const previousStyle = state.style;
    const styleChanged = previousStyle !== style;
    if (styleChanged && previousStyle !== "teacher-workshop") saveStyleDraft(previousStyle);
    if (previousStyle === "teacher-workshop" && style !== "teacher-workshop") {
      state.teacherWorkshopDraft = captureWorkspace();
      const returnWorkspace = state.teacherWorkshopReturn;
      if (returnWorkspace) applyWorkspace(returnWorkspace);
      state.teacherWorkshopReturn = null;
    }
    if (previousStyle !== "teacher-workshop" && style === "teacher-workshop") {
      state.teacherWorkshopReturn = captureWorkspace();
      applyWorkspace(state.teacherWorkshopDraft || createTeacherWorkspace());
      state.format = "story";
      state.accent = STYLE_DEFAULTS[style].accent;
      state.background = STYLE_DEFAULTS[style].background;
      zoomMultiplier = 1;
    }
    if (styleChanged && style !== "teacher-workshop") {
      const draft = state.styleDrafts?.[style] || null;
      applyStyleDraft(style, draft);
      if (!draft && applyPalette) {
        state.accent = STYLE_DEFAULTS[style].accent;
        state.background = STYLE_DEFAULTS[style].background;
      }
      zoomMultiplier = 1;
    }
    state.style = style;
    ensurePsdTemplateLoaded(style);
    if (state.editorMode !== "free") {
      const policy = TEMPLATE_POLICIES[style] || TEMPLATE_POLICIES["white-studio"];
      if (state.format !== policy.format) {
        state.format = policy.format;
        zoomMultiplier = 1;
      }
    }
    if (styleChanged) {
      activeElement = null;
      syncWorkspaceFields();
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
    renderPsdLayerPanel();
    syncEditorMode();
    if (activeElement?.kind === "block" && activeElement.id === "courses" && style !== "teacher-workshop") activeElement = null;
    renderMaterials();
    state.seed = Math.floor(Math.random() * 99999);
    scheduleRender();
  }

  function randomizeLayout() {
    if (state.editorMode !== "free") {
      showToast("成品模式使用稳定版式；切换到自由模式后可以生成变体");
      return;
    }
    state.seed = Math.floor(Math.random() * 99999);
    scheduleRender();
    showToast("已根据相同内容生成一个新的版式变体");
  }

  function randomizeStyle() {
    const styles = ACTIVE_STYLE_IDS.filter((style) => style !== state.style);
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
    state = { ...defaultState, decorations: [], materialTransforms: {}, emojiStickers: [], extraTextBoxes: [], blockTransforms: {}, textStyles: {}, hiddenBlocks: [], psdLayerOverrides: {}, styleDrafts: {}, workshopCourses: DEFAULT_COURSES.map((course) => ({ ...course })) };
    state.format = currentPsdTemplate(state.style) ? "psd" : state.format;
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
    if (state.editorMode === "free") {
      const point = canvasPoint({ clientX, clientY });
      activeElement = { kind: "block", id: "visual" };
      setElementPosition(activeElement, point.x, point.y);
    } else activeElement = null;
    draggingAssetIndex = null;
    renderAssets();
    renderMaterials();
    renderPreview();
    saveState();
    showToast(state.editorMode === "free" ? "图片已放到海报中，可继续拖动和缩放" : "图片已替换主图，并按模板规则自动就位");
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
    const psdTemplate = currentPsdTemplate();
    if (psdTemplate) {
      ensurePsdTemplateLoaded(state.style);
      const pending = [psdTemplate.preview, psdTemplate.base, ...psdTemplate.layers.map((layer) => layer.src)]
        .some((src) => !psdImageCache.get(src)?.complete);
      if (pending) {
        showToast("原始 PSD 图层仍在读取，请稍候再导出");
        return;
      }
    }
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
    $$('[data-editor-mode]').forEach((button) => button.addEventListener("click", () => setEditorMode(button.dataset.editorMode)));
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
    $("#reset-psd-layers-btn").addEventListener("click", () => {
      state.psdLayerOverrides = {};
      activeElement = null;
      renderPsdLayerPanel();
      renderMaterials();
      scheduleRender();
      showToast("已恢复这款 PSD 的原始图层与文字");
    });
    $("#add-text-box-btn").addEventListener("click", addExtraTextBox);
    $("#export-btn").addEventListener("click", exportPoster);
    $("#element-smaller-btn").addEventListener("click", () => updateActiveElementScale(-1));
    $("#element-larger-btn").addEventListener("click", () => updateActiveElementScale(1));
    $("#element-reset-btn").addEventListener("click", resetActiveElementPosition);
    $("#element-remove-btn").addEventListener("click", removeActiveElement);
    $("#material-scale").addEventListener("input", (event) => setActiveMaterialScale(Number(event.currentTarget.value)));
    $("#material-rotation").addEventListener("input", (event) => setActiveElementRotation(Number(event.currentTarget.value)));
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
      if (!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key) && elementCanBeEdited(activeElement)) {
        event.preventDefault();
        const step = event.shiftKey ? .025 : .006;
        nudgeActiveElement(event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0, event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0);
      }
      if (!/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) && (event.key === "Delete" || event.key === "Backspace") && elementCanBeEdited(activeElement)) { event.preventDefault(); removeActiveElement(); }
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
