/* =====================================================
   胡闹厨房 · 菜谱本
   功能：
   1. 添加 / 编辑 / 删除菜式（配料、时间、方式、难度、做法）
   2. 🖼️ 配图上传（自动压缩后存 localStorage）
   3. 🎁 盲盒抽菜（随机选一道菜）
   4. 🧺 点菜系统（点单清单 + 数量增减，持久化）
   ===================================================== */

(function () {
  "use strict";

  const STORAGE_KEY = "cookbook.recipes.v1";
  const ORDER_KEY = "cookbook.order.v1";
  const CHECKIN_KEY = "cookbook.checkins.v1";
  const CHEFS_KEY = "cookbook.chefs.v1";
  const CHEF_CURRENT_KEY = "cookbook.currentChef.v1";
  const WEATHER_KEY = "cookbook.weather.v1";
  const DEFAULT_CHEF_ID = "chef-1";
  const WEATHER_CACHE_MS = 30 * 60 * 1000; // 天气缓存 30 分钟

  /* ---------- 常量选项 ---------- */
  const EMOJI_OPTIONS = [
    "🍅", "🥚", "🍳", "🥩", "🍗", "🍖", "🐟", "🦐", "🦀",
    "🥦", "🥕", "🌽", "🍆", "🥔", "🍄", "🥬", "🌶️", "🧄",
    "🍚", "🍜", "🍝", "🍲", "🥘", "🍛", "🥟", "🍤", "🍙",
    "🍰", "🧁", "🍮", "🍩", "🍪", "🍓", "🍋", "🥑", "🍵"
  ];

  const METHOD_OPTIONS = [
    "🔥 炒", "♨️ 蒸", "💧 煮", "🔥 烤", "🍯 炖",
    "🫧 焖", "🥗 凉拌", "🫕 煎", "🍢 炸", "✨ 其他"
  ];

  const CHEF_EMOJIS = [
    "👨‍🍳", "👩‍🍳", "🧑‍🍳", "🐻", "🐱", "🐶", "🦊", "🐼",
    "🐰", "🐨", "🦁", "🐯", "🐸", "🐷", "🐮", "🐔",
    "🐹", "🐭", "🦄", "🐙", "🐢", "🐳", "🦉", "🐝"
  ];

  const AVATAR_COLORS = [
    "#ffd6e4", "#ffe9c9", "#d8f3dc", "#cfe8ff",
    "#e6d5f5", "#fff3b0", "#ffd8d8", "#d9f0e8"
  ];

  const CATEGORY_OPTIONS = [
    { value: "菜式", emoji: "🍽️" },
    { value: "主食", emoji: "🍚" },
    { value: "汤品", emoji: "🍲" },
    { value: "饮品", emoji: "🥤" },
    { value: "水果", emoji: "🍎" },
    { value: "甜品", emoji: "🍰" }
  ];

  const TITLE_TIERS = [
    { min: 0, title: "厨房新手", emoji: "🐣" },
    { min: 50, title: "小厨学徒", emoji: "🍳" },
    { min: 150, title: "家常大厨", emoji: "👨‍🍳" },
    { min: 300, title: "美食达人", emoji: "🌟" },
    { min: 500, title: "星级主厨", emoji: "⭐" },
    { min: 800, title: "厨神", emoji: "👑" },
    { min: 1200, title: "传说大厨", emoji: "🏆" }
  ];

  /* ---------- DOM ---------- */
  const $ = (id) => document.getElementById(id);

  const dishForm     = $("dishForm");
  const editIdInput  = $("editId");
  const nameInput    = $("dishName");
  const emojiSelect  = $("dishEmoji");
  const timeInput    = $("dishTime");
  const methodSelect = $("dishMethod");
  const levelSelect  = $("dishLevel");
  const categorySelect = $("dishCategory");
  const stepsInput   = $("dishSteps");
  const ingListEl    = $("ingredientList");
  const addIngBtn    = $("addIngredientBtn");
  const cancelEdit   = $("cancelEditBtn");
  const toggleFormBtn = $("toggleFormBtn");
  const formWrap      = $("formWrap");
  const formCloseBtn  = $("formCloseBtn");
  const formWrapTitle = $("formWrapTitle");
  const recipeGrid   = $("recipeGrid");
  const emptyState   = $("emptyState");
  const searchInput  = $("searchInput");
  const countBadge   = $("countBadge");
  const toastEl      = $("toast");
  const modalMask    = $("modalMask");
  const modalName    = $("modalDishName");
  const modalCancel  = $("modalCancel");
  const modalConfirm = $("modalConfirm");

  // 配图
  const imageInput     = $("imageInput");
  const imgUpload      = $("imgUpload");
  const imagePreview   = $("imagePreview");
  const imgPlaceholder = $("imgPlaceholder");
  const removeImageBtn = $("removeImageBtn");

  // 盲盒
  const blindBoxBtn  = $("blindBoxBtn");
  const blindModal   = $("blindModal");
  const blindStage   = $("blindStage");
  const blindEmoji   = $("blindEmoji");
  const blindTitle   = $("blindTitle");
  const blindResult  = $("blindResult");
  const blindClose   = $("blindClose");
  const blindAgain   = $("blindAgain");
  const blindOrder   = $("blindOrder");

  // 点菜
  const cartFab    = $("cartFab");
  const cartCount  = $("cartCount");
  const cartDrawer = $("cartDrawer");
  const cartClose  = $("cartClose");
  const cartList   = $("cartList");
  const cartTotal  = $("cartTotal");
  const cartClear  = $("cartClear");

  // 做菜模式
  const cookModal        = $("cookModal");
  const cookEmoji        = $("cookEmoji");
  const cookName         = $("cookName");
  const cookMeta         = $("cookMeta");
  const cookImage        = $("cookImage");
  const cookClose        = $("cookClose");
  const timerRing        = $("timerRing");
  const timerNum         = $("timerNum");
  const timerLabel       = $("timerLabel");
  const timerToggle      = $("timerToggle");
  const timerReset       = $("timerReset");
  const cookIngredients  = $("cookIngredients");
  const cookSteps        = $("cookSteps");
  const cookProgressBar  = $("cookProgressBar");
  const cookProgressText = $("cookProgressText");
  const cookCheckin      = $("cookCheckin");

  // 打卡本
  const checkinBtn    = $("checkinBtn");
  const checkinModal  = $("checkinModal");
  const checkinClose  = $("checkinClose");
  const statToday     = $("statToday");
  const statStreak    = $("statStreak");
  const statTotal     = $("statTotal");
  const statDishes    = $("statDishes");
  const checkinCal    = $("checkinCal");
  const checkinList   = $("checkinList");

  // 厨师档案
  const chefSwitcher   = $("chefSwitcher");
  const chefAvatar     = $("chefAvatar");
  const chefAvatarBtn  = $("chefAvatarBtn");
  const chefName       = $("chefName");
  const chefManageBtn  = $("chefManageBtn");
  const chefModal      = $("chefModal");
  const chefClose      = $("chefClose");
  const chefList       = $("chefList");
  const chefFormTitle  = $("chefFormTitle");
  const chefEmoji      = $("chefEmoji");
  const chefNameInput  = $("chefNameInput");
  const chefSlogan     = $("chefSlogan");
  const chefCancelEdit = $("chefCancelEdit");
  const chefSave       = $("chefSave");
  const chefFilter     = $("chefFilter");
  const formChefNote   = $("formChefNote");
  const modalTitle     = $("modalTitle");

  // 天气与推荐
  const weatherCard     = $("weatherCard");
  const weatherEmoji    = $("weatherEmoji");
  const weatherCity     = $("weatherCity");
  const weatherDesc     = $("weatherDesc");
  const weatherRefresh  = $("weatherRefresh");
  const weatherWhy      = $("weatherWhy");
  const weatherRecoList = $("weatherRecoList");
  const weatherManual   = $("weatherManual");
  const cityInput       = $("cityInput");
  const cityGo          = $("cityGo");

  // 头像设置
  const avatarModal     = $("avatarModal");
  const avatarChefName  = $("avatarChefName");
  const avatarClose     = $("avatarClose");
  const avatarPreview   = $("avatarPreview");
  const avatarUploadBtn = $("avatarUploadBtn");
  const avatarFile      = $("avatarFile");
  const avatarClearImg  = $("avatarClearImg");
  const avatarGrid      = $("avatarGrid");
  const avatarColors    = $("avatarColors");
  const avatarCancel    = $("avatarCancel");
  const avatarSave      = $("avatarSave");

  // 搭配一餐
  const mealBtn      = $("mealBtn");
  const mealModal    = $("mealModal");
  const mealClose    = $("mealClose");
  const mealSections = $("mealSections");
  const mealSummary  = $("mealSummary");
  const mealClear    = $("mealClear");
  const mealCheckin  = $("mealCheckin");

  // 打卡本（能量 / 统计详情）
  const energyNum   = $("energyNum");
  const energyTitle = $("energyTitle");
  const energyBar   = $("energyBar");
  const energyNext  = $("energyNext");
  const statDetail  = $("statDetail");

  // 数据迁移与分享
  const exportBtn  = $("exportBtn");
  const importBtn  = $("importBtn");
  const importFile = $("importFile");
  const chefTitleChip = $("chefTitleChip");

  /* ---------- 状态 ---------- */
  let recipes = loadRecipes();
  let order = loadOrder();
  let checkins = loadCheckins();
  let chefs = loadChefs();
  let activeChefId = localStorage.getItem(CHEF_CURRENT_KEY) || null;
  let filterChefId = "all";    // 菜谱列表按厨师筛选
  let deleteTarget = null;     // { type: "recipe" | "chef", id }
  let chefEditId = null;       // 正在编辑的厨师 id
  let pendingImage = null;     // 当前表单里待保存的图片 dataURL
  let blindTimer = null;
  let blindPicked = null;      // 盲盒抽中的菜
  let cookRecipeId = null;     // 当前做菜模式中的菜 id
  let cookTimer = null;        // 烹饪计时器
  let cookTotal = 0;           // 总秒数
  let cookLeft = 0;            // 剩余秒数
  let weather = null;          // { city, temp, code, desc, emoji, ts }
  let avatarChefId = null;     // 正在设置头像的厨师
  let avatarEmoji = "👨‍🍳";
  let avatarColor = "";
  let avatarImg = "";
  let mealSel = { 菜式: [], 甜品: [] }; // 搭配一餐的当前选择（单选的分类存 id 或 null）
  let statDetailKind = null;   // 打卡本当前展开的统计模块

  /* ---------- 初始化下拉框 ---------- */
  function initSelects() {
    EMOJI_OPTIONS.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = e;
      emojiSelect.appendChild(opt);
    });
    METHOD_OPTIONS.forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      methodSelect.appendChild(opt);
    });
    CHEF_EMOJIS.forEach((e) => {
      const opt = document.createElement("option");
      opt.value = e;
      opt.textContent = e;
      chefEmoji.appendChild(opt);
    });
    CATEGORY_OPTIONS.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.value;
      opt.textContent = `${c.emoji} ${c.value}`;
      categorySelect.appendChild(opt);
    });
    emojiSelect.value = "🍅";
    methodSelect.value = METHOD_OPTIONS[0];
    chefEmoji.value = CHEF_EMOJIS[0];
    categorySelect.value = "菜式";
  }

  /* ---------- 本地存储 ---------- */
  function loadRecipes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveRecipes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recipes));
    } catch {
      toast("😵 存不下啦！图片太多啦，删掉一些菜谱再试试～");
    }
  }

  function loadOrder() {
    try {
      const raw = localStorage.getItem(ORDER_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveOrder() {
    try {
      localStorage.setItem(ORDER_KEY, JSON.stringify(order));
    } catch {
      /* 点单数据很小，一般不会失败 */
    }
  }

  function loadCheckins() {
    try {
      const raw = localStorage.getItem(CHECKIN_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveCheckins() {
    try {
      localStorage.setItem(CHECKIN_KEY, JSON.stringify(checkins));
    } catch {
      /* 打卡数据很小，一般不会失败 */
    }
  }

  /* ---------- 厨师存储 ---------- */
  function loadChefs() {
    try {
      const raw = localStorage.getItem(CHEFS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  function saveChefs() {
    try {
      localStorage.setItem(CHEFS_KEY, JSON.stringify(chefs));
    } catch {
      /* 厨师数据很小，一般不会失败 */
    }
  }

  /* 保证至少有默认厨师，并给旧菜谱补上归属 */
  function ensureChefs() {
    if (!Array.isArray(chefs) || chefs.length === 0) {
      chefs = [
        {
          id: DEFAULT_CHEF_ID,
          name: "胡闹主厨",
          emoji: "👨‍🍳",
          slogan: "厨房扛把子",
          createdAt: Date.now()
        }
      ];
      saveChefs();
    }
    if (!chefs.some((c) => c.id === DEFAULT_CHEF_ID)) {
      chefs.unshift({
        id: DEFAULT_CHEF_ID,
        name: "胡闹主厨",
        emoji: "👨‍🍳",
        slogan: "厨房扛把子",
        createdAt: Date.now()
      });
      saveChefs();
    }
    if (!activeChefId || !chefs.some((c) => c.id === activeChefId)) {
      activeChefId = chefs[0].id;
      localStorage.setItem(CHEF_CURRENT_KEY, activeChefId);
    }
    let changed = false;
    recipes.forEach((r) => {
      if (!r.chefId) {
        r.chefId = activeChefId;
        changed = true;
      }
    });
    if (changed) saveRecipes();
  }

  function activeChef() {
    return chefs.find((c) => c.id === activeChefId) || chefs[0];
  }

  /* ---------- 数据迁移（旧数据补字段） ---------- */
  function migrateData() {
    let changed = false;
    recipes.forEach((r) => {
      if (!r.category) {
        r.category = "菜式";
        changed = true;
      }
    });
    checkins.forEach((c) => {
      if (typeof c.chefId === "undefined") {
        c.chefId = "chef-1";
        changed = true;
      }
      if (!c.type) {
        c.type = "dish";
        changed = true;
      }
      if (typeof c.points === "undefined") {
        const r = recipes.find((x) => x.id === c.id);
        c.points = 5 + (r ? (r.level || 1) * 5 : 5);
        changed = true;
      }
    });
    if (changed) {
      saveRecipes();
      saveCheckins();
    }
  }

  /* ---------- 爱心能量与称号 ---------- */
  function dishPoints(r) {
    return 5 + (r.level || 1) * 5; // 难度越高能量越多
  }

  function mealPoints(recs) {
    const cats = new Set(recs.map((r) => r.category));
    let pts = recs.reduce((s, r) => s + 5 + (r.level || 1) * 5 + (r.category === "菜式" ? 3 : 0), 0);
    // 营养均衡奖励：主食+菜式+饮品+水果
    if (cats.has("主食") && cats.has("菜式") && cats.has("饮品") && cats.has("水果")) pts += 12;
    return pts;
  }

  function chefEnergy(chefId) {
    return checkins
      .filter((c) => (c.chefId || "chef-1") === chefId)
      .reduce((s, c) => s + (c.points || 0), 0);
  }

  function chefTitle(energy) {
    let cur = TITLE_TIERS[0];
    TITLE_TIERS.forEach((t) => {
      if (energy >= t.min) cur = t;
    });
    return cur;
  }

  function nextTitle(energy) {
    return TITLE_TIERS.find((t) => t.min > energy) || null;
  }

  /* ---------- 打卡工具 ---------- */
  function dateKey(ts) {
    const d = new Date(ts);
    return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  }

  function formatDate(ts) {
    const d = new Date(ts);
    const wd = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][d.getDay()];
    return `${d.getMonth() + 1}月${d.getDate()}日 ${wd}`;
  }

  function checkinStats() {
    const today = dateKey(Date.now());
    const todayCount = checkins.filter((c) => dateKey(c.ts) === today).length;
    const total = checkins.length;
    const dishes = new Set(checkins.map((c) => c.id)).size;

    // 连续打卡天数：从今天（或昨天，今天还没打时）往前数
    const days = new Set(checkins.map((c) => dateKey(c.ts)));
    let streak = 0;
    const d = new Date();
    if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
    while (days.has(dateKey(d))) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return { todayCount, total, dishes, streak };
  }

  /* ---------- 配料行 ---------- */
  function addIngredientRow(name = "", quantity = "") {
    const row = document.createElement("div");
    row.className = "ing-row";

    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = "配料，如：鸡蛋";
    nameInput.value = name;
    nameInput.maxLength = 20;

    const qtyInput = document.createElement("input");
    qtyInput.type = "text";
    qtyInput.className = "ing-quantity";
    qtyInput.placeholder = "用量，如：2 个";
    qtyInput.value = quantity;
    qtyInput.maxLength = 12;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "ing-del";
    delBtn.textContent = "✕";
    delBtn.title = "删除配料";
    delBtn.addEventListener("click", () => row.remove());

    row.append(nameInput, qtyInput, delBtn);
    ingListEl.appendChild(row);
    nameInput.focus();
  }

  function collectIngredients() {
    const rows = ingListEl.querySelectorAll(".ing-row");
    const result = [];
    rows.forEach((row) => {
      const name = row.children[0].value.trim();
      const qty = row.children[1].value.trim();
      if (name) result.push({ name, quantity: qty });
    });
    return result;
  }

  function renderIngredientRows(ingredients = []) {
    ingListEl.innerHTML = "";
    if (ingredients.length === 0) {
      addIngredientRow();
    } else {
      ingredients.forEach((ing) => addIngredientRow(ing.name, ing.quantity));
    }
  }

  /* ---------- 配图上传 ---------- */
  function resetImageUI() {
    pendingImage = null;
    imageInput.value = "";
    imagePreview.hidden = true;
    imagePreview.src = "";
    imgPlaceholder.hidden = false;
    removeImageBtn.hidden = true;
  }

  function showImagePreview(dataUrl) {
    imagePreview.src = dataUrl;
    imagePreview.hidden = false;
    imgPlaceholder.hidden = true;
    removeImageBtn.hidden = false;
  }

  function handleImageSelect(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      toast("😅 请选择图片文件哦");
      imageInput.value = "";
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast("🤏 图片有点大，选一张 8MB 以内的吧");
      imageInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        pendingImage = compressImage(img, reader.result);
        showImagePreview(pendingImage);
        imageInput.value = "";
      };
      img.onerror = () => {
        toast("😢 图片读取失败，换一张试试");
        imageInput.value = "";
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function compressImage(img, fallback) {
    const MAX = 600;
    let w = img.width || 600;
    let h = img.height || 450;
    const ratio = Math.min(1, MAX / Math.max(w, h));
    w = Math.max(1, Math.round(w * ratio));
    h = Math.max(1, Math.round(h * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    try {
      return canvas.toDataURL("image/jpeg", 0.82);
    } catch {
      return fallback;
    }
  }

  /* ---------- 校验 ---------- */
  function validateForm() {
    if (!nameInput.value.trim()) {
      toast("🙈 记得填菜名哦！");
      nameInput.focus();
      return false;
    }
    const time = Number(timeInput.value);
    if (!timeInput.value || time < 1) {
      toast("⏰ 烹饪时间要填数字呀～");
      timeInput.focus();
      return false;
    }
    return true;
  }

  /* ---------- 保存 / 编辑 ---------- */
  function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    const editingId = editIdInput.value;
    const data = {
      id: editingId || "r" + Date.now() + Math.random().toString(16).slice(2, 6),
      name: nameInput.value.trim(),
      emoji: emojiSelect.value,
      category: categorySelect.value || "菜式",
      time: Number(timeInput.value),
      method: methodSelect.value,
      level: Number(levelSelect.value),
      ingredients: collectIngredients(),
      steps: stepsInput.value.trim(),
      image: pendingImage || "",
      createdAt: Date.now()
    };

    if (editingId) {
      const idx = recipes.findIndex((r) => r.id === editingId);
      if (idx !== -1) {
        data.createdAt = recipes[idx].createdAt;
        data.chefId = recipes[idx].chefId || activeChefId; // 编辑不换厨师
        recipes[idx] = data;
      }
      toast("✏️ 菜谱更新好啦！");
      exitEditMode();
    } else {
      data.chefId = activeChefId; // 新菜谱归当前厨师
      recipes.unshift(data);
      toast("🎉 新菜谱添加成功！");
    }

    saveRecipes();
    render();
    resetFormAfterSave();
  }

  function resetFormAfterSave() {
    dishForm.reset();
    emojiSelect.value = "🍅";
    methodSelect.value = METHOD_OPTIONS[0];
    categorySelect.value = "菜式";
    renderIngredientRows();
    resetImageUI();
    setFormOpen(false); // 保存/取消后收起表单
  }

  /* 展开 / 收起添加菜式表单 */
  function setFormOpen(open) {
    formWrap.hidden = !open;
    toggleFormBtn.textContent = open ? "✕" : "➕";
    toggleFormBtn.title = open ? "收起表单" : "添加新菜式";
    toggleFormBtn.classList.toggle("open", open);
  }

  function openAddForm() {
    exitEditMode();
    resetFormAfterSave();       // 重置表单（内部会收起，随后再展开）
    formWrapTitle.textContent = "➕ 添加新菜式";
    setFormOpen(true);
    dishForm.scrollIntoView({ behavior: "smooth", block: "start" });
    nameInput.focus();
  }

  function startEdit(id) {
    const r = recipes.find((x) => x.id === id);
    if (!r) return;

    editIdInput.value = r.id;
    nameInput.value = r.name;
    emojiSelect.value = r.emoji || "🍅";
    categorySelect.value = r.category || "菜式";
    timeInput.value = r.time;
    methodSelect.value = r.method || METHOD_OPTIONS[0];
    levelSelect.value = String(r.level || 1);
    stepsInput.value = r.steps || "";
    renderIngredientRows(r.ingredients || []);

    // 配图回填
    pendingImage = r.image || null;
    if (r.image) showImagePreview(r.image);
    else resetImageUI();

    cancelEdit.hidden = false;
    formWrapTitle.textContent = "✏️ 编辑菜式";
    setFormOpen(true);
    dishForm.scrollIntoView({ behavior: "smooth", block: "start" });
    document
      .querySelectorAll(".recipe-card")
      .forEach((el) => el.classList.remove("editing"));
    const cardEl = document.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (cardEl) cardEl.classList.add("editing");
    toast("✏️ 正在编辑这道菜～");
  }

  function exitEditMode() {
    editIdInput.value = "";
    cancelEdit.hidden = true;
    document
      .querySelectorAll(".recipe-card")
      .forEach((el) => el.classList.remove("editing"));
  }

  /* ---------- 删除（弹窗确认） ---------- */
  function askDelete(id) {
    const r = recipes.find((x) => x.id === id);
    if (!r) return;
    deleteTarget = { type: "recipe", id };
    modalTitle.textContent = "确定要删掉这道菜吗？";
    modalName.textContent = `${r.emoji || "🍽️"} ${r.name}`;
    modalMask.hidden = false;
  }

  function askDeleteChef(id) {
    const c = chefs.find((x) => x.id === id);
    if (!c) return;
    if (chefs.length <= 1) {
      toast("😅 至少要保留一位厨师哦～");
      return;
    }
    const count = recipes.filter((r) => r.chefId === id).length;
    deleteTarget = { type: "chef", id };
    modalTitle.textContent = "确定要删掉这位厨师吗？";
    modalName.textContent = `${c.emoji} ${c.name}${count ? `（${count} 道菜会转给其他厨师）` : ""}`;
    modalMask.hidden = false;
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === "chef") confirmDeleteChef(deleteTarget.id);
    else confirmDeleteRecipe(deleteTarget.id);
    deleteTarget = null;
  }

  function confirmDeleteRecipe(id) {
    recipes = recipes.filter((r) => r.id !== id);
    saveRecipes();
    render();
    toast("🗑️ 已经删掉啦～");
    if (editIdInput.value) {
      exitEditMode();
      resetFormAfterSave();
    }
  }

  function confirmDeleteChef(id) {
    const fallback = chefs.find((c) => c.id !== id);
    if (!fallback) return;
    let moved = 0;
    recipes.forEach((r) => {
      if (r.chefId === id) {
        r.chefId = fallback.id;
        moved++;
      }
    });
    saveRecipes();
    chefs = chefs.filter((c) => c.id !== id);
    saveChefs();
    if (activeChefId === id) {
      activeChefId = fallback.id;
      localStorage.setItem(CHEF_CURRENT_KEY, activeChefId);
      filterChefId = fallback.id;
    }
    renderChefUI();
    render();
    toast(
      moved
        ? `🗑️ 厨师已删除，${moved} 道菜转给了「${fallback.name}」`
        : "🗑️ 厨师已删除"
    );
  }

  /* ---------- 点菜系统 ---------- */
  function addToOrder(id) {
    const r = recipes.find((x) => x.id === id);
    if (!r) return;
    const item = order.find((o) => o.id === id);
    if (item) item.qty += 1;
    else order.push({ id, name: r.name, emoji: r.emoji || "🍽️", qty: 1 });
    saveOrder();
    renderCart();
    toast(`🛒 已点「${r.name}」`);
  }

  function changeOrderQty(id, delta) {
    const item = order.find((o) => o.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) order = order.filter((o) => o.id !== id);
    saveOrder();
    renderCart();
  }

  function clearOrder() {
    order = [];
    saveOrder();
    renderCart();
    toast("🧹 点单已清空");
  }

  function renderCart() {
    const total = order.reduce((s, o) => s + o.qty, 0);
    cartCount.textContent = String(total);
    cartFab.hidden = total === 0;

    if (total === 0) {
      cartList.innerHTML =
        '<div class="cart-empty">🧺 空空的～<br />去卡片上点「🛒 点它」吧！</div>';
      cartTotal.textContent = "共 0 份";
      return;
    }

    cartList.innerHTML = order
      .map(
        (o) => `
      <div class="cart-item" data-id="${o.id}">
        <span class="cart-emoji">${o.emoji}</span>
        <span class="cart-name">${escapeHtml(o.name)}</span>
        <div class="qty-ctrl">
          <button type="button" class="qty-btn" data-act="minus" aria-label="减少">−</button>
          <span class="qty-num">${o.qty}</span>
          <button type="button" class="qty-btn" data-act="plus" aria-label="增加">＋</button>
        </div>
      </div>`
      )
      .join("");
    cartTotal.textContent = `共 ${total} 份`;
  }

  /* ---------- 盲盒抽菜 ---------- */
  function blindPool() {
    return filterChefId === "all" ? recipes : recipes.filter((r) => r.chefId === filterChefId);
  }

  function openBlindBox() {
    const pool = blindPool();
    if (pool.length === 0) {
      toast("🍳 当前范围还没有菜谱，先添加几道再来抽吧！");
      return;
    }
    blindPicked = null;
    blindModal.hidden = false;
    blindStage.classList.remove("revealed");
    blindStage.classList.add("shaking");
    blindEmoji.textContent = "🎁";
    blindTitle.textContent = "开盲盒中…";
    blindResult.textContent = "咕噜咕噜…今天会抽到什么呢？";

    clearInterval(blindTimer);
    let spins = 0;
    blindTimer = setInterval(() => {
      const r = pool[Math.floor(Math.random() * pool.length)];
      blindEmoji.textContent = r.emoji || "🍽️";
      spins++;
      if (spins >= 8) {
        clearInterval(blindTimer);
        revealBlindPick(pool);
      }
    }, 180);
  }

  function revealBlindPick(pool) {
    const r = pool[Math.floor(Math.random() * pool.length)];
    blindPicked = r;
    blindStage.classList.remove("shaking");
    blindStage.classList.add("revealed");
    blindEmoji.textContent = r.emoji || "🍽️";
    blindTitle.textContent = `🎉 今天吃「${r.name}」！`;

    const ingCount = (r.ingredients || []).length;
    blindResult.innerHTML =
      (r.image ? `<img class="blind-img" src="${r.image}" alt="" />` : "") +
      `<div class="blind-info">⏰ ${r.time} 分钟 · ${escapeHtml(r.method)}` +
      (ingCount ? `<br />🥕 ${ingCount} 种配料` : "") +
      "</div>";
  }

  function closeBlindBox() {
    clearInterval(blindTimer);
    blindModal.hidden = true;
    blindPicked = null;
  }

  /* ---------- 厨师档案 ---------- */
  /* 把厨师头像渲染到圆形元素上（emoji 或自定义图片） */
  function applyAvatar(el, chef) {
    if (!el) return;
    el.style.background = chef.avatarColor || "";
    el.style.backgroundImage = "";
    if (chef.avatarImg) {
      el.textContent = "";
      el.style.backgroundImage = `url(${chef.avatarImg})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.textContent = chef.emoji || "👨‍🍳";
    }
  }

  function renderChefUI() {
    const a = activeChef();
    applyAvatar(chefAvatar, a);
    chefName.textContent = a.name;
    const energy = chefEnergy(a.id);
    const t = chefTitle(energy);
    chefTitleChip.textContent = `${t.emoji} ${t.title}`;
    chefTitleChip.title = `爱心能量 ${energy} · 称号`;
    formChefNote.textContent = `👨‍🍳 新菜式将收录到「${a.name}」的档案`;
    renderChefFilter();
    if (!chefModal.hidden) renderChefList();
  }

  function renderChefFilter() {
    const chips = [
      `<button type="button" class="chef-chip ${filterChefId === "all" ? "active" : ""}" data-chef="all">🍽️ 全部</button>`
    ];
    chefs.forEach((c) => {
      chips.push(
        `<button type="button" class="chef-chip ${filterChefId === c.id ? "active" : ""}" data-chef="${c.id}">${c.emoji} ${escapeHtml(c.name)}</button>`
      );
    });
    chefFilter.innerHTML = chips.join("");
  }

  function renderChefList() {
    chefList.innerHTML = chefs
      .map((c) => {
        const count = recipes.filter((r) => r.chefId === c.id).length;
        const active = c.id === activeChefId;
        return `
      <div class="chef-item ${active ? "active" : ""}" data-id="${c.id}">
        <span class="chef-avatar">${c.emoji || "👨‍🍳"}</span>
        <div class="chef-item-info">
          <div class="chef-item-name">${escapeHtml(c.name)}${active ? '<span class="chef-current">当前</span>' : ""}</div>
          <div class="chef-item-slogan">${escapeHtml(c.slogan || "还没有口号～")}</div>
        </div>
        <span class="chef-item-count">${count} 道菜</span>
        <div class="chef-item-actions">
          <button type="button" class="icon-btn edit" title="编辑档案">✏️</button>
          <button type="button" class="icon-btn del" title="删除厨师">🗑️</button>
        </div>
      </div>`;
      })
      .join("");
    // 头像统一渲染（emoji 或自定义图片）
    chefList.querySelectorAll(".chef-item").forEach((item) => {
      const chef = chefs.find((c) => c.id === item.dataset.id);
      const avatarEl = item.querySelector(".chef-avatar");
      if (chef && avatarEl) applyAvatar(avatarEl, chef);
    });
  }

  function openChefModal() {
    resetChefForm();
    renderChefList();
    chefModal.hidden = false;
  }

  function closeChefModal() {
    chefModal.hidden = true;
  }

  function resetChefForm() {
    chefEditId = null;
    chefNameInput.value = "";
    chefSlogan.value = "";
    chefEmoji.value = CHEF_EMOJIS[0];
    chefFormTitle.textContent = "➕ 新厨师";
    chefCancelEdit.hidden = true;
  }

  function editChef(id) {
    const c = chefs.find((x) => x.id === id);
    if (!c) return;
    chefEditId = id;
    chefNameInput.value = c.name;
    chefSlogan.value = c.slogan || "";
    chefEmoji.value = c.emoji;
    chefFormTitle.textContent = "✏️ 编辑档案";
    chefCancelEdit.hidden = false;
    chefNameInput.focus();
  }

  function saveChefForm() {
    const name = chefNameInput.value.trim();
    if (!name) {
      toast("🙈 给厨师起个名字吧！");
      chefNameInput.focus();
      return;
    }
    if (chefEditId) {
      const c = chefs.find((x) => x.id === chefEditId);
      if (c) {
        c.name = name;
        c.emoji = chefEmoji.value;
        c.slogan = chefSlogan.value.trim();
      }
      saveChefs();
      renderChefUI();
      render();
      toast("✏️ 档案更新好啦！");
    } else {
      const c = {
        id: "chef-" + Date.now() + Math.random().toString(16).slice(2, 5),
        name: name,
        emoji: chefEmoji.value,
        slogan: chefSlogan.value.trim(),
        createdAt: Date.now()
      };
      chefs.push(c);
      saveChefs();
      setActiveChef(c.id);
      toast(`🎉 欢迎新厨师「${name}」！`);
    }
    resetChefForm();
  }

  function setActiveChef(id) {
    if (!chefs.some((c) => c.id === id)) return;
    activeChefId = id;
    localStorage.setItem(CHEF_CURRENT_KEY, id);
    filterChefId = id; // 切换厨师后默认看 TA 的菜谱
    renderChefUI();
    render();
    toast(`👨‍🍳 已切换到「${activeChef().name}」`);
  }

  function setChefFilter(id) {
    filterChefId = id;
    renderChefFilter();
    render();
  }

  /* ---------- 头像设置 ---------- */
  function openAvatarPicker() {
    const c = activeChef();
    if (!c) return;
    avatarChefId = c.id;
    avatarEmoji = c.emoji || CHEF_EMOJIS[0];
    avatarColor = c.avatarColor || "";
    avatarImg = c.avatarImg || "";
    avatarChefName.textContent = c.name;
    renderAvatarPicker();
    avatarModal.hidden = false;
  }

  function closeAvatarModal() {
    avatarModal.hidden = true;
  }

  function renderAvatarPicker() {
    // 预览
    avatarPreview.style.background = avatarColor || "";
    avatarPreview.style.backgroundImage = "";
    if (avatarImg) {
      avatarPreview.textContent = "";
      avatarPreview.style.backgroundImage = `url(${avatarImg})`;
      avatarPreview.style.backgroundSize = "cover";
      avatarPreview.style.backgroundPosition = "center";
    } else {
      avatarPreview.textContent = avatarEmoji;
    }
    avatarClearImg.hidden = !avatarImg;

    // 头像图库
    avatarGrid.innerHTML = CHEF_EMOJIS.map(
      (e) =>
        `<button type="button" class="avatar-opt ${e === avatarEmoji && !avatarImg ? "active" : ""}" data-emoji="${e}">${e}</button>`
    ).join("");

    // 背景色
    const colors = [
      `<button type="button" class="color-opt ${avatarColor === "" ? "active" : ""}" data-color="">🌈 渐变</button>`
    ];
    AVATAR_COLORS.forEach((c) => {
      colors.push(
        `<button type="button" class="color-opt ${avatarColor === c ? "active" : ""}" data-color="${c}" style="background:${c}"></button>`
      );
    });
    avatarColors.innerHTML = colors.join("");
  }

  function saveAvatar() {
    const c = chefs.find((x) => x.id === avatarChefId);
    if (!c) return;
    c.emoji = avatarEmoji;
    c.avatarColor = avatarColor;
    c.avatarImg = avatarImg;
    saveChefs();
    renderChefUI();
    render();
    avatarModal.hidden = true;
    toast("🎨 头像已更新！");
  }

  function handleAvatarFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type || !file.type.startsWith("image/")) {
      toast("😅 请选择图片文件哦");
      avatarFile.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        avatarImg = compressAvatarImage(img, reader.result);
        avatarFile.value = "";
        renderAvatarPicker();
        toast("🖼️ 图片已就位，点保存生效～");
      };
      img.onerror = () => {
        toast("😢 图片读取失败，换一张试试");
        avatarFile.value = "";
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function compressAvatarImage(img, fallback) {
    const MAX = 160;
    let w = img.width || 160;
    let h = img.height || 160;
    const ratio = Math.min(1, MAX / Math.max(w, h));
    w = Math.max(1, Math.round(w * ratio));
    h = Math.max(1, Math.round(h * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, w, h);
    try {
      return canvas.toDataURL("image/jpeg", 0.85);
    } catch {
      return fallback;
    }
  }

  /* ---------- 做菜打卡 ---------- */
  function checkIn(recipeId) {
    const r = recipes.find((x) => x.id === recipeId);
    if (!r) return;
    const today = dateKey(Date.now());
    const already = checkins.some(
      (c) => c.id === recipeId && dateKey(c.ts) === today
    );
    if (already) {
      toast("🥰 今天已经打卡过这道菜啦～");
      return;
    }
    const pts = dishPoints(r);
    checkins.push({
      id: recipeId,
      name: r.name,
      emoji: r.emoji || "🍽️",
      ts: Date.now(),
      chefId: activeChefId,
      type: "dish",
      points: pts
    });
    saveCheckins();
    render();                       // 刷新卡片上的「已打卡」状态
    renderChefUI();                 // 刷新厨师栏称号
    if (!checkinModal.hidden) renderCheckinPanel();
    updateCookCheckinBtn();
    celebrate();
    toast(`✅ 打卡成功！「${r.name}」 +${pts} ❤️`);
  }

  /* ---------- 搭配一餐 ---------- */
  function openMealComposer() {
    renderMealComposer();
    mealModal.hidden = false;
  }

  function closeMealComposer() {
    mealModal.hidden = true;
  }

  function collectMealRecipes() {
    const picked = [];
    Object.keys(mealSel).forEach((cat) => {
      const ids = Array.isArray(mealSel[cat]) ? mealSel[cat] : [mealSel[cat]];
      ids.forEach((id) => {
        if (!id) return;
        const r = recipes.find((x) => x.id === id);
        if (r) picked.push(r);
      });
    });
    return picked;
  }

  function renderMealComposer() {
    const sections = [];
    CATEGORY_OPTIONS.forEach((c) => {
      const items = recipes.filter((r) => r.category === c.value);
      if (items.length === 0) return;
      const multi = Array.isArray(mealSel[c.value]);
      sections.push(`
        <div class="meal-section">
          <h4>${c.emoji} ${c.value}</h4>
          <div class="meal-items">
            ${items
              .map((r) => {
                const active = multi
                  ? mealSel[c.value].includes(r.id)
                  : mealSel[c.value] === r.id;
                return `
              <button type="button" class="meal-item ${active ? "active" : ""}" data-cat="${c.value}" data-id="${r.id}">
                <span class="meal-item-emoji">${r.emoji || "🍽️"}</span>
                <span class="meal-item-name">${escapeHtml(r.name)}</span>
              </button>`;
              })
              .join("")}
          </div>
        </div>`);
    });
    mealSections.innerHTML =
      sections.length > 0
        ? sections.join("")
        : '<div class="cart-empty">🍳 还没有菜谱，先去添加几道吧！</div>';
    renderMealSummary();
  }

  function toggleMealItem(cat, id) {
    if (Array.isArray(mealSel[cat])) {
      const arr = mealSel[cat];
      const i = arr.indexOf(id);
      if (i > -1) arr.splice(i, 1);
      else if (arr.length < 4) arr.push(id);
    } else {
      mealSel[cat] = mealSel[cat] === id ? null : id;
    }
    renderMealComposer();
  }

  function clearMeal() {
    mealSel = { 菜式: [], 甜品: [] };
    renderMealComposer();
  }

  function renderMealSummary() {
    const picked = collectMealRecipes();
    if (picked.length === 0) {
      mealSummary.innerHTML = "还没选好，快挑一挑吧～";
      return;
    }
    const pts = mealPoints(picked);
    const cats = new Set(picked.map((r) => r.category));
    const balanced =
      cats.has("主食") && cats.has("菜式") && cats.has("饮品") && cats.has("水果");
    mealSummary.innerHTML =
      picked.map((r) => `${r.emoji || "🍽️"} ${escapeHtml(r.name)}`).join(" · ") +
      `<div class="pts-preview">预计获得 <strong>${pts}</strong> 爱心能量 ${balanced ? "＋ 营养均衡 🥗" : ""}</div>`;
  }

  function checkInMeal() {
    const picked = collectMealRecipes();
    if (picked.length === 0) {
      toast("🥺 先选点东西再打卡呀～");
      return;
    }
    const pts = mealPoints(picked);
    checkins.push({
      id: "m" + Date.now() + Math.random().toString(16).slice(2, 6),
      name: picked.map((r) => r.name).join(" + "),
      emoji: "🍱",
      ts: Date.now(),
      chefId: activeChefId,
      type: "meal",
      mealIds: picked.map((r) => r.id),
      points: pts
    });
    saveCheckins();
    render();
    renderChefUI(); // 刷新厨师栏称号
    if (!checkinModal.hidden) renderCheckinPanel();
    celebrate();
    toast(`❤️ 这顿饭打卡成功！+${pts} 爱心能量`);
    clearMeal();
    mealModal.hidden = true;
  }

  function openCheckinPanel() {
    statDetailKind = null;
    statDetail.hidden = true;
    renderCheckinPanel();
    checkinModal.hidden = false;
  }

  function closeCheckinPanel() {
    checkinModal.hidden = true;
  }

  function renderCheckinPanel() {
    const s = checkinStats();
    statToday.textContent = String(s.todayCount);
    statStreak.textContent = String(s.streak);
    statTotal.textContent = String(s.total);
    statDishes.textContent = String(s.dishes);

    // 爱心能量与称号（当前厨师）
    const energy = chefEnergy(activeChefId);
    const title = chefTitle(energy);
    const next = nextTitle(energy);
    energyNum.textContent = String(energy);
    energyTitle.textContent = `${title.emoji} ${title.title}`;
    const pct = next ? Math.min(100, Math.round(((energy - title.min) / (next.min - title.min)) * 100)) : 100;
    energyBar.style.width = pct + "%";
    energyNext.textContent = next
      ? `再获得 ${next.min - energy} 能量升级「${next.emoji} ${next.title}」`
      : "🏆 已达成最高称号「传说大厨」！";

    // 最近 14 天日历
    const days = new Set(checkins.map((c) => dateKey(c.ts)));
    let cal = "";
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const k = dateKey(d);
      cal += `<div class="cal-cell ${i === 0 ? "today" : ""} ${days.has(k) ? "has" : ""}">${d.getDate()}</div>`;
    }
    checkinCal.innerHTML = cal;

    // 打卡记录（按日期分组，新的在前）
    if (checkins.length === 0) {
      checkinList.innerHTML =
        '<div class="cart-empty">还没有打卡记录～<br />做完一道菜就来打个卡吧！</div>';
    } else {
      const groups = {};
      [...checkins]
        .sort((a, b) => b.ts - a.ts)
        .forEach((c) => {
          const k = formatDate(c.ts);
          (groups[k] = groups[k] || []).push(c);
        });
      checkinList.innerHTML = Object.entries(groups)
        .map(
          ([k, arr]) => `
        <div class="checkin-day">
          <div class="checkin-date">📌 ${k}</div>
          <div class="checkin-items">${arr
            .map((c) => `<span class="checkin-chip">${c.emoji} ${escapeHtml(c.name)}<i class="chip-pts">+${c.points || 0}❤️</i></span>`)
            .join("")}</div>
        </div>`
        )
        .join("");
    }
  }

  function renderStatDetail(kind) {
    if (!kind) {
      statDetail.hidden = true;
      return;
    }
    let html = "";
    if (kind === "today") {
      const today = dateKey(Date.now());
      const list = checkins
        .filter((c) => dateKey(c.ts) === today)
        .sort((a, b) => b.ts - a.ts);
      html = list.length
        ? list
            .map(
              (c) =>
                `<div class="detail-row"><span class="detail-name">${c.emoji || "🍽️"} ${escapeHtml(c.name)}</span><span class="detail-pts">+${c.points || 0}❤️</span><span class="detail-time">${timeOf(c.ts)}</span></div>`
            )
            .join("")
        : "今天还没有打卡，快去打卡吧～";
    } else if (kind === "streak") {
      const days = new Set(checkins.map((c) => dateKey(c.ts)));
      let cur = 0;
      const d = new Date();
      if (!days.has(dateKey(d))) d.setDate(d.getDate() - 1);
      while (days.has(dateKey(d))) {
        cur++;
        d.setDate(d.getDate() - 1);
      }
      let best = 0;
      const sorted = [...days].sort();
      let run = 0;
      let prev = null;
      sorted.forEach((k) => {
        run = prev && dayDiff(prev, k) === 1 ? run + 1 : 1;
        best = Math.max(best, run);
        prev = k;
      });
      html = `当前连续 <strong>${cur}</strong> 天<br/>历史最长 <strong>${best}</strong> 天<br/>💡 坚持每天打卡，称号升级更快哦！`;
    } else if (kind === "total") {
      const meals = checkins.filter((c) => c.type === "meal").length;
      const dishes = checkins.length - meals;
      const energy = checkins.reduce((s, c) => s + (c.points || 0), 0);
      html = `累计打卡 <strong>${checkins.length}</strong> 次（餐食 ${meals} · 单菜 ${dishes}）<br/>累计爱心能量 <strong>${energy} ❤️</strong>`;
    } else if (kind === "dishes") {
      const counts = {};
      checkins
        .filter((c) => c.type !== "meal")
        .forEach((c) => {
          counts[c.name] = (counts[c.name] || 0) + 1;
        });
      const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
      html = entries.length
        ? entries
            .map(
              ([n, cnt]) =>
                `<div class="detail-row"><span class="detail-name">${escapeHtml(n)}</span><span class="detail-pts">×${cnt}</span></div>`
            )
            .join("")
        : "还没有单菜打卡记录～";
    }
    statDetail.innerHTML = html;
    statDetail.hidden = false;
  }

  function timeOf(ts) {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  function dayDiff(k1, k2) {
    const [y1, m1, d1] = k1.split("-").map(Number);
    const [y2, m2, d2] = k2.split("-").map(Number);
    const a = new Date(y1, m1 - 1, d1);
    const b = new Date(y2, m2 - 1, d2);
    return Math.round((b - a) / 86400000);
  }

  /* ---------- 做菜模式 ---------- */
  function openCooking(id) {
    const r = recipes.find((x) => x.id === id);
    if (!r) return;

    cookRecipeId = id;
    cookEmoji.textContent = r.emoji || "🍽️";
    cookName.textContent = r.name;
    cookMeta.textContent = `⏰ ${r.time} 分钟 · ${r.method} · ${"⭐".repeat(r.level || 1)}`;

    if (r.image) {
      cookImage.src = r.image;
      cookImage.hidden = false;
    } else {
      cookImage.hidden = true;
    }

    const ings = (r.ingredients || []).map((i) =>
      i.quantity ? `${i.name}（${i.quantity}）` : i.name
    );
    cookIngredients.innerHTML = ings.length
      ? ings
          .map(
            (t) =>
              `<div class="cook-check"><span class="check-box">✓</span><span class="check-text">${escapeHtml(t)}</span></div>`
          )
          .join("")
      : '<div class="cook-none">还没写配料哦～</div>';

    const steps = (r.steps || "")
      .split(/[\n；;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    cookSteps.innerHTML = steps.length
      ? steps
          .map(
            (t, i) =>
              `<div class="cook-check"><span class="check-box">${i + 1}</span><span class="check-text">${escapeHtml(t)}</span></div>`
          )
          .join("")
      : '<div class="cook-none">还没写做法哦～</div>';

    cookTotal = Math.max(1, Number(r.time) || 1) * 60;
    resetTimer();
    updateCookingProgress();
    updateCookCheckinBtn();
    cookModal.hidden = false;
  }

  function resetTimer() {
    clearInterval(cookTimer);
    cookTimer = null;
    cookLeft = cookTotal;
    timerToggle.textContent = "▶ 开始计时";
    renderTimer();
  }

  function toggleTimer() {
    if (cookTimer) {
      pauseTimer();
      return;
    }
    if (cookLeft <= 0) cookLeft = cookTotal;
    cookTimer = setInterval(tick, 1000);
    timerToggle.textContent = "⏸ 暂停";
  }

  function pauseTimer() {
    clearInterval(cookTimer);
    cookTimer = null;
    timerToggle.textContent = "▶ 继续";
  }

  function tick() {
    cookLeft = Math.max(0, cookLeft - 1);
    if (cookLeft === 0) {
      pauseTimer();
      timerToggle.textContent = "🎉 出锅啦！";
      celebrate();
      toast("🎉 出锅啦！记得点「✅ 做完打卡」哦～");
    }
    renderTimer();
  }

  function renderTimer() {
    const m = Math.floor(cookLeft / 60);
    const s = cookLeft % 60;
    timerNum.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    timerLabel.textContent = cookLeft > 0 ? "烹饪倒计时" : "出锅啦！";
    const pct = cookTotal ? (cookLeft / cookTotal) * 100 : 0;
    timerRing.style.background = `conic-gradient(var(--pink-deep) ${pct}%, #ffe3ec 0)`;
  }

  function updateCookingProgress() {
    const items = [
      ...cookIngredients.querySelectorAll(".cook-check"),
      ...cookSteps.querySelectorAll(".cook-check")
    ];
    const done = items.filter((el) => el.classList.contains("done")).length;
    const pct = items.length ? Math.round((done / items.length) * 100) : 0;
    cookProgressBar.style.width = pct + "%";
    cookProgressText.textContent = `${done} / ${items.length} 完成`;
  }

  function onCookCheckClick(e) {
    const item = e.target.closest(".cook-check");
    if (!item) return;
    item.classList.toggle("done");
    updateCookingProgress();
  }

  function updateCookCheckinBtn() {
    if (!cookRecipeId) return;
    const checked = checkins.some(
      (c) => c.id === cookRecipeId && dateKey(c.ts) === dateKey(Date.now())
    );
    cookCheckin.textContent = checked ? "✅ 已打卡" : "✅ 做完打卡";
    cookCheckin.classList.toggle("checked", checked);
  }

  function closeCooking() {
    clearInterval(cookTimer);
    cookTimer = null;
    cookModal.hidden = true;
    cookRecipeId = null;
  }

  /* ---------- 庆祝小彩带 ---------- */
  function celebrate() {
    const emojis = ["🎉", "🎊", "🍾", "🥳", "⭐", "💖", "🍳", "🧁"];
    for (let i = 0; i < 12; i++) {
      const s = document.createElement("span");
      s.className = "burst-emoji";
      s.textContent = emojis[Math.floor(Math.random() * emojis.length)];
      s.style.left = 8 + Math.random() * 84 + "%";
      s.style.top = 15 + Math.random() * 55 + "%";
      s.style.animationDelay = Math.random() * 0.3 + "s";
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }
  }

  /* ---------- 天气与位置 ---------- */
  const WMO_MAP = {
    0: ["☀️", "晴"], 1: ["🌤️", "多云"], 2: ["🌤️", "多云"], 3: ["☁️", "阴"],
    45: ["🌫️", "雾"], 48: ["🌫️", "雾"],
    51: ["🌦️", "毛毛雨"], 53: ["🌦️", "毛毛雨"], 55: ["🌦️", "毛毛雨"],
    56: ["🌧️", "冻毛毛雨"], 57: ["🌧️", "冻毛毛雨"],
    61: ["🌧️", "小雨"], 63: ["🌧️", "中雨"], 65: ["🌧️", "大雨"],
    66: ["🌧️", "冻雨"], 67: ["🌧️", "冻雨"],
    71: ["🌨️", "小雪"], 73: ["🌨️", "中雪"], 75: ["🌨️", "大雪"],
    77: ["🌨️", "雪"], 80: ["🌧️", "阵雨"], 81: ["🌧️", "阵雨"],
    82: ["🌧️", "强阵雨"], 85: ["🌨️", "阵雪"], 86: ["🌨️", "阵雪"],
    95: ["⛈️", "雷雨"], 96: ["⛈️", "雷雨伴冰雹"], 99: ["⛈️", "雷雨伴冰雹"]
  };
  const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
  const SNOW_CODES = [71, 73, 75, 77, 85, 86];

  function loadWeatherCache() {
    try {
      const raw = localStorage.getItem(WEATHER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function buildWeather(city, temp, code) {
    const [emoji, desc] = WMO_MAP[code] || ["🌡️", "未知天气"];
    return {
      city: city || "当前位置",
      temp: Math.round(temp),
      code: code,
      desc: desc,
      emoji: emoji,
      ts: Date.now()
    };
  }

  async function fetchWeatherByCoords(lat, lng, cityName) {
    try {
      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current_weather=true&timezone=auto`
      );
      const data = await res.json();
      const cw = data && data.current_weather;
      if (!cw) return null;
      const w = buildWeather(cityName, cw.temperature, cw.weathercode);
      w.ts = Date.now();
      localStorage.setItem(WEATHER_KEY, JSON.stringify(w));
      return w;
    } catch {
      return null;
    }
  }

  async function fetchCityWeather(city) {
    try {
      const gres = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh`
      );
      const gdata = await gres.json();
      if (!gdata.results || gdata.results.length === 0) {
        toast("😅 没找到这座城市，换个名字试试～");
        return null;
      }
      const loc = gdata.results[0];
      const w = await fetchWeatherByCoords(loc.latitude, loc.longitude, loc.name);
      if (w) toast(`🌤️ 已定位到 ${w.city}！`);
      return w;
    } catch {
      toast("😢 天气服务连不上，稍后再试～");
      return null;
    }
  }

  function showManualCity() {
    weatherManual.hidden = false;
  }

  async function initWeather(force) {
    if (!force) {
      const cached = loadWeatherCache();
      if (cached && Date.now() - cached.ts < WEATHER_CACHE_MS) {
        weather = cached;
        renderWeather();
        return;
      }
    }
    if (typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const w = await fetchWeatherByCoords(
            pos.coords.latitude,
            pos.coords.longitude,
            null
          );
          if (w) {
            weather = w;
            renderWeather();
          } else {
            showManualCity();
          }
        },
        () => {
          const cached = loadWeatherCache();
          if (cached) {
            weather = cached;
            renderWeather();
          }
          showManualCity();
        }
      );
    } else {
      const cached = loadWeatherCache();
      if (cached) {
        weather = cached;
        renderWeather();
      }
      showManualCity();
    }
  }

  function refreshWeather() {
    localStorage.removeItem(WEATHER_KEY);
    weather = null;
    weatherCard.hidden = true;
    initWeather(true);
    toast("🔄 正在重新获取天气…");
  }

  /* ---------- 天气推荐 ---------- */
  function weatherFit(r, w) {
    let score = 0;
    const t = w.temp;
    const method = r.method || "";
    const name = r.name || "";
    const warm = /炖|煮|焖|烤|汤|粥|火锅|煲/.test(method + name);
    const cold = /凉拌|拌|冷盘|沙拉/.test(method + name);
    const steam = /蒸/.test(method);

    if (t <= 5) {
      score += warm ? 4 : 0;
      score -= cold ? 3 : 0;
      score += steam ? 1 : 0;
    } else if (t <= 12) {
      score += warm ? 3 : 0;
      score -= cold ? 2 : 0;
      score += steam ? 1 : 0;
    } else if (t <= 15) {
      score += warm ? 2 : 0;
      score -= cold ? 1 : 0;
    } else if (t >= 32) {
      score += cold ? 4 : 0;
      score -= warm ? 3 : 0;
      score += steam ? 1 : 0;
    } else if (t >= 28) {
      score += cold ? 3 : 0;
      score -= warm ? 2 : 0;
      score += steam ? 1 : 0;
    } else if (t >= 24) {
      score += cold ? 1 : 0;
    }

    if (RAIN_CODES.includes(w.code)) score += warm ? 2 : 0;
    if (SNOW_CODES.includes(w.code)) score += warm ? 3 : 0;
    if (w.code === 0 || w.code === 1) score += cold ? 1 : 0;
    return score;
  }

  function recommendRecipes() {
    if (!weather) return [];
    const pool =
      filterChefId === "all"
        ? recipes
        : recipes.filter((r) => r.chefId === filterChefId);
    return pool
      .map((r) => ({ r, score: weatherFit(r, weather) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((s) => s.r);
  }

  function weatherWhyText(w) {
    const t = w.temp;
    if (t <= 5) return "❄️ 天寒地冻，来点热乎的！";
    if (t <= 12) return "🍲 有点凉，暖胃炖菜走起";
    if (t <= 26) return "😌 天气舒适，随意发挥～";
    if (t <= 32) return "☀️ 有点热，清爽开胃最合适";
    return "🥵 太热啦，凉拌蒸菜救你";
  }

  function renderWeather() {
    weatherCard.hidden = !weather;
    if (!weather) return;
    weatherEmoji.textContent = weather.emoji;
    weatherCity.textContent = `📍 ${weather.city}`;
    weatherDesc.textContent = `${weather.temp}°C · ${weather.desc}`;
    weatherWhy.textContent = weatherWhyText(weather);

    const recos = recommendRecipes();
    weatherRecoList.innerHTML = recos.length
      ? recos
          .map((r) => {
            const chef = chefs.find((c) => c.id === r.chefId);
            return `
        <div class="reco-item" data-id="${r.id}">
          <span class="reco-emoji">${r.emoji || "🍽️"}</span>
          <div class="reco-info">
            <div class="reco-name">${escapeHtml(r.name)}</div>
            <div class="reco-meta">${escapeHtml(r.method)} · ${r.time} 分钟${chef ? ` · ${chef.emoji}${escapeHtml(chef.name)}` : ""}</div>
          </div>
          <button type="button" class="btn btn-order btn-small">🛒 点它</button>
        </div>`;
          })
          .join("")
      : '<div class="reco-empty">🍳 还没有菜谱，先去添加几道再来推荐吧！</div>';
  }

  /* ---------- 数据迁移与分享 ---------- */
  function exportData() {
    const data = {
      app: "胡闹厨房",
      version: 1,
      exportedAt: new Date().toISOString(),
      recipes: recipes,
      chefs: chefs,
      checkins: checkins,
      order: order
    };
    const json = JSON.stringify(data, null, 2);
    try {
      // 下载 JSON 文件
      const blob = new Blob([json], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `胡闹厨房-数据备份-${dateKey(Date.now())}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    } catch {
      /* 下载失败不影响复制 */
    }
    // 复制到剪贴板（便于分享给朋友）
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(json)
        .then(() => toast("📤 已导出！JSON 已复制到剪贴板，可直接分享～"))
        .catch(() => toast("📤 已导出下载！"));
    } else {
      toast("📤 已导出下载！");
    }
  }

  function handleImportFile(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.recipes)) throw new Error("bad format");
        const before = recipes.length;
        let added = 0;
        data.recipes.forEach((r) => {
          if (!r.id) r.id = "r" + Date.now() + Math.random().toString(16).slice(2, 6);
          r.category = r.category || "菜式";
          const idx = recipes.findIndex((x) => x.id === r.id);
          if (idx > -1) {
            recipes[idx] = r; // 覆盖同 id
          } else {
            recipes.unshift(r);
            added++;
          }
        });
        if (Array.isArray(data.chefs)) {
          data.chefs.forEach((c) => {
            if (c.id && !chefs.some((x) => x.id === c.id)) chefs.push(c);
          });
        }
        if (Array.isArray(data.checkins)) {
          data.checkins.forEach((c) => {
            if (c.id && !checkins.some((x) => x.id === c.id)) {
              c.chefId = c.chefId || "chef-1";
              c.type = c.type || "dish";
              c.points = c.points || 5;
              checkins.push(c);
            }
          });
        }
        saveRecipes();
        saveChefs();
        saveCheckins();
        render();
        renderChefUI();
        if (!checkinModal.hidden) renderCheckinPanel();
        toast(`📥 导入成功！新增 ${added} 道菜，共 ${recipes.length} 道`);
      } catch {
        toast("😅 文件格式不对哦～请导入导出的 JSON 文件");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  }

  /* ---------- 渲染 ---------- */
  function visibleRecipes() {
    const keyword = searchInput.value.trim().toLowerCase();
    let list = recipes;
    if (filterChefId !== "all") {
      list = list.filter((r) => r.chefId === filterChefId);
    }
    if (keyword) {
      list = list.filter((r) => {
        const ingMatch = (r.ingredients || []).some(
          (i) => i.name.toLowerCase().includes(keyword)
        );
        return (
          r.name.toLowerCase().includes(keyword) ||
          r.method.toLowerCase().includes(keyword) ||
          ingMatch
        );
      });
    }
    return list;
  }

  function render() {
    const keyword = searchInput.value.trim().toLowerCase();
    const list = visibleRecipes();

    recipeGrid.innerHTML = "";
    list.forEach((r) => {
      const card = document.createElement("div");
      card.className = "recipe-card";
      card.dataset.id = r.id;

      const stars = "⭐".repeat(r.level || 1);
      const inOrder = order.find((o) => o.id === r.id);
      const checkedToday = checkins.some(
        (c) => c.id === r.id && dateKey(c.ts) === dateKey(Date.now())
      );
      const chef = chefs.find((c) => c.id === r.chefId);
      const catEmoji =
        (CATEGORY_OPTIONS.find((c) => c.value === r.category) || {}).emoji || "🍽️";

      const ingHtml = (r.ingredients || [])
        .map((i) =>
          i.quantity
            ? `<span><strong>${escapeHtml(i.name)}</strong> ${escapeHtml(i.quantity)}</span>`
            : `<span><strong>${escapeHtml(i.name)}</strong></span>`
        )
        .join(" · ");

      card.innerHTML = `
        ${r.image ? `<div class="recipe-img"><img src="${r.image}" alt="${escapeHtml(r.name)}" loading="lazy" /></div>` : ""}
        <div class="card-actions">
          <button class="icon-btn edit" title="编辑">✏️</button>
          <button class="icon-btn del" title="删除">🗑️</button>
        </div>
        <div class="recipe-top">
          <div class="recipe-emoji">${r.emoji || "🍽️"}</div>
          <div>
            <div class="recipe-name">${escapeHtml(r.name)}</div>
            <div class="recipe-level">${stars}</div>
          </div>
        </div>
        <div class="recipe-tags">
          <span class="tag cat">${catEmoji} ${escapeHtml(r.category || "菜式")}</span>
          <span class="tag time">⏰ ${r.time} 分钟</span>
          <span class="tag method">${escapeHtml(r.method)}</span>
          <span class="tag chef">${chef ? `${chef.emoji} ${escapeHtml(chef.name)}` : "🧑‍🍳"}</span>
        </div>
        ${ingHtml ? `<div class="recipe-ing">🥕 ${ingHtml}</div>` : ""}
        ${r.steps ? `<div class="recipe-steps">📝 ${escapeHtml(r.steps)}</div>` : ""}
        <div class="card-actions-row">
          <button type="button" class="btn btn-order">${inOrder ? `🛒 已点 ${inOrder.qty}` : "🛒 点它"}</button>
          <button type="button" class="btn btn-cook">👩‍🍳 做菜</button>
          <button type="button" class="btn btn-checkin ${checkedToday ? "checked" : ""}">${checkedToday ? "✅ 已打卡" : "✅ 打卡"}</button>
        </div>
      `;

      card.querySelector(".icon-btn.edit").addEventListener("click", (e) => {
        e.stopPropagation();
        startEdit(r.id);
      });
      card.querySelector(".icon-btn.del").addEventListener("click", (e) => {
        e.stopPropagation();
        askDelete(r.id);
      });
      card.querySelector(".btn-order").addEventListener("click", (e) => {
        e.stopPropagation();
        addToOrder(r.id);
      });
      card.querySelector(".btn-cook").addEventListener("click", (e) => {
        e.stopPropagation();
        openCooking(r.id);
      });
      card.querySelector(".btn-checkin").addEventListener("click", (e) => {
        e.stopPropagation();
        checkIn(r.id);
      });
      card.addEventListener("click", () => startEdit(r.id));

      recipeGrid.appendChild(card);
    });

    emptyState.hidden = list.length > 0;
    emptyState.querySelector("p").innerHTML = keyword
      ? "😢 没找到匹配的菜菜～<br />换个关键词试试吧！"
      : filterChefId !== "all"
        ? "这位厨师还没有菜谱哦～<br />去添加一道属于 TA 的拿手菜吧！"
        : "还没有菜谱哦～<br />快来添加你的第一道拿手菜吧！";
    countBadge.textContent =
      filterChefId !== "all" || keyword
        ? `显示 ${list.length} / 共 ${recipes.length} 道`
        : `共 ${recipes.length} 道`;
    if (weather) renderWeather(); // 菜谱变化后同步刷新今日推荐
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  /* ---------- 轻提示 ---------- */
  let toastTimer = null;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastEl.hidden = true;
    }, 1800);
  }

  /* ---------- 示例数据（首次使用） ---------- */
  function seedIfEmpty() {
    if (recipes.length === 0 && !localStorage.getItem(STORAGE_KEY)) {
      recipes = [
        {
          id: "demo1",
          name: "番茄炒蛋",
          emoji: "🍅",
          chefId: DEFAULT_CHEF_ID,
          category: "菜式",
          time: 10,
          method: "🔥 炒",
          level: 1,
          ingredients: [
            { name: "番茄", quantity: "2 个" },
            { name: "鸡蛋", quantity: "3 个" },
            { name: "葱花", quantity: "少许" }
          ],
          steps: "鸡蛋打散炒熟盛出；番茄切块下锅炒出汁；倒回鸡蛋，加盐和糖翻炒均匀即可。",
          image: "",
          createdAt: Date.now() - 1000
        },
        {
          id: "demo2",
          name: "清蒸鲈鱼",
          emoji: "🐟",
          chefId: DEFAULT_CHEF_ID,
          category: "菜式",
          time: 20,
          method: "♨️ 蒸",
          level: 2,
          ingredients: [
            { name: "鲈鱼", quantity: "1 条" },
            { name: "姜丝", quantity: "适量" },
            { name: "蒸鱼豉油", quantity: "2 勺" }
          ],
          steps: "鱼身划刀塞姜丝，水开上锅蒸 12 分钟；倒掉汤汁，淋豉油，泼热油激香。",
          image: "",
          createdAt: Date.now() - 500
        }
      ];
      saveRecipes();
    }
  }

  /* ---------- 事件绑定 ---------- */
  function bindEvents() {
    dishForm.addEventListener("submit", handleSubmit);
    addIngBtn.addEventListener("click", () => addIngredientRow());
    toggleFormBtn.addEventListener("click", () => {
      if (!formWrap.hidden) {
        setFormOpen(false);
        return;
      }
      openAddForm();
    });
    formCloseBtn.addEventListener("click", () => {
      exitEditMode();
      resetFormAfterSave();
    });
    cancelEdit.addEventListener("click", () => {
      exitEditMode();
      resetFormAfterSave();
      toast("已取消编辑～");
    });

    // 配图
    imgUpload.addEventListener("click", () => imageInput.click());
    imageInput.addEventListener("change", handleImageSelect);
    removeImageBtn.addEventListener("click", () => {
      resetImageUI();
      toast("📷 图片已移除");
    });

    // 搜索
    searchInput.addEventListener("input", render);

    // 删除弹窗
    modalCancel.addEventListener("click", () => {
      modalMask.hidden = true;
      deleteTarget = null;
    });
    modalMask.addEventListener("click", (e) => {
      if (e.target === modalMask) {
        modalMask.hidden = true;
        deleteTarget = null;
      }
    });
    modalConfirm.addEventListener("click", () => {
      modalMask.hidden = true;
      confirmDelete();
    });

    // 厨师档案
    chefSwitcher.addEventListener("click", openChefModal);
    chefManageBtn.addEventListener("click", openChefModal);
    chefAvatarBtn.addEventListener("click", openAvatarPicker);
    chefClose.addEventListener("click", closeChefModal);
    chefModal.addEventListener("click", (e) => {
      if (e.target === chefModal) closeChefModal();
    });
    chefSave.addEventListener("click", saveChefForm);
    chefCancelEdit.addEventListener("click", () => {
      resetChefForm();
      toast("已取消编辑～");
    });
    chefList.addEventListener("click", (e) => {
      const item = e.target.closest(".chef-item");
      if (!item || !item.dataset.id) return;
      const id = item.dataset.id;
      if (e.target.closest(".icon-btn.edit")) {
        editChef(id);
        return;
      }
      if (e.target.closest(".icon-btn.del")) {
        askDeleteChef(id);
        return;
      }
      if (id !== activeChefId) setActiveChef(id);
    });
    chefFilter.addEventListener("click", (e) => {
      const chip = e.target.closest(".chef-chip");
      if (!chip || !chip.dataset.chef) return;
      setChefFilter(chip.dataset.chef);
    });

    // 头像设置
    avatarClose.addEventListener("click", closeAvatarModal);
    avatarCancel.addEventListener("click", closeAvatarModal);
    avatarModal.addEventListener("click", (e) => {
      if (e.target === avatarModal) closeAvatarModal();
    });
    avatarSave.addEventListener("click", saveAvatar);
    avatarUploadBtn.addEventListener("click", () => avatarFile.click());
    avatarFile.addEventListener("change", handleAvatarFile);
    avatarClearImg.addEventListener("click", () => {
      avatarImg = "";
      avatarFile.value = "";
      renderAvatarPicker();
    });
    avatarGrid.addEventListener("click", (e) => {
      const opt = e.target.closest(".avatar-opt");
      if (!opt) return;
      avatarEmoji = opt.dataset.emoji;
      avatarImg = ""; // 选了 emoji 就换回 emoji 头像
      renderAvatarPicker();
    });
    avatarColors.addEventListener("click", (e) => {
      const opt = e.target.closest(".color-opt");
      if (!opt) return;
      avatarColor = opt.dataset.color || "";
      renderAvatarPicker();
    });

    // 天气与推荐
    weatherRefresh.addEventListener("click", refreshWeather);
    cityGo.addEventListener("click", async () => {
      const city = cityInput.value.trim();
      if (!city) {
        toast("🙈 先输入城市名呀～");
        return;
      }
      const w = await fetchCityWeather(city);
      if (w) {
        weather = w;
        weatherManual.hidden = true;
        renderWeather();
      }
    });
    cityInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") cityGo.click();
    });
    weatherRecoList.addEventListener("click", (e) => {
      const item = e.target.closest(".reco-item");
      if (!item || !item.dataset.id) return;
      if (e.target.closest(".btn-order")) {
        addToOrder(item.dataset.id);
        return;
      }
      openCooking(item.dataset.id);
    });

    // 盲盒
    blindBoxBtn.addEventListener("click", openBlindBox);
    blindClose.addEventListener("click", closeBlindBox);
    blindAgain.addEventListener("click", openBlindBox);
    blindOrder.addEventListener("click", () => {
      if (!blindPicked) return;
      addToOrder(blindPicked.id);
      closeBlindBox();
    });
    blindModal.addEventListener("click", (e) => {
      if (e.target === blindModal) closeBlindBox();
    });

    // 点菜购物篮
    cartFab.addEventListener("click", () => {
      cartDrawer.hidden = !cartDrawer.hidden;
    });
    cartClose.addEventListener("click", () => {
      cartDrawer.hidden = true;
    });
    cartClear.addEventListener("click", clearOrder);
    cartList.addEventListener("click", (e) => {
      const btn = e.target.closest(".qty-btn");
      if (!btn) return;
      const itemEl = btn.closest(".cart-item");
      if (!itemEl || !itemEl.dataset.id) return;
      changeOrderQty(itemEl.dataset.id, btn.dataset.act === "plus" ? 1 : -1);
    });

    // 做菜模式
    cookClose.addEventListener("click", closeCooking);
    cookModal.addEventListener("click", (e) => {
      if (e.target === cookModal) closeCooking();
    });
    timerToggle.addEventListener("click", toggleTimer);
    timerReset.addEventListener("click", resetTimer);
    cookIngredients.addEventListener("click", onCookCheckClick);
    cookSteps.addEventListener("click", onCookCheckClick);
    cookCheckin.addEventListener("click", () => {
      if (!cookRecipeId) return;
      checkIn(cookRecipeId);
    });

    // 打卡本
    checkinBtn.addEventListener("click", openCheckinPanel);
    checkinClose.addEventListener("click", closeCheckinPanel);
    checkinModal.addEventListener("click", (e) => {
      if (e.target === checkinModal) closeCheckinPanel();
    });
    // 可点击统计模块
    document.querySelectorAll(".stat-box").forEach((box) => {
      box.addEventListener("click", () => {
        const kind = box.dataset.detail;
        statDetailKind = statDetailKind === kind ? null : kind;
        renderStatDetail(statDetailKind);
      });
    });

    // 搭配一餐
    mealBtn.addEventListener("click", openMealComposer);
    mealClose.addEventListener("click", closeMealComposer);
    mealModal.addEventListener("click", (e) => {
      if (e.target === mealModal) closeMealComposer();
    });
    mealClear.addEventListener("click", clearMeal);
    mealCheckin.addEventListener("click", checkInMeal);
    mealSections.addEventListener("click", (e) => {
      const item = e.target.closest(".meal-item");
      if (!item || !item.dataset.cat || !item.dataset.id) return;
      toggleMealItem(item.dataset.cat, item.dataset.id);
    });

    // 数据导出 / 导入
    exportBtn.addEventListener("click", exportData);
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", handleImportFile);

    // ESC 关闭所有浮层
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!modalMask.hidden) {
        modalMask.hidden = true;
        deleteTarget = null;
      }
      if (!blindModal.hidden) closeBlindBox();
      if (!cookModal.hidden) closeCooking();
      if (!checkinModal.hidden) closeCheckinPanel();
      if (!chefModal.hidden) closeChefModal();
      if (!avatarModal.hidden) closeAvatarModal();
      if (!mealModal.hidden) closeMealComposer();
      if (!cartDrawer.hidden) cartDrawer.hidden = true;
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    initSelects();
    renderIngredientRows();
    resetImageUI();
    bindEvents();
    seedIfEmpty();
    ensureChefs();
    migrateData();
    renderChefUI();
    render();
    renderCart();
    initWeather();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
