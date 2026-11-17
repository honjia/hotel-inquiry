/* 砍价 · 到店消费询价 Demo
   一套引擎 + 9 份品类配置。只有「店名」和「询价单位」是必填，其余字段可改可删可加。 */
(function () {
  "use strict";

  /* =========================================================
     工具
     ========================================================= */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const pad = (n) => String(n).padStart(2, "0");
  const yuan = (n) => Math.round(n).toLocaleString("zh-CN");
  const money = (n) => "¥" + yuan(n);
  const maskPhone = (p) => (p && p.length >= 11 ? p.slice(0, 3) + "****" + p.slice(7) : p || "");
  const nowLabel = () => { const d = new Date(); return "今天 " + pad(d.getHours()) + ":" + pad(d.getMinutes()); };

  let toastId = null;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg; el.classList.add("on");
    clearTimeout(toastId);
    toastId = setTimeout(() => el.classList.remove("on"), 1900);
  }

  /* =========================================================
     品类配置
     ========================================================= */
  const CATS = {
    hotel: {
      id: "hotel", name: "酒店民宿", short: "酒店",
      store: "秋果酒店（北京三里屯太古里团结湖地铁站店）",
      unit: "1 间夜", price: 661, list: 966, ratio: 0.85,
      merchant: "前台", tel: "010-8532 6688",
      sample: "samples/shot-price.jpg",
      uploadTitle: "上传酒店报价截图",
      uploadSub: "OTA 详情页 / 订单页 / 商家聊天报价",
      hints: ["酒店全称与具体分店", "房型，以及入住与离店日期", "价格，以及含了哪些权益", "早餐、取消政策、有无窗"],
      fields: [
        { l: "房型", v: "阳光双床房" },
        { l: "床型", v: "2 张 1.2 米单人床 · 24–26 m²" },
        { l: "入住", v: "11月12日（今天）" },
        { l: "离店", v: "11月13日（明天）" },
        { l: "已含权益", v: "无早餐 · 有窗 · 18:00 前免费取消" }
      ],
      missing: ["加床政策", "能否延迟退房"],
      needs: ["加双早", "靠窗·高楼层", "延迟退房至14:00", "保持免费取消"],
      needsDefault: ["加双早", "靠窗·高楼层", "保持免费取消"],
      ask: "客人 2 位，需要靠窗、尽量高楼层，另外想加双早",
      ava: "靠窗的有，高楼层今天能给到 6 层",
      step2: "靠窗和高楼层都能安排，加床 150 一晚",
      winBenefit: "含双早 · 靠窗（6 层）",
      winTail: "还多送了双早",
      winExtra: "免费加双早（平台券后价不含早）",
      rule: "11月12日 18:00 前免费取消",
      noneReason: "这几天是展会，价格已经是最低了",
      noneBenefit: "有窗 · 高楼层 · 无早餐",
      noneFree: ["可延迟退房至 14:00 · 视当日房态", "靠窗高楼层可提前锁定，不加价"],
      labels: { quote: "商家报价", benefit: "房型权益", rule: "取消条件" }
    },

    ktv: {
      id: "ktv", name: "KTV", short: "门店",
      sub: "包厢 · 时段",
      store: "星聚会 KTV（三里屯店）",
      unit: "4 小时", price: 1480, list: 1880, ratio: 0.85,
      merchant: "前台", tel: "010-6416 8866",
      uploadTitle: "上传 KTV 团购截图",
      uploadSub: "团购页 / 套餐详情 / 门店聊天报价",
      hints: ["门店全称与分店", "包型，以及可用时段", "套餐价，含不含酒水", "开台费、能否自带酒水"],
      fields: [
        { l: "包型", v: "中包（8–10 人）" },
        { l: "时段", v: "周六 20:00–24:00" },
        { l: "人数", v: "8 人" },
        { l: "最低消费", v: "¥1,480 含酒水 2 支" },
        { l: "已含权益", v: "果盘 · 免开台费 · 不可自带酒水" }
      ],
      missing: ["超时计费", "能否自带酒水"],
      needs: ["送果盘", "可自带酒水", "免开台费", "可延时到 24:30"],
      needsDefault: ["送果盘", "免开台费"],
      ask: "客人 8 位，要中包，能不能送个果盘、开台费免掉",
      ava: "中包这个时段还剩两间",
      step2: "果盘能送，自带酒水收 50 开瓶费",
      winBenefit: "送果盘 · 开台费免了",
      winTail: "另外把开台费免了",
      winExtra: "开台费已免（原 ¥200/间）",
      rule: "周六 20:00–24:00 可用，超时按 200/小时",
      noneReason: "周末黄金场不打折",
      noneBenefit: "中包 · 含果盘 · 不可自带酒水",
      noneFree: ["果盘可以送", "开台费免不了，但可以免进场费"],
      labels: { quote: "包间报价", benefit: "包间与权益", rule: "使用规则" }
    },

    massage: {
      id: "massage", name: "按摩足疗", short: "门店",
      sub: "项目 · 人次",
      store: "足间道 · 足疗（国贸店）",
      unit: "2 人次", price: 796, list: 916, ratio: 0.85,
      merchant: "门店", tel: "010-5900 2233",
      uploadTitle: "上传按摩足疗团购截图",
      uploadSub: "团购页 / 项目详情 / 门店聊天报价",
      hints: ["门店全称与分店", "项目名与时长", "单价，以及是否含服务费", "能否指定技师、加钟价格"],
      fields: [
        { l: "项目", v: "中式推拿 90 分钟 ×2" },
        { l: "技师等级", v: "高级技师" },
        { l: "包间", v: "双人包间" },
        { l: "服务费", v: "含 10% 服务费" },
        { l: "已含权益", v: "茶水小食 · 可淋浴 · 需 22:00 前到店" }
      ],
      missing: ["加钟价格", "能否指定技师"],
      needs: ["指定技师", "双人包间", "加钟 30 分钟", "含茶水小食"],
      needsDefault: ["指定技师", "双人包间"],
      ask: "两个人做 90 分钟中式，要双人包间，能不能指定技师",
      ava: "高级技师晚上还有两位",
      step2: "双人包间有，加钟 168 半小时",
      winBenefit: "双人包间 · 指定高级技师",
      winTail: "还送了 30 分钟加钟",
      winExtra: "送 30 分钟加钟（价值 ¥168）",
      rule: "22:00 前到店有效，可改期一次",
      noneReason: "周末技师排得满，价格让不了",
      noneBenefit: "双人包间 · 高级技师 · 含茶水",
      noneFree: ["送 30 分钟加钟", "可延迟到 22:30 到店"],
      labels: { quote: "门店报价", benefit: "项目与技师", rule: "到店规则" }
    },

    bar: {
      id: "bar", name: "酒吧", short: "订台",
      sub: "卡座 · 低消",
      store: "OLD LIVE 酒馆（三里屯店）",
      unit: "1 卡座", price: 3000, list: 3600, ratio: 0.85,
      merchant: "订台", tel: "010-6417 5522",
      uploadTitle: "上传酒吧卡座报价截图",
      uploadSub: "订台页 / 套餐详情 / 销售聊天报价",
      hints: ["门店全称与分店", "卡座类型与日期", "低消金额，含不含酒水", "入场费、开瓶费、周末加价"],
      fields: [
        { l: "卡座类型", v: "沙发卡座（6–8 人）" },
        { l: "日期", v: "周五 21:00 起" },
        { l: "低消", v: "¥3,000（含酒水）" },
        { l: "入场费", v: "¥100/人" },
        { l: "已含权益", v: "含果盘 · 含 2 支洋酒 · 21:00 前到店" }
      ],
      missing: ["能否抵扣门票", "是否可自带酒水"],
      needs: ["免入场费", "含洋酒", "靠舞台", "可自带酒"],
      needsDefault: ["免入场费", "含洋酒", "靠舞台"],
      ask: "六到八位，要沙发卡座，想问低消能不能降、入场费能不能免",
      ava: "周五沙发卡座还有两个",
      step2: "靠舞台那一侧还有位置，入场费可以免",
      winBenefit: "沙发卡座 · 低消 ¥2,400",
      winTail: "入场费也免了",
      winExtra: "入场费已免（原 ¥100/人）",
      rule: "周五 21:00 前到店，低消可抵扣酒水",
      noneReason: "周五卡座紧张，低消不能再降",
      noneBenefit: "沙发卡座 · 低消 ¥3,000 · 含 2 支洋酒",
      noneFree: ["入场费免了", "送一份果盘和小食"],
      labels: { quote: "卡座报价", benefit: "卡座与含项", rule: "到店规则" }
    },

    gym: {
      id: "gym", name: "健身房", short: "会籍",
      sub: "卡种 · 有效期",
      store: "超级猩猩（国贸店）",
      unit: "12 次", price: 2388, list: 2988, ratio: 0.85,
      merchant: "会籍顾问", tel: "010-8532 1177",
      uploadTitle: "上传健身卡报价截图",
      uploadSub: "会员页 / 卡种详情 / 顾问聊天报价",
      hints: ["门店全称与分店", "卡种与次数", "有效期、能否转卡", "含不含体测和私教"],
      fields: [
        { l: "卡种", v: "12 次团课卡" },
        { l: "有效期", v: "12 个月" },
        { l: "私教", v: "不含私教" },
        { l: "场馆", v: "国贸店 · 全时段" },
        { l: "已含权益", v: "含体测 · 团课预约 · 不可转卡" }
      ],
      missing: ["能否转卡", "停卡政策"],
      needs: ["送体测", "送私教体验", "可转卡", "可停卡"],
      needsDefault: ["送体测", "送私教体验"],
      ask: "想要 12 次团课卡，能不能送体测和两节私教体验",
      ava: "12 次卡这个月有活动",
      step2: "体测是含的，私教体验可以给一节",
      winBenefit: "12 次团课卡 · 含体测",
      winTail: "另送 2 节私教体验",
      winExtra: "送 2 节私教体验（价值 ¥600）",
      rule: "12 个月内有效，可停卡一次",
      noneReason: "活动价已经到底了",
      noneBenefit: "12 次团课卡 · 含体测 · 不可转卡",
      noneFree: ["送 1 节私教体验", "可停卡一次"],
      labels: { quote: "门店报价", benefit: "卡种与权益", rule: "有效期" }
    },

    sauna: {
      id: "sauna", name: "洗浴桑拿", short: "前台",
      sub: "门票 · 人次",
      store: "汤泉良子（望京店）",
      unit: "2 人次", price: 516, list: 636, ratio: 0.85,
      merchant: "前台", tel: "010-8471 9900",
      uploadTitle: "上传洗浴门票截图",
      uploadSub: "团购页 / 门票详情 / 门店聊天报价",
      hints: ["门店全称与分店", "门票类型与人数", "含不含餐和搓澡", "过夜是否加钱"],
      fields: [
        { l: "门票类型", v: "全天门票" },
        { l: "含餐", v: "含自助餐 1 次" },
        { l: "搓澡", v: "不含搓澡" },
        { l: "过夜", v: "可过夜" },
        { l: "已含权益", v: "含汗蒸 · 含休息区 · 需 24:00 前入场" }
      ],
      missing: ["搓澡加价", "过夜是否加钱"],
      needs: ["含搓澡", "含自助餐", "可过夜", "免过夜费"],
      needsDefault: ["含搓澡", "含自助餐"],
      ask: "两个人，全天票，想问能不能含搓澡、过夜加不加钱",
      ava: "全天票随时能用",
      step2: "搓澡 68 一位，过夜加 30",
      winBenefit: "含搓澡 · 含自助餐",
      winTail: "过夜也不加钱了",
      winExtra: "过夜免费（原加 ¥30）",
      rule: "24:00 前入场，可过夜至次日 12:00",
      noneReason: "门票是明码标价，让不了",
      noneBenefit: "全天票 · 含自助餐 · 不含搓澡",
      noneFree: ["搓澡按 68/位", "过夜加 30"],
      labels: { quote: "门票报价", benefit: "门票与含项", rule: "入场规则" }
    },

  };

  const LEISURE = ["ktv", "massage", "bar", "gym", "sauna"];



  /* =========================================================
     状态
     ========================================================= */
  let CAT = CATS.hotel;
  let kind = "hotel";            // hotel | leisure

  const CONTACT_KEY = "kanjia.contact.v1";
  function savedContact() {
    try {
      const v = JSON.parse(localStorage.getItem(CONTACT_KEY) || "null");
      return v && v.phone ? v : null;
    } catch (e) { return null; }
  }
  function persistContact(c) {
    try { localStorage.setItem(CONTACT_KEY, JSON.stringify(c)); } catch (e) {}
  }

  const state = {
    scenario: "win",
    store: "", unit: "", price: 0, list: 0,
    fields: [],            // 可选字段 [{l,v}]
    needs: [],
    contact: savedContact() || { name: "", phone: "" },
    shotURL: null
  };

  const dealOf = (p, c) => Math.round(p * c.ratio);
  const summarize = () => (state.fields[0] ? state.fields[0].v : "") + " · " + state.unit;

  /* =========================================================
     ① 首页
     ========================================================= */
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  const LEISURE_HINTS = [
    "门店全称与具体分店",
    "套餐或项目名称",
    "价格，以及按什么单位计价（人均 / 台 / 包间）",
    "可用时段、含了哪些东西、有没有额外收费"
  ];

  function renderHome() {
    const isLeisure = kind === "leisure";
    const brandSub = isLeisure ? "休闲娱乐" : "酒店民宿";
    const lead = isLeisure
      ? "KTV、按摩、酒吧、健身、洗浴，团购价不一定是最低的价格。传一张团购截图，助理替你跟门店把价格谈一谈。"
      : "不用自己找电话、不用重复讲需求。助理替你联系酒店、确认房型和权益、问清优惠，最后给你一张说得清的结果。";
    const uploadTitle = isLeisure ? "上传门店报价截图" : "上传酒店报价截图";
    const uploadSub = isLeisure ? "团购页 / 套餐详情 / 门店聊天报价" : "OTA 详情页 / 订单页 / 商家聊天报价";
    const hints = isLeisure ? LEISURE_HINTS : CAT.hints;

    $("#homeBody").innerHTML =
      '<div class="brand"><i></i><span>砍价</span><em>' + brandSub + "</em></div>" +
      '<h1 class="h1">上传截图<br>剩下的交给助理去问</h1>' +
      '<p class="lead">' + lead + "</p>" +
      '<div id="homeUpload">' +
        '<button class="upload" id="uploadBox">' +
          '<span class="ic">＋</span>' +
          '<span class="t">' + esc(uploadTitle) + "</span>" +
          '<span class="s">' + esc(uploadSub) + "</span>" +
        "</button>" +
        '<button class="sample-link" id="sampleBtn"><u>用示例截图试一下</u></button>' +
      "</div>" +
      '<div id="scanView" style="display:none">' +
        '<div class="scan-wrap scanning" id="scanWrap">' +
          '<div class="shot-col"><img id="shotImg" alt="报价截图" /><div class="scanline"></div></div>' +
          '<div class="fields-col" id="fieldsCol"></div>' +
        "</div>" +
        '<div class="scan-tip" id="scanTip">正在读取截图中的报价信息…</div>' +
      "</div>" +
      '<div class="hint-card" id="hintCard">' +
        '<div class="hint-h">标准截图需要包含</div>' +
        "<ul class=\"hint-list\">" + hints.map((h) => "<li>" + h + "</li>").join("") + "</ul>" +
        '<div class="hint-f">缺什么会单独让你补，助理不会替你猜条件或编权益。</div>' +
      "</div>" +
      '<p class="home-foot">截图只用于识别本次报价，不保存、不上传相册。</p>';

    $("#uploadBox").addEventListener("click", () => $("#fileInput").click());
    $("#sampleBtn").addEventListener("click", () => startScan(sampleFor(CAT)));
  }

  /* 示例截图：酒店用真实截图，其余品类按配置生成一张团购卡 */
  function sampleFor(c) {
    if (c.sample) return c.sample;
    const rows = c.fields.slice(0, 3).map((f) =>
      '<text x="24" y="' + (300 + c.fields.indexOf(f) * 22) + '" font-size="10" fill="#8A8078">' + esc(f.l) + "：" + esc(f.v) + "</text>"
    ).join("");
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 620" width="300" height="620">' +
      '<rect width="300" height="620" fill="#fff"/>' +
      '<rect width="300" height="150" fill="#DCC3A6"/>' +
      '<path d="M0 150 L70 90 L120 126 L190 70 L300 120 L300 150 Z" fill="#8A6248" opacity=".35"/>' +
      '<circle cx="30" cy="30" r="13" fill="#fff" opacity=".85"/>' +
      '<text x="16" y="196" font-size="15" font-weight="700" fill="#2B2521" font-family="PingFang SC,Microsoft YaHei">' + esc(c.store.slice(0, 14)) + "</text>" +
      '<text x="16" y="216" font-size="11" fill="#9C9084" font-family="PingFang SC,Microsoft YaHei">' + esc(c.name) + " · 团购套餐</text>" +
      '<rect x="16" y="230" width="52" height="18" rx="4" fill="#FFF0E4"/>' +
      '<text x="42" y="242.5" font-size="9.5" font-weight="700" fill="#C2643F" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei">团购价</text>' +
      '<rect x="12" y="266" width="276" height="230" rx="12" fill="#fff" stroke="#EFE7DA"/>' +
      '<text x="24" y="286" font-size="12.5" font-weight="700" fill="#2B2521" font-family="PingFang SC,Microsoft YaHei">' + esc(c.fields[0].v) + "</text>" +
      rows +
      '<text x="24" y="470" font-size="10" fill="#9C9084" font-family="PingFang SC,Microsoft YaHei">原价</text>' +
      '<text x="60" y="470" font-size="11" fill="#9C9084" text-decoration="line-through" font-family="PingFang SC,Microsoft YaHei">¥' + c.list + "</text>" +
      '<text x="24" y="510" font-size="26" font-weight="700" fill="#BC5F35" font-family="PingFang SC,Microsoft YaHei">¥' + c.price + "</text>" +
      '<text x="24" y="530" font-size="10" fill="#9C9084" font-family="PingFang SC,Microsoft YaHei">' + esc(c.unit) + "</text>" +
      '<rect x="200" y="486" width="76" height="28" rx="9" fill="#BC5F35"/>' +
      '<text x="238" y="505" font-size="12" font-weight="700" fill="#fff" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei">抢购</text>' +
      '<text x="150" y="590" font-size="9" fill="#B6AA9A" text-anchor="middle" font-family="PingFang SC,Microsoft YaHei">截图仅用于演示 · 非真实报价</text>' +
      "</svg>";
    return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  }

  function startScan(url) {
    state.shotURL = url;
    $("#homeUpload").style.display = "none";
    $("#scanView").style.display = "block";
    $("#hintCard").style.display = "none";
    $("#shotImg").src = url;

    const col = $("#fieldsCol");
    col.classList.remove("show");
    const rows = (kind === "leisure" ? [{ l: "品类", v: CAT.name }] : [])
      .concat([{ l: "店名", v: CAT.store }, { l: "询价单位", v: CAT.unit }])
      .concat(CAT.fields.slice(0, kind === "leisure" ? 2 : 3));
    col.innerHTML = rows.map((f) =>
      '<div class="frow"><div class="fk">' + esc(f.l || f.k) + '</div><div class="fv">' + esc(f.v) + "</div></div>"
    ).join("");

    const wrap = $("#scanWrap");
    wrap.classList.add("scanning");
    $("#scanTip").textContent = "正在读取截图中的报价信息…";
    setTimeout(() => col.classList.add("show"), 120);
    setTimeout(() => { $("#scanTip").textContent = "已识别 " + rows.length + " 项 · 有 " + CAT.missing.length + " 项需要你补充"; }, 1700);
    setTimeout(() => { wrap.classList.remove("scanning"); commitScan(); go("s2", 1); }, 2650);
  }

  function commitScan() {
    editingContact = false;
    state.store = CAT.store;
    state.unit = CAT.unit;
    state.price = CAT.price;
    state.list = CAT.list;
    state.fields = CAT.fields.map((f) => ({ l: f.l, v: f.v }));
    state.needs = CAT.needsDefault.slice();
  }

  function resetHome() {
    const hu = $("#homeUpload");
    if (!hu) return;
    hu.style.display = "";
    $("#scanView").style.display = "none";
    $("#hintCard").style.display = "";
    $("#fieldsCol").classList.remove("show");
    $("#scanWrap").classList.remove("scanning");
  }

  $("#fileInput").addEventListener("change", function (e) {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!/^image\//.test(f.type)) { toast("请选择图片文件"); return; }
    startScan(URL.createObjectURL(f));
    e.target.value = "";
  });

  /* =========================================================
     ② 确认询价单
     ========================================================= */
  function renderConfirm() {
    const c = CAT;
    const fieldRows = state.fields.map((f, i) =>
      '<div class="kv">' +
        '<span class="k editable" data-l="' + i + '">' + esc(f.l) + "</span>" +
        '<span class="v editable" data-v="' + i + '">' + (esc(f.v) || '<span style="color:#C6BAA9">未填写</span>') + "</span>" +
        '<button class="kf-del" data-del="' + i + '" title="删除这一项">×</button>' +
      "</div>"
    ).join("");

    $("#confirmBody").innerHTML =
      '<div class="src-strip">' +
        '<img id="srcThumb" alt="来源截图" />' +
        '<div class="ss-main"><div class="ss-t">已从截图识别 ' + (state.fields.length + (kind === "leisure" ? 3 : 2)) + " 项字段</div>" +
        '<div class="ss-s">店名和询价单位必填，其余可改可删</div></div>' +
        '<button class="ss-btn" id="btnViewShot">查看原图</button>' +
      "</div>" +

      '<div class="sec-h">门店与单位</div>' +
      '<div class="card">' +
        (kind === "leisure"
          ? '<div class="kv"><span class="k">品类</span>' +
            '<span class="v">' + esc(c.name) + '<button class="ss-btn" id="btnChangeCat" style="margin-left:9px">换</button></span></div>'
          : "") +
        '<div class="kv block"><span class="k">店名<span class="req-dot"></span></span>' +
          '<span class="v editable" data-store="1">' + esc(state.store) + "</span></div>" +
        '<div class="kv"><span class="k">询价单位<span class="req-dot"></span></span>' +
          '<span class="v editable" data-unit="1">' + esc(state.unit) + "</span></div>" +
      "</div>" +

      '<div class="sec-h row-h"><span>报价</span><em>只记总价</em></div>' +
      '<div class="card flat" style="padding:15px 16px">' +
        '<div class="pricebox">' +
          '<span class="amt" id="priceAmt"><small>¥</small>' + yuan(state.price) + "</span>" +
          '<span class="per">/ ' + esc(state.unit) + "</span>" +
          (state.list ? '<span class="was">原价 ' + money(state.list) + "</span>" : "") +
        "</div>" +
        '<div class="ptarget">' +
          '<div class="pt-l">' +
            '<span class="pt-k">议价目标</span>' +
            '<span class="pt-v">' + money(dealOf(state.price, c)) +
              "<i>– " + money(state.price) + "</i></span>" +
          "</div>" +
          '<span class="pt-tag">按标价低 15%</span>' +
        "</div>" +
        '<div class="pt-note">价格取自截图，点数字可改。助理按下限为目标去谈，谈不到会如实回报实际报价。</div>' +
      "</div>" +

      '<div class="sec-h row-h"><span>其他条件</span><em>非必填</em></div>' +
      '<div class="card">' + fieldRows + "</div>" +
      '<button class="addfield" id="addField">＋ 添加一项</button>' +

      '<div class="warn"><span class="ex">!</span><div>' +
        '<div class="wt">截图缺失 ' + c.missing.length + " 项，需要你补充</div>" +
        '<div class="wb">「' + c.missing.join("」「") + "」在截图中没有出现，助理不会自行假设，请在下一步勾选或备注。</div>" +
      "</div></div>";

    $("#srcThumb").src = state.shotURL || sampleFor(c);
    if ($("#btnChangeCat")) $("#btnChangeCat").addEventListener("click", openCatSheet);
    $("#btnViewShot").addEventListener("click", function () {
      openSheet("来源截图", "识别字段均取自这张截图",
        '<img src="' + (state.shotURL || sampleFor(CAT)) + '" style="width:100%;border-radius:14px;display:block;border:1px solid var(--line)" alt="来源截图">');
    });
  }

  /* 事件委托绑一次就够：#confirmBody 本身不会被替换 */
  function bindConfirm() {
    $("#confirmBody").addEventListener("click", function (e) {
      const del = e.target.closest("[data-del]");
      if (del) { state.fields.splice(+del.dataset.del, 1); renderConfirm(); return; }
      if (e.target.closest("#addField")) {
        state.fields.push({ l: "补充项", v: "" });
        renderConfirm();
        const rows = $("#confirmBody").querySelectorAll("[data-v]");
        const last = rows[rows.length - 1];
        if (last) editField(last, "v", state.fields.length - 1);
        return;
      }
      const amt = e.target.closest("#priceAmt");
      if (amt) { editPrice(); return; }
      const dv = e.target.closest("[data-v]");
      if (dv) { editField(dv, "v", +dv.dataset.v); return; }
      const dl = e.target.closest("[data-l]");
      if (dl) { editField(dl, "l", +dl.dataset.l); return; }
      const st = e.target.closest("[data-store]");
      if (st) { editSimple(st, () => state.store, (v) => state.store = v); return; }
      const un = e.target.closest("[data-unit]");
      if (un) { editSimple(un, () => state.unit, (v) => state.unit = v); return; }
    });
  }

  function editField(el, key, i) {
    if (el.querySelector("input")) return;
    const cur = state.fields[i][key] || "";
    el.innerHTML = '<input class="edit-in" value="' + esc(cur) + '" placeholder="' + (key === "l" ? "字段名" : "填写") + '">';
    const inp = el.querySelector("input");
    inp.focus(); inp.select();
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = inp.value.trim();
      state.fields[i][key] = v || (key === "l" ? "补充项" : "");
      renderConfirm();
    };
    inp.addEventListener("blur", commit);
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") inp.blur(); });
  }

  function editSimple(el, get, set) {
    if (el.querySelector("input")) return;
    el.innerHTML = '<input class="edit-in" value="' + esc(get()) + '">';
    const inp = el.querySelector("input");
    inp.focus(); inp.select();
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = inp.value.trim();
      if (v) set(v);
      renderConfirm();
    };
    inp.addEventListener("blur", commit);
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") inp.blur(); });
  }

  function editPrice() {
    const el = $("#priceAmt");
    if (el.querySelector("input")) return;
    el.innerHTML = '<input class="edit-in" style="font-size:22px;width:120px" value="' + state.price + '">';
    const inp = el.querySelector("input");
    inp.focus(); inp.select();
    let done = false;
    const commit = () => {
      if (done) return; done = true;
      const v = parseInt(String(inp.value).replace(/\D/g, ""), 10);
      if (v > 0) state.price = v;
      renderConfirm();
    };
    inp.addEventListener("blur", commit);
    inp.addEventListener("keydown", (ev) => { if (ev.key === "Enter") inp.blur(); });
  }

  /* =========================================================
     ③ 确认需求
     ========================================================= */
  function renderNeeds() {
    const c = CAT;
    const known = savedContact();
    const showInputs = !known || editingContact;
    const showCat = kind === "leisure";

    $("#needsBody").innerHTML =
      '<p class="lead" style="margin:2px 0 4px">助理会按截图里的条件去问，有特别要求写在备注里就行。</p>' +

      '<div class="sec-h">本次询价</div>' +
      '<div class="room-lock">' +
        '<div class="rl-t">' + esc(state.store) + '<span class="lock">不可改</span></div>' +
        '<div class="rl-s">' + (showCat ? esc(c.name) + " · " : "") + esc(state.unit) + " · " + money(state.price) + "</div>" +
        '<div class="rl-n">需要换门店或套餐请回到上一步修改，助理会按新条件重新询价。</div>' +
      "</div>" +

      '<div class="sec-h">补充备注（可选）</div>' +
      '<textarea class="note-box" id="noteBox" rows="2" placeholder="例：需要发票、同行有老人小孩、预计几点到店…"></textarea>' +

      (showInputs
        ? '<div class="sec-h row-h"><span>联系人</span><em>必填 · 仅首次填写</em></div>' +
          '<div class="card" style="padding:2px 16px">' +
            '<div class="contact-row"><span class="ck">姓名</span><input id="cName" type="text" maxlength="10" placeholder="例：王先生" autocomplete="off" /></div>' +
            '<div class="contact-row"><span class="ck">手机号</span><input id="cPhone" type="tel" maxlength="11" inputmode="numeric" placeholder="11 位手机号" autocomplete="off" /></div>' +
          "</div>" +
          '<div class="contact-tip">助理以这个名字向' + (c.id === "hotel" ? "酒店" : "门店") + "锁位，" + c.merchant + "回电也打这个号码。填一次，以后不用再填。</div>"
        : '<div class="sec-h row-h"><span>联系人</span><em>已保存</em></div>' +
          '<div class="card" style="padding:2px 16px">' +
            '<div class="kv"><span class="k">' + esc(known.name) + '</span>' +
              '<span class="v" style="display:flex;align-items:center;gap:10px;justify-content:flex-end">' +
                maskPhone(known.phone) +
                '<button class="ss-btn" id="btnEditContact">修改</button>' +
              "</span></div>" +
          "</div>") +
      "";

    if (showInputs) {
      $("#cName").value = state.contact.name;
      $("#cPhone").value = state.contact.phone;
      $("#cName").addEventListener("input", function () {
        state.contact.name = this.value.trim();
        refreshStart();
      });
      $("#cPhone").addEventListener("input", function () {
        this.value = this.value.replace(/\D/g, "").slice(0, 11);
        state.contact.phone = this.value;
        refreshStart();
      });
    } else {
      state.contact = { name: known.name, phone: known.phone };
      $("#btnEditContact").addEventListener("click", function () {
        editingContact = true;
        renderNeeds();
      });
    }
    refreshStart();
  }

  let editingContact = false;

  function contactOK() {
    const n = (state.contact.name || "").trim();
    const p = (state.contact.phone || "").replace(/\s/g, "");
    return n.length >= 1 && n.length <= 10 && /^1[3-9]\d{9}$/.test(p);
  }
  function refreshStart() {
    if (!$("#btnStart")) return;
    const ok = contactOK();
    $("#btnStart").disabled = !ok;
    $("#startNote").textContent = ok
      ? "助理以「" + state.contact.name + "」的名义联系" + CAT.merchant + "，谈妥后只回报结果"
      : "填写姓名和手机号后即可开始询价";
  }

  /* =========================================================
     ④ 进度（时间轴驱动，可中断可恢复）
     ========================================================= */
  const RUN_MS = { win: 56000, none: 56000, fail: 26000 };
  const STEP_TXT = {
    win: ["已完成", "已接通", "已确认", "已争取", "已完成"],
    none: ["已完成", "已接通", "已确认", "无让步", "已完成"],
    fail: ["已完成", "未接通 2 次", "未进行", "未进行", "未进行"]
  };
  const PHASES = {
    win: [
      { at: 0, done: [], run: 0, call: "正在整理需求…", meta: "待发起" },
      { at: 3400, done: [0], run: 1, call: "正在呼叫{m}", meta: "拨号中" },
      { at: 9200, done: [0], run: 1, call: "通话中", meta: "已接通", wave: 1 },
      { at: 15000, done: [0, 1], run: 2, call: "正在说明需求", meta: "通话中", wave: 1 },
      { at: 27000, done: [0, 1, 2], run: 3, call: "正在申请直订价", meta: "通话中", wave: 1 },
      { at: 41000, done: [0, 1, 2, 3], run: 4, call: "正在整理结果", meta: "已挂断" },
      { at: 50000, done: [0, 1, 2, 3, 4], run: -1, call: "已结束通话", meta: "已挂断" }
    ],
    none: [
      { at: 0, done: [], run: 0, call: "正在整理需求…", meta: "待发起" },
      { at: 3400, done: [0], run: 1, call: "正在呼叫{m}", meta: "拨号中" },
      { at: 9600, done: [0], run: 1, call: "通话中", meta: "已接通", wave: 1 },
      { at: 16000, done: [0, 1], run: 2, call: "正在说明需求", meta: "通话中", wave: 1 },
      { at: 29000, done: [0, 1, 2], run: 3, call: "正在询问优惠", meta: "通话中", wave: 1 },
      { at: 42000, done: [0, 1, 2, 3], run: 4, call: "正在整理结果", meta: "已挂断" },
      { at: 50000, done: [0, 1, 2, 3, 4], run: -1, call: "已结束通话", meta: "已挂断" }
    ],
    fail: [
      { at: 0, done: [], run: 0, call: "正在整理需求…", meta: "待发起" },
      { at: 3000, done: [0], run: 1, call: "正在呼叫{m}", meta: "第 1 次" },
      { at: 13000, done: [0], run: 1, call: "第 2 次重拨", meta: "第 2 次" },
      { at: 22000, done: [0], run: -1, fail: 1, skipFrom: 2, call: "两次均无人接听", meta: "已挂断" }
    ]
  };

  let activeRec = null, progTimer = null;

  function phaseAt(el, scn) {
    const ph = PHASES[scn] || PHASES.win;
    let cur = ph[0];
    for (let i = 0; i < ph.length; i++) if (el >= ph[i].at) cur = ph[i];
    return cur;
  }

  function buildSteps() {
    const c = CAT;
    const defs = [
      { t: "整理需求", sub: "已从截图整理条件 " + (state.fields.length + 2) + " 项" },
      { t: "联系" + (c.id === "hotel" ? "酒店" : "门店"), sub: c.merchant + " · " + c.tel },
      { t: "确认条件与权益", sub: c.winBenefit },
      { t: "询问优惠", sub: c.labels.quote + " · 当场可付" },
      { t: "整理结果", sub: "已生成结果卡" }
    ];
    $("#steps").innerHTML = defs.map((s, i) =>
      '<div class="step" data-i="' + i + '" data-state="">' +
        '<div class="rail"><span class="dot"></span><span class="line"></span></div>' +
        '<div class="step-main">' +
          '<div class="step-top"><span class="step-t">' + s.t + '</span><span class="step-st">等待</span></div>' +
          '<div class="step-sub">' + esc(s.sub) + "</div>" +
          '<button class="step-more">查看对话</button>' +
          '<div class="talk"><div class="talk-in"></div></div>' +
        "</div></div>"
    ).join("");
  }

  function talkFor(rec) {
    const c = CATS[rec.cat];
    const P = rec.price, D = dealOf(P, c), u = rec.unit;
    const wants = rec.needs.length ? rec.needs.join("、") : "按截图里的条件";
    const T = {
      win: [
        [{ k: "sys", t: "16:51:44", x: "已从截图提取 " + (rec.fields.length + 2) + " 项信息" },
         { k: "sys", t: "16:51:45", x: "询价要点：" + u + " · " + wants }],
        [{ k: "sys", t: "16:52:08", x: "正在呼叫 " + c.store + "（" + c.merchant + "）" },
         { k: "sys", t: "16:52:26", x: "已接通" },
         { k: "mer", t: "16:52:29", x: "您好，" + shortName(c.store) + "。" },
         { k: "ai", t: "16:52:36", x: "您好，想咨询 " + u + " 的报价，客人" + c.ask + "。" },
         { k: "mer", t: "16:52:58", x: c.ava + "。按平台价是 " + P + "。" }],
        [{ k: "ai", t: "16:53:06", x: "这些条件都能一起安排吗？" },
         { k: "mer", t: "16:53:19", x: c.step2 + "。" },
         { k: "ai", t: "16:53:27", x: "好的，麻烦您。" }],
        [{ k: "ai", t: "16:53:34", x: "如果直接跟你们订、不走平台，能给到什么价？客人现在就能付。" },
         { k: "mer", t: "16:53:52", x: "稍等，我算一下。" },
         { k: "sys", t: "16:53:53", x: "商家查询中 · 等待 18 秒" },
         { k: "mer", t: "16:54:11", x: D + "，" + c.winBenefit + "。" },
         { k: "ai", t: "16:54:19", x: "确认一下：" + D + " 是 " + u + " 的总价、" + c.winBenefit + "、" + c.rule + "，对吗？" },
         { k: "mer", t: "16:54:27", x: "对。这个价留到今晚 8 点。" }],
        [{ k: "sys", t: "16:54:34", x: "已记录商家口头承诺，价格有效期今天 20:00" },
         { k: "sys", t: "16:54:36", x: "已生成结果卡" }]
      ],
      none: [
        [{ k: "sys", t: "16:51:44", x: "已从截图提取 " + (rec.fields.length + 2) + " 项信息" },
         { k: "sys", t: "16:51:45", x: "询价要点：" + u + " · " + wants }],
        [{ k: "sys", t: "16:52:08", x: "正在呼叫 " + c.store + "（" + c.merchant + "）" },
         { k: "sys", t: "16:52:24", x: "已接通" },
         { k: "mer", t: "16:52:27", x: "您好。" },
         { k: "ai", t: "16:52:34", x: "您好，咨询 " + u + " 的价格，客人" + c.ask + "。" },
         { k: "mer", t: "16:52:53", x: c.noneReason + "。" }],
        [{ k: "ai", t: "16:52:59", x: "这些条件能安排吗？" },
         { k: "mer", t: "16:53:10", x: c.step2 + "。" }],
        [{ k: "ai", t: "16:53:16", x: "如果直接跟你们订呢？客人现在就能付全款。" },
         { k: "mer", t: "16:53:34", x: "直订和平台一个价，" + P + "。" },
         { k: "mer", t: "16:53:48", x: c.noneBenefit + "。" },
         { k: "ai", t: "16:54:02", x: "明白，就是价格不动，对吧？" },
         { k: "mer", t: "16:54:09", x: "对。" }],
        [{ k: "sys", t: "16:54:17", x: "未取得价格让步，已记录商家回复与额外权益" },
         { k: "sys", t: "16:54:19", x: "已生成结果卡" }]
      ],
      fail: [
        [{ k: "sys", t: "16:51:44", x: "已从截图提取 " + (rec.fields.length + 2) + " 项信息" },
         { k: "sys", t: "16:51:45", x: "询价要点：" + u + " · " + wants }],
        [{ k: "sys", t: "16:52:08", x: "第 1 次呼叫 " + c.tel },
         { k: "sys", t: "16:52:53", x: "无人接听（45 秒）" },
         { k: "sys", t: "16:53:04", x: "第 2 次呼叫 " + c.tel },
         { k: "sys", t: "16:53:49", x: "无人接听（45 秒）" },
         { k: "sys", t: "16:53:52", x: c.merchant + "无应答，未转接语音信箱，未留口信" }],
        [], [], []
      ]
    };
    return T[rec.scn] || T.win;
  }

  function bubbleHTML(b) {
    const who = b.k === "mer" ? "商家" : b.k === "ai" ? "助理" : "";
    if (b.k === "sys") return '<div class="bub sys">' + b.t + " · " + b.x + "</div>";
    return '<div class="bub ' + b.k + '"><div class="bt">' + who + " · " + b.t + "</div>" + b.x + "</div>";
  }

  function fillTalk(i) {
    const step = document.querySelector('.step[data-i="' + i + '"]');
    if (!step || !activeRec) return;
    const box = step.querySelector(".talk-in");
    if (box.innerHTML) return;
    const list = (talkFor(activeRec) || [])[i] || [];
    if (!list.length) return;
    box.innerHTML = list.map(bubbleHTML).join("");
    step.querySelector(".step-more").classList.add("show");
  }

  function paintProgress(el, scn) {
    const cur = phaseAt(el, scn);
    const txt = STEP_TXT[scn] || STEP_TXT.win;
    for (let i = 0; i < 5; i++) {
      let cls = "", st = "等待";
      if (cur.skipFrom !== undefined && i >= cur.skipFrom) { cls = "is-skip"; st = "未进行"; }
      else if (cur.fail === i) { cls = "is-fail"; st = txt[i]; }
      else if (cur.done.indexOf(i) > -1) { cls = "is-done"; st = txt[i]; }
      else if (cur.run === i) { cls = "is-run"; st = "进行中"; }
      const step = document.querySelector('.step[data-i="' + i + '"]');
      if (!step) continue;
      if (step.dataset.state !== cls) {
        step.classList.remove("is-run", "is-done", "is-fail", "is-skip");
        if (cls) step.classList.add(cls);
        step.dataset.state = cls;
      }
      const stEl = step.querySelector(".step-st");
      if (stEl.textContent !== st) stEl.textContent = st;
      if (cls === "is-done" || cls === "is-fail") fillTalk(i);
    }
    const cs = $("#callStatus"), cm = $("#callMeta");
    const callTxt = cur.call.replace("{m}", (CATS[CAT.id] || CAT).merchant);
    if (cs.textContent !== callTxt) cs.textContent = callTxt;
    if (cm.textContent !== cur.meta) cm.textContent = cur.meta;
    $("#liveWave").classList.toggle("on", !!cur.wave);
    const ended = (cur.run === -1 && !cur.fail && cur.done.length === 5) || cur.fail !== undefined;
    $("#liveDot").style.display = ended ? "none" : "";
    $("#progPct").textContent = (cur.done.length + (cur.run > -1 ? 1 : 0)) + "/5";
  }

  function stopTicker() { if (progTimer) { clearInterval(progTimer); progTimer = null; } }

  function startTicker() {
    stopTicker();
    progTimer = setInterval(function () {
      if (!activeRec) { stopTicker(); return; }
      const el = Date.now() - activeRec.startedAt;
      if (isCurrent("s4")) paintProgress(el, activeRec.scn);
      if (el >= activeRec.durationMs) finishRun();
    }, 250);
  }

  function startInquiry() {
    const scn = state.scenario;
    stopTicker();
    if (activeRec) { records = records.filter((x) => x.id !== activeRec.id); activeRec = null; }

    const rec = {
      id: "r" + Date.now(),
      cat: CAT.id,
      store: state.store,
      unit: state.unit,
      price: state.price,
      fields: state.fields.map((f) => ({ l: f.l, v: f.v })),
      needs: CAT.needsDefault.slice(),
      meta: summarize(),
      scn: scn,
      status: "running",
      startedAt: Date.now(),
      durationMs: RUN_MS[scn] || 56000,
      notify: false,
      notifyVia: null,
      contact: {
        name: state.contact.name || "王先生",
        phone: state.contact.phone || "13800001234"
      },
      time: nowLabel(),
      res: null
    };
    records.unshift(rec);
    save();
    activeRec = rec;

    // 首次填过的联系人记下来，下次不再问
    if (state.contact.name && state.contact.phone) persistContact(state.contact);
    editingContact = false;

    buildSteps();
    $("#progName").textContent = rec.store;
    $("#progTel").textContent = CATS[rec.cat].tel + " · " + CATS[rec.cat].merchant;
    paintProgress(0, scn);
    go("s4", 1);
    startTicker();
  }

  function finishRun() {
    const rec = activeRec;
    if (!rec) return;
    stopTicker();
    activeRec = null;
    completeRecord(rec);
    save();
    if (isCurrent("s4")) { renderResult(rec); go("s5", 1); return; }
    renderRecords();
    if (rec.notifyVia && rec.notifyVia !== "inapp") showPush(rec);
    else if (isCurrent("s6")) toast("「" + shortName(rec.store) + "」询价已完成");
  }

  function completeRecord(rec) {
    rec.status = "done";
    rec.res = buildResult(rec);
    rec.finishedAt = Date.now();
  }

  /* =========================================================
     结果
     ========================================================= */
  function buildResult(rec) {
    const c = CATS[rec.cat];
    const P = rec.price;
    const D = dealOf(P, c);
    const save = P - D;
    const pct = Math.round((save / P) * 1000) / 10;
    const u = rec.unit;

    const all = {
      win: {
        pill: "ok", pillText: "已取得优惠",
        head: "直订比平台便宜 " + save + " 元，" + c.winTail,
        price: yuan(D), old: money(P), tag: "省 ¥" + save,
        note: "共 " + u + " · 总价 " + money(D) + "，" + c.winBenefit + "，商家口头锁价至今晚 20:00。",
        rowsTitle: c.labels.quote + "与权益",
        rows: [
          [c.labels.quote, money(D) + " / " + u],
          [c.labels.benefit, c.winBenefit],
          [c.labels.rule, c.rule],
          ["价格差异", money(P) + " → " + money(D) + "，降 " + pct + "%"],
          ["额外权益", c.winExtra]
        ],
        extra: null
      },
      none: {
        pill: "neu", pillText: "商家无优惠",
        head: "价格没谈下来，情况问清楚了",
        price: yuan(P), old: null, tag: null,
        note: "与平台价一致。商家表示 " + c.noneReason + "，直订同价。",
        rowsTitle: c.labels.quote + "与权益",
        rows: [
          [c.labels.quote, money(P) + " / " + u + "（未变）"],
          [c.labels.benefit, c.noneBenefit],
          [c.labels.rule, c.rule],
          ["价格差异", "无变化"],
          ["商家原话", c.noneReason]
        ],
        extra: { title: "额外拿到的权益（单独列出）", items: c.noneFree }
      },
      fail: {
        pill: "warn", pillText: "未接通",
        head: "这次没联系上商家",
        price: null, priceText: "未取得报价",
        note: "拨打 " + c.merchant + " 2 次、共 90 秒均无人接听，本次没有获得任何价格信息，助理不会推测价格或优惠。",
        rowsTitle: "联系情况与未确认事项",
        rows: [
          ["联系情况", "今天 16:52、16:53 两次拨打" + c.merchant],
          ["接通时长", "共 90 秒，两次均无人接听"],
          ["商家回复", "无（未接通，未转语音信箱）"],
          ["待确认项", u + "、价格与所选条件均未确认"],
          ["建议", c.merchant + "在线 10:00–22:00，可稍后重试"]
        ],
        extra: null,
        warn: "两次拨打记录都已保存。再次尝试会用同样的条件直接再打一次，不用重新填。"
      }
    };
    return all[rec.scn] || all.win;
  }

  let viewRec = null;

  function renderResult(rec) {
    const c = CATS[rec.cat];
    const d = rec.res || buildResult(rec);
    viewRec = rec;
    const t = rec.finishedAt ? new Date(rec.finishedAt) : new Date();
    $("#resTime").textContent = "今天 " + pad(t.getHours()) + ":" + pad(t.getMinutes());

    const priceHTML = d.price
      ? '<div class="hero-price"><span class="n"><small>¥</small>' + d.price + "</span>" +
        (d.old ? '<span class="old">' + d.old + "</span>" : "") +
        (d.tag ? '<span class="tag">' + d.tag + "</span>" : "") + "</div>"
      : '<div class="hero-price"><span class="n" style="font-size:26px;letter-spacing:-.4px;color:var(--ink-2)">' + d.priceText + "</span></div>";

    let extraHTML = "";
    if (d.extra) {
      extraHTML = '<div class="sec-h" style="margin-top:18px">' + d.extra.title + "</div>" +
        '<div class="card flat" style="padding:4px 15px">' +
        d.extra.items.map((x) => '<div class="row"><span class="rv dt">' + x + "</span></div>").join("") +
        "</div>";
    }
    const warnHTML = d.warn
      ? '<div class="warn" style="margin-top:14px"><span class="ex">!</span><div><div class="wb" style="margin-top:0">' + d.warn + "</div></div></div>"
      : "";

    $("#resultBody").innerHTML =
      '<div class="hero">' +
        '<span class="pill ' + d.pill + '">' + d.pillText + "</span>" +
        '<div class="hero-h">' + d.head + "</div>" +
        priceHTML +
        '<div class="hero-note">' + d.note + "</div>" +
      "</div>" +
      '<div class="sec-h">' + (d.rowsTitle || "商家确认的信息") + "</div>" +
      '<div class="card flat" style="padding:2px 15px">' +
        d.rows.map((r) =>
          '<div class="row"><span class="rk">' + r[0] + '</span><span class="rv' +
          (r[0].indexOf("差异") > -1 ? " strong" : "") + '">' + r[1] + "</span></div>"
        ).join("") +
      "</div>" + extraHTML + warnHTML +
      '<div class="disc">信息仅供参考，需以商家最终确认和实际预订为准<br>助理未代你下单或付款</div>' +
      '<div class="next-h">下一步，由你决定</div><div style="height:4px"></div>';

    let foot;
    if (rec.scn === "win") {
      foot = '<div class="next-grid">' +
        '<button class="btn btn-primary btn-sm" data-go="s6" data-dir="1">返回</button>' +
        '<div style="display:flex;gap:9px">' +
          '<button class="btn btn-ghost btn-sm" id="btnTalk" style="flex:1">查看沟通记录</button>' +
          '<button class="btn btn-ghost btn-sm" id="btnShare" style="flex:1">分享给好友</button>' +
        "</div></div>";
    } else if (rec.scn === "none") {
      foot = '<div class="next-grid">' +
        '<button class="btn btn-primary btn-sm" data-go="s3" data-dir="-1">调整需求重新询价</button>' +
        '<button class="btn btn-ghost btn-sm" id="btnTalk">查看沟通记录</button></div>';
    } else {
      foot = '<div class="next-grid">' +
        '<button class="btn btn-primary btn-sm" id="btnRetry">再次尝试联系</button>' +
        '<button class="btn btn-ghost btn-sm" id="btnTalk">查看沟通记录</button></div>';
    }
    $("#resultFooter").innerHTML = foot;

    if ($("#btnTalk")) $("#btnTalk").addEventListener("click", openTalkSheet);
    if ($("#btnShare")) $("#btnShare").addEventListener("click", openShareSheet);
    if ($("#btnRetry")) $("#btnRetry").addEventListener("click", function () {
      CAT = CATS[rec.cat];
      state.store = rec.store;
      state.unit = rec.unit;
      state.price = rec.price;
      state.fields = rec.fields.map((f) => ({ l: f.l, v: f.v }));
      state.needs = rec.needs.slice();
      if (rec.contact && rec.contact.phone) state.contact = { name: rec.contact.name, phone: rec.contact.phone };
      startInquiry();
    });
  }

  /* =========================================================
     记录
     ========================================================= */
  const LS_KEY = "kanjia.records.v2";
  const PILL_CLASS = { win: "ok", none: "neu", fail: "warn" };
  const shortName = (s) => { const m = s.match(/^(.{2,10}?)[（(]/); return m ? m[1] : s; };

  function seedRecords() {
    return [
      { id: "seed1", cat: "ktv", store: "星聚会 KTV（三里屯店）", unit: "4 小时", price: 1480,
        meta: "中包（8–10 人） · 4 小时", scn: "win", status: "done", startedAt: 0, durationMs: 0,
        notify: false, time: "11月14日 20:12", needs: [], fields: [],
        res: { pill: "ok", pillText: "已取得优惠", head: "直订比平台便宜 222 元，另外把开台费免了",
               price: "1,258", old: "¥1,480", tag: "省 ¥222",
               note: "共 4 小时 · 总价 ¥1,258，送果盘、开台费免了，商家口头锁价至今晚 20:00。",
               rowsTitle: "包间报价与权益",
               rows: [["包间报价", "¥1,258 / 4 小时"], ["包间与权益", "送果盘 · 开台费免了"],
                      ["使用规则", "周六 20:00–24:00 可用，超时按 200/小时"],
                      ["价格差异", "¥1,480 → ¥1,258，降 15%"], ["额外权益", "开台费免了"]],
               extra: null } },
      { id: "seed2", cat: "massage", store: "足间道 · 足疗（国贸店）", unit: "2 人次", price: 796,
        meta: "中式推拿 90 分钟 ×2 · 2 人次", scn: "none", status: "done", startedAt: 0, durationMs: 0,
        notify: false, time: "11月12日 21:40", needs: [], fields: [],
        res: { pill: "neu", pillText: "商家无优惠", head: "价格没谈下来，情况问清楚了",
               price: "796", old: null, tag: null,
               note: "与平台价一致。商家表示周末技师排得满，价格让不了，直订同价。",
               rowsTitle: "门店报价与权益",
               rows: [["门店报价", "¥796 / 2 人次（未变）"], ["项目与技师", "双人包间 · 高级技师 · 含茶水"],
                      ["到店规则", "22:00 前到店有效，可改期一次"], ["价格差异", "无变化"],
                      ["商家原话", "周末技师排得满，价格让不了"]],
               extra: { title: "额外拿到的权益（单独列出）", items: ["送 30 分钟加钟", "可延迟到 22:30 到店"] } } },
      { id: "seed3", cat: "bar", store: "OLD LIVE 酒馆（三里屯店）", unit: "1 卡座", price: 3000,
        meta: "沙发卡座（6–8 人） · 1 卡座", scn: "fail", status: "done", startedAt: 0, durationMs: 0,
        notify: false, time: "11月08日 22:05", needs: [], fields: [],
        res: { pill: "warn", pillText: "未接通", head: "这次没联系上商家",
               price: null, priceText: "未取得报价",
               note: "拨打订台 2 次、共 90 秒均无人接听，未取得任何价格信息。",
               rowsTitle: "联系情况与未确认事项",
               rows: [["联系情况", "11月8日 22:03、22:05 两次拨打订台"], ["接通时长", "共 90 秒，两次均无人接听"],
                      ["商家回复", "无（未接通）"], ["待确认项", "卡座、低消与入场费均未确认"]],
               extra: null } }
    ];
  }

  let records = [];

  function save() { try { localStorage.setItem(LS_KEY, JSON.stringify(records)); } catch (e) {} }
  function loadRecords() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) return arr;
      }
    } catch (e) {}
    const seed = seedRecords();
    try { localStorage.setItem(LS_KEY, JSON.stringify(seed)); } catch (e) {}
    return seed;
  }

  function elapsedTxt(rec) {
    const s = Math.max(0, Math.floor((Date.now() - rec.startedAt) / 1000));
    return s < 60 ? s + " 秒" : Math.floor(s / 60) + " 分 " + (s % 60) + " 秒";
  }

  function renderRecords() {
    $("#recBody").innerHTML =
      '<div class="rec-head"><h1>砍价记录</h1><span>共 ' + records.length + " 条</span></div>" +
      '<div id="recList">' +
      (records.length ? "" : '<div class="empty"><div class="e1">还没有询价记录</div><div class="e2">上传一张报价截图，<br>助理替你问完之后会记录在这里。</div></div>') +
      "</div>";

    if (!records.length) return;
    $("#recList").innerHTML = records.map(function (r, i) {
      const running = r.status === "running";
      const c = CATS[r.cat] || CATS.hotel;
      let left, right, pillCls, pillTxt;
      if (running) {
        pillCls = "run"; pillTxt = "正在沟通中";
        left = '<span class="rec-price run-t">' + phaseAt(Date.now() - r.startedAt, r.scn).call.replace("{m}", c.merchant) + "</span>";
        right = '<span class="rec-time">已 ' + elapsedTxt(r) + " 秒</span>";
      } else {
        pillCls = PILL_CLASS[r.scn]; pillTxt = r.res.pillText;
        left = '<span class="rec-price">' + (r.res.price ? "¥" + r.res.price + "<small>" + r.unit + "</small>" : "未取得报价") + "</span>";
        right = '<span class="rec-time">' + r.time + "</span>";
      }
      return '<div class="rec" data-rec="' + i + '">' +
        '<div class="rec-top"><span class="rec-h"><span class="rec-cat">' + c.name + "</span>" + esc(r.store) + "</span>" +
        '<span class="rec-pill ' + pillCls + '">' + pillTxt + "</span></div>" +
        '<div class="rec-meta">' + esc(r.meta) + "</div>" +
        '<div class="rec-bottom">' + left + right + "</div></div>";
    }).join("");
  }

  function openRunning(r) {
    if (Date.now() - r.startedAt >= r.durationMs) {
      completeRecord(r); save(); renderRecords(); openResult(r); return;
    }
    activeRec = r;
    CAT = CATS[r.cat] || CATS.hotel;
    state.store = r.store; state.unit = r.unit; state.price = r.price;
    state.fields = r.fields.map((f) => ({ l: f.l, v: f.v }));
    state.needs = r.needs.slice();
    buildSteps();
    $("#progName").textContent = r.store;
    $("#progTel").textContent = CAT.tel + " · " + CAT.merchant;
    paintProgress(Date.now() - r.startedAt, r.scn);
    go("s4", 1);
    startTicker();
  }

  function openResult(r) {
    CAT = CATS[r.cat] || CATS.hotel;
    viewRec = r;
    renderResult(r);
    go("s5", 1);
  }

  $("#recBody").addEventListener("click", function (e) {
    const card = e.target.closest(".rec");
    if (!card) return;
    const r = records[parseInt(card.dataset.rec, 10)];
    if (!r) return;
    if (r.status === "running") openRunning(r); else openResult(r);
  });

  /* 通知条 */
  let pushTimer = null, pushRec = null;
  function showPush(rec) {
    pushRec = rec;
    $("#pushS").textContent = shortName(rec.store) + " · " + rec.res.pillText + (rec.res.price ? " ¥" + rec.res.price : "");
    $("#push").classList.add("on");
    clearTimeout(pushTimer);
    pushTimer = setTimeout(() => $("#push").classList.remove("on"), 6000);
  }
  $("#push").addEventListener("click", function () {
    this.classList.remove("on");
    clearTimeout(pushTimer);
    if (pushRec) openResult(pushRec);
  });

  function resumeRunning() {
    records.forEach(completeIfDue);
    records.filter((r) => r.status === "running").forEach(function (r) {
      setTimeout(function () {
        if (r.status !== "running") return;
        completeRecord(r); save(); renderRecords();
        if (r.notifyVia && r.notifyVia !== "inapp") showPush(r);
      }, Math.max(0, r.durationMs - (Date.now() - r.startedAt)));
    });
    save();
  }
  function completeIfDue(r) {
    if (r.status === "running" && Date.now() - r.startedAt >= r.durationMs) completeRecord(r);
  }

  /* =========================================================
     换品类（识别错了才用）
     ========================================================= */
  function openCatSheet() {
    let html = '<div style="font-size:11.5px;color:var(--muted);line-height:1.6;margin-bottom:14px">' +
      "识别错了？选一个正确的品类，字段和计价方式会一起换掉。</div>";
    html += LEISURE.map(function (id) {
      const c = CATS[id];
      return '<div class="opt' + (CAT.id === id ? " on" : "") + '" data-cat="' + id + '">' +
        '<div class="opt-radio"></div>' +
        '<div class="opt-main"><div class="opt-t">' + c.name + "</div>" +
        '<div class="opt-s">按 ' + esc(c.unit) + " 询价</div></div></div>";
    }).join("");
    openSheet("换一个品类", "当前识别为 " + CAT.name, html);

    $$("#sheetBody .opt").forEach(function (el) {
      el.addEventListener("click", function () {
        const id = el.dataset.cat;
        CAT = CATS[id];
        commitScan();
        renderConfirm();
        closeSheet();
        toast("已换成 " + CATS[id].name);
      });
    });
  }

  /* =========================================================
     通知方式
     ========================================================= */
  let notifyVia = "sms";
  function openNotifySheet() {
    const rec = activeRec;
    if (!rec) return;
    const p = maskPhone(rec.contact && rec.contact.phone);
    notifyVia = "sms";
    const opts = [
      { k: "sms", t: "短信通知", tag: "推荐", s: "结果出来后发送到 " + (p || "你的手机号") },
      { k: "wechat", t: "微信服务通知", s: "需关注「砍价」服务号后接收" },
      { k: "inapp", t: "仅应用内提醒", s: "不打扰，打开 App 时才看到" }
    ];
    let html = '<div class="phone-chip"><span>接收号码</span><b>' + (p || "未填写") + "</b></div>" +
      opts.map((o) =>
        '<div class="opt ' + (o.k === "sms" ? "on" : "") + '" data-opt="' + o.k + '">' +
          '<div class="opt-radio"></div><div class="opt-main">' +
          '<div class="opt-t">' + o.t + (o.tag ? "<em>" + o.tag + "</em>" : "") + "</div>" +
          '<div class="opt-s">' + o.s + "</div></div></div>"
      ).join("") +
      '<button class="btn btn-primary btn-sm" id="optConfirm" style="margin-top:6px">确定</button>';
    openSheet("有结果了通知我", "选择联系方式，结果出来第一时间告诉你", html);

    $$("#sheetBody .opt").forEach(function (el) {
      el.addEventListener("click", function () {
        notifyVia = el.dataset.opt;
        $$("#sheetBody .opt").forEach((x) => x.classList.toggle("on", x === el));
      });
    });
    $("#optConfirm").addEventListener("click", function () {
      if (!activeRec) return;
      activeRec.notify = true;
      activeRec.notifyVia = notifyVia;
      save();
      closeSheet();
      toast(notifyVia === "sms" ? "已开启，结果会短信发到 " + p
        : notifyVia === "wechat" ? "已开启微信服务通知" : "已开启应用内提醒");
      go("s6", 1);
    });
  }

  /* =========================================================
     弹层
     ========================================================= */
  function openSheet(title, sub, bodyHTML) {
    $("#sheetTitle").innerHTML = title + "<small>" + (sub || "") + "</small>";
    $("#sheetBody").innerHTML = bodyHTML;
    $("#sheetWrap").classList.add("on");
  }
  function closeSheet() { $("#sheetWrap").classList.remove("on"); }
  $("#sheetClose").addEventListener("click", closeSheet);
  $("#sheetWrap").addEventListener("click", function (e) { if (e.target === this) closeSheet(); });

  function openTalkSheet() {
    const rec = viewRec;
    if (!rec) return;
    const scn = talkFor(rec);
    const c = CATS[rec.cat];
    let html = '<div style="font-size:11.5px;color:var(--muted);line-height:1.7;margin-bottom:14px">' +
      "通话对象：" + esc(rec.store) + " · " + c.merchant + " " + c.tel + "<br>" +
      "发起时间：今天 16:52 · " + (rec.scn === "fail" ? "拨打 2 次，均未接通" : "通话时长 2 分 11 秒") + "</div>";
    [0, 1, 2, 3, 4].forEach(function (i) {
      const list = scn[i];
      if (!list || !list.length) return;
      html += '<div style="font-size:10.5px;font-weight:700;letter-spacing:.6px;color:var(--muted);margin:16px 0 8px;display:flex;align-items:center;gap:7px">' +
        '<span style="width:4px;height:4px;border-radius:50%;background:var(--accent)"></span>' +
        ["整理需求", "联系" + (c.id === "hotel" ? "酒店" : "门店"), "确认条件与权益", "询问优惠", "整理结果"][i] + "</div>" +
        '<div class="talk-in">' + list.map(bubbleHTML).join("") + "</div>";
    });
    openSheet("沟通记录", esc(rec.store) + " · 今天 16:52", html);
  }

  function openShareSheet() {
    const rec = viewRec;
    if (!rec) return;
    const d = rec.res || buildResult(rec);
    const priceLine = d.price ? "¥" + d.price + (d.tag ? " · " + d.tag : "") : "未取得报价";
    const html =
      '<div class="share-card">' +
        '<div class="sc-brand">砍价 · 询价结果</div>' +
        '<div class="sc-h">' + esc(rec.store) + '<br><span style="font-size:11.5px;font-weight:600;color:var(--muted)">' +
          esc(rec.meta) + "</span></div>" +
        '<div class="sc-p">' + priceLine + "</div>" +
        '<div class="sc-m">' + d.pillText + " · " + (d.rows[2] ? d.rows[2][1] : "") +
          "<br>信息仅供参考，以商家最终确认为准</div>" +
      "</div>" +
      '<div class="share-acts">' +
        '<button class="share-act" data-share="微信好友"><span class="si">微</span>发送给微信好友</button>' +
        '<button class="share-act" data-share="复制链接"><span class="si">链</span>复制结果链接</button>' +
        '<button class="share-act" data-share="保存图片"><span class="si">图</span>生成结果图</button>' +
      "</div>";
    openSheet("分享结果", "只分享结果，不包含你的手机号", html);
    $$("#sheetBody .share-act").forEach(function (b) {
      b.addEventListener("click", function () {
        closeSheet();
        toast(b.dataset.share === "保存图片" ? "结果图已生成，可长按保存" : "已生成分享内容，可直接粘贴发送");
      });
    });
  }

  /* =========================================================
     导航
     ========================================================= */
  function isTabScreen(id) { return id === "s1" || id === "s6"; }
  function isCurrent(id) { const el = document.getElementById(id); return !!el && el.classList.contains("active"); }

  function go(id, dir) {
    dir = dir || 1;
    const cur = document.querySelector(".screen.active");
    const next = document.getElementById(id);
    if (!next || cur === next) return;
    if (cur) {
      cur.classList.remove("active");
      cur.style.transform = "translateX(" + -26 * dir + "px)";
      cur.style.opacity = "0";
      cur.style.pointerEvents = "none";
    }
    next.style.transition = "none";
    next.style.transform = "translateX(" + 26 * dir + "px)";
    next.style.opacity = "0";
    void next.offsetHeight;
    next.style.transition = "";
    next.classList.add("active");
    next.style.transform = "";
    next.style.opacity = "";
    next.style.pointerEvents = "auto";
    const b = next.querySelector(".body"); if (b) b.scrollTop = 0;

    if (id === "s1") resetHome();
    if (id === "s2") renderConfirm();
    if (id === "s3") renderNeeds();
    if (id === "s6") renderRecords();

    $("#tabbar").classList.toggle("hide", !isTabScreen(id));
    if (id === "s6") setRootTab("records"); else setRootTab(rootTab);
  }

  let rootTab = "hotel";
  function setRootTab(t) {
    rootTab = t;
    $$(".tab").forEach((x) => x.classList.toggle("on", x.dataset.tab === rootTab));
  }

  function switchTab(which) {
    if (which === "records") { go("s6", 1); setRootTab("records"); return; }
    kind = which;
    CAT = which === "hotel" ? CATS.hotel : (CATS[CAT.id] && CAT.id !== "hotel" ? CAT : CATS.ktv);
    renderHome();
    go("s1", -1);
    setRootTab(which);
  }

  document.addEventListener("click", function (e) {
    const t = e.target.closest("[data-go]");
    if (t) { go(t.dataset.go, parseInt(t.dataset.dir || "1", 10)); return; }
    const tab = e.target.closest(".tab");
    if (tab) { switchTab(tab.dataset.tab); return; }
    const more = e.target.closest(".step-more");
    if (more) {
      const step = more.closest(".step");
      step.classList.toggle("open");
      fillTalk(parseInt(step.dataset.i, 10));
    }
  });

  /* =========================================================
     启动
     ========================================================= */
  $("#btnToNeeds").addEventListener("click", function () {
    if (!state.store.trim()) { toast("店名不能为空"); return; }
    if (!state.unit.trim()) { toast("询价单位不能为空"); return; }
    go("s3", 1);
  });

  $("#btnStart").addEventListener("click", function () {
    if (!contactOK()) { toast("请先填写姓名和手机号"); return; }
    startInquiry();
  });

  $$(".ctrl [data-scn]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (!state.store || state.store !== CAT.store) commitScan();
      $$(".ctrl [data-scn]").forEach((x) => x.classList.remove("on"));
      b.classList.add("on");
      state.scenario = b.dataset.scn;
      cancelArmed = false;
      $("#btnCancel").classList.remove("armed");
      $("#btnCancel").textContent = "取消询价";
      startInquiry();
      toast("演示场景：" + b.textContent);
    });
  });

  $("#btnSkip").addEventListener("click", function () {
    if (!activeRec) { toast("当前没有进行中的询价"); return; }
    activeRec.startedAt = Date.now() - activeRec.durationMs;
    if (isCurrent("s4")) paintProgress(activeRec.durationMs, activeRec.scn);
    finishRun();
  });

  $("#btnReset").addEventListener("click", function () {
    stopTicker();
    activeRec = null;
    state.scenario = "win";
    $$(".ctrl [data-scn]").forEach((x) => x.classList.toggle("on", x.dataset.scn === "win"));
    kind = "hotel";
    CAT = CATS.hotel;
    renderHome();
    go("s1", -1);
  });

  let cancelArmed = false, cancelArmTimer = null;
  $("#btnCancel").addEventListener("click", function () {
    const btn = this;
    if (!cancelArmed) {
      cancelArmed = true;
      btn.classList.add("armed");
      btn.textContent = "再点一次确认取消";
      clearTimeout(cancelArmTimer);
      cancelArmTimer = setTimeout(function () {
        cancelArmed = false; btn.classList.remove("armed"); btn.textContent = "取消询价";
      }, 3000);
      return;
    }
    cancelArmed = false;
    btn.classList.remove("armed");
    btn.textContent = "取消询价";
    clearTimeout(cancelArmTimer);
    stopTicker();
    if (activeRec) {
      const id = activeRec.id;
      activeRec = null;
      records = records.filter((x) => x.id !== id);
      save();
    }
    toast("已取消询价，需求已保留");
    go("s3", -1);
  });

  $("#btnWait").addEventListener("click", function () {
    if (!activeRec) return;
    activeRec.notify = false;
    save();
    toast("已收起，进度会保存在记录里");
    go("s6", 1);
  });
  $("#btnNotify").addEventListener("click", openNotifySheet);

  function tickClock() {
    const d = new Date();
    $("#clock").textContent = pad(d.getHours()) + ":" + pad(d.getMinutes());
  }
  tickClock();
  setInterval(tickClock, 30000);

  records = loadRecords();
  resumeRunning();
  renderHome();
  renderRecords();
  buildSteps();
  bindConfirm();
  setRootTab("hotel");

  setInterval(function () {
    if (!isCurrent("s6")) return;
    for (let i = 0; i < records.length; i++) if (records[i].status === "running") { renderRecords(); return; }
  }, 1000);
})();
