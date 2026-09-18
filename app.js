/* Тренажер НМТ — Telegram Mini App
   Працює і як звичайна веб-сторінка (без Telegram), тож можна відкривати локально. */

(function () {
  "use strict";

  var tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;

  /* ====================== ДАНІ ====================== */

  var NAGOLOSY = window.DATA_NAGOLOSY   || [];
  var FRAZEO   = window.DATA_FRAZEO     || [];
  var DATY_T   = window.DATA_DATY       || [];
  var PERSON   = window.DATA_PERSONALII || [];
  var PAMYATKY = window.DATA_PAMYATKY   || [];

  // Дати розкладаємо в один плоский список, щоб мати наскрізні номери
  var DATY = [];
  DATY_T.forEach(function (topic) {
    topic.items.forEach(function (it) {
      DATY.push({ d: it.d, e: it.e, topic: topic.id, topicTitle: topic.title });
    });
  });

  var VOWELS = "аеєиіїоуюя";

  /* ====================== СХОВИЩЕ ====================== */

  var DEFAULT_STATE = {
    theme: { bg: "", accent: "", radius: 16 },
    mistakes: { nag: [], frz: [], dat: [], per: [], pam: [] },
    stats: { answered: 0, correct: 0, bestStreak: 0 }
  };

  // Хмара Telegram дозволяє максимум 4096 символів на один ключ, тому прогрес
  // розкладаємо по окремих ключах: налаштування + список помилок кожного розділу.
  var CLOUD_BUCKETS = ["nag", "frz", "dat", "per", "pam"];
  var MAX_MISTAKES = 300;   // із запасом уміщається в 4096 символів

  var Store = {
    key: "nmt-trainer-v1",
    state: null,
    cloudTimer: null,

    load: function () {
      var raw = null;
      try { raw = localStorage.getItem(this.key); } catch (e) { /* приватний режим */ }
      this.state = raw ? merge(DEFAULT_STATE, JSON.parse(raw)) : merge(DEFAULT_STATE, {});
      if (!raw) this.pullFromCloud();
    },

    // Локально порожньо (перший запуск або новий пристрій) — беремо з хмари
    pullFromCloud: function () {
      var cs = tg && tg.CloudStorage;
      if (!cs || !cs.getItems) return;
      var self = this;
      var keys = ["nmt_meta"].concat(CLOUD_BUCKETS.map(function (b) { return "nmt_" + b; }));
      try {
        cs.getItems(keys, function (err, values) {
          if (err || !values) return;
          var changed = false;
          if (values.nmt_meta) {
            try {
              var meta = JSON.parse(values.nmt_meta);
              if (meta.theme) self.state.theme = merge(self.state.theme, meta.theme);
              if (meta.stats) self.state.stats = merge(self.state.stats, meta.stats);
              changed = true;
            } catch (e) { /* пошкоджений запис — ігноруємо */ }
          }
          CLOUD_BUCKETS.forEach(function (b) {
            var v = values["nmt_" + b];
            if (!v) return;
            self.state.mistakes[b] = v.split(",").map(Number).filter(function (n) {
              return !isNaN(n);
            });
            changed = true;
          });
          if (changed) {
            self.saveLocal();
            Theme.apply();
            renderHome();
          }
        });
      } catch (e) { /* стара версія Telegram */ }
    },

    saveLocal: function () {
      try { localStorage.setItem(this.key, JSON.stringify(this.state)); } catch (e) { /* ігноруємо */ }
    },

    save: function () {
      // обрізаємо надто довгі списки помилок, щоб гарантовано влізти в ліміт
      var self = this;
      CLOUD_BUCKETS.forEach(function (b) {
        var list = self.state.mistakes[b];
        if (list.length > MAX_MISTAKES) self.state.mistakes[b] = list.slice(-MAX_MISTAKES);
      });
      this.saveLocal();
      this.pushToCloud();
    },

    // Хмару оновлюємо не частіше ніж раз на 3 секунди — щоб не смикати її на кожен клік
    pushToCloud: function () {
      var cs = tg && tg.CloudStorage;
      if (!cs || !cs.setItem) return;
      var self = this;
      clearTimeout(this.cloudTimer);
      this.cloudTimer = setTimeout(function () {
        try {
          cs.setItem("nmt_meta", JSON.stringify({
            theme: self.state.theme,
            stats: self.state.stats
          }));
          CLOUD_BUCKETS.forEach(function (b) {
            cs.setItem("nmt_" + b, self.state.mistakes[b].join(","));
          });
        } catch (e) { /* ігноруємо */ }
      }, 3000);
    }
  };

  function merge(base, extra) {
    var out = JSON.parse(JSON.stringify(base));
    Object.keys(extra || {}).forEach(function (k) {
      if (extra[k] && typeof extra[k] === "object" && !Array.isArray(extra[k])) {
        out[k] = merge(out[k] || {}, extra[k]);
      } else if (extra[k] !== undefined) {
        out[k] = extra[k];
      }
    });
    return out;
  }

  /* ====================== ТЕМА ====================== */

  var BG_PRESETS = ["#12131a", "#1b1d2b", "#0f1b14", "#241722", "#ffffff", "#f4f1ea", "#eef3ff", "#fdf0f0"];
  var ACCENT_PRESETS = ["#7c5cff", "#2f86ff", "#2fbf71", "#ff8a3d", "#e5484d", "#00b8a9", "#d946ef", "#f7b500"];

  var Theme = {
    apply: function () {
      var t = Store.state.theme;
      var bg = t.bg || defaultBg();
      var accent = t.accent || defaultAccent();
      var root = document.documentElement.style;

      var dark = luminance(bg) < 0.5;
      root.setProperty("--bg", bg);
      root.setProperty("--surface", shift(bg, dark ? 0.06 : -0.045));
      root.setProperty("--surface-2", shift(bg, dark ? 0.12 : -0.09));
      root.setProperty("--text", dark ? "#f2f3f7" : "#14161c");
      root.setProperty("--muted", dark ? "#9aa0b4" : "#6b7280");
      root.setProperty("--line", dark ? "rgba(255,255,255,.09)" : "rgba(0,0,0,.10)");
      root.setProperty("--accent", accent);
      root.setProperty("--accent-ink", luminance(accent) < 0.55 ? "#ffffff" : "#14161c");
      root.setProperty("--radius", (t.radius === undefined ? 16 : t.radius) + "px");

      if (tg && tg.setBackgroundColor) {
        try { tg.setBackgroundColor(bg); tg.setHeaderColor(bg); } catch (e) { /* ігноруємо */ }
      }
    }
  };

  function defaultBg() {
    if (tg && tg.themeParams && tg.themeParams.bg_color) return tg.themeParams.bg_color;
    return "#12131a";
  }
  function defaultAccent() {
    if (tg && tg.themeParams && tg.themeParams.button_color) return tg.themeParams.button_color;
    return "#7c5cff";
  }

  function hexToRgb(hex) {
    var h = String(hex).replace("#", "");
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    var n = parseInt(h, 16);
    if (isNaN(n)) return { r: 18, g: 19, b: 26 };
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function luminance(hex) {
    var c = hexToRgb(hex);
    return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
  }
  function shift(hex, amount) {
    var c = hexToRgb(hex);
    function f(v) {
      var x = amount > 0 ? v + (255 - v) * amount : v * (1 + amount);
      return Math.max(0, Math.min(255, Math.round(x)));
    }
    return "#" + [f(c.r), f(c.g), f(c.b)].map(function (v) {
      return ("0" + v.toString(16)).slice(-2);
    }).join("");
  }

  /* ====================== НАВІГАЦІЯ ====================== */

  var stack = ["home"];

  function screenEl(name) {
    return document.querySelector('[data-screen="' + name + '"]');
  }

  function show(name) {
    document.querySelectorAll(".screen").forEach(function (s) {
      s.classList.toggle("is-active", s.dataset.screen === name);
    });
    window.scrollTo(0, 0);
    document.getElementById("topbar").hidden = (stack.length <= 1);
    syncBackButton();
  }

  function go(name) {
    if (stack[stack.length - 1] !== name) stack.push(name);
    show(name);
  }

  function back() {
    if (stack.length > 1) stack.pop();
    // з екрана результату повертаємось у меню розділу, а не в гру
    if (stack[stack.length - 1] === "quiz") stack.pop();
    var target = stack[stack.length - 1] || "home";
    if (target === "home") renderHome();
    show(target);
  }

  function goHome() {
    stack = ["home"];
    show("home");
    renderHome();
  }

  function syncBackButton() {
    if (!tg || !tg.BackButton) return;
    try {
      if (stack.length > 1) tg.BackButton.show();
      else tg.BackButton.hide();
    } catch (e) { /* ігноруємо */ }
  }

  /* ====================== ДРІБНИЦІ ====================== */

  function haptic(kind) {
    if (!tg || !tg.HapticFeedback) return;
    try {
      if (kind === "ok" || kind === "bad") tg.HapticFeedback.notificationOccurred(kind === "ok" ? "success" : "error");
      else tg.HapticFeedback.impactOccurred("light");
    } catch (e) { /* ігноруємо */ }
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function sample(arr, n) { return shuffle(arr).slice(0, n); }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function plural(n, one, few, many) {
    var n10 = n % 10, n100 = n % 100;
    if (n10 === 1 && n100 !== 11) return one;
    if (n10 >= 2 && n10 <= 4 && (n100 < 10 || n100 >= 20)) return few;
    return many;
  }

  /* ====================== ПИТАННЯ ====================== */

  // НАГОЛОСИ: показуємо слово малими, варіанти — його голосні
  function makeNagolosyQuestion(idx) {
    var item = NAGOLOSY[idx];
    var word = item.w;
    var lower = word.toLowerCase();
    var correctIdx = [];
    for (var i = 0; i < word.length; i++) {
      if (word[i] !== lower[i]) correctIdx.push(i);
    }
    var options = [];
    for (var j = 0; j < lower.length; j++) {
      if (VOWELS.indexOf(lower[j]) >= 0) {
        options.push({ text: lower[j], correct: correctIdx.indexOf(j) >= 0 });
      }
    }
    var marked = "";
    for (var k = 0; k < word.length; k++) {
      marked += (word[k] !== lower[k]) ? "<b>" + esc(word[k]) + "</b>" : esc(word[k]);
    }
    return {
      key: idx,
      label: "Постав наголос",
      prompt: esc(lower),
      note: item.n || "",
      vowels: true,
      options: options,
      answerHtml: marked
    };
  }

  // ФРАЗЕОЛОГІЗМИ: вираз → 4 значення
  function makeFrazeoQuestion(idx) {
    var item = FRAZEO[idx];
    var wrong = [];
    var guard = 0;
    while (wrong.length < 3 && guard++ < 200) {
      var cand = FRAZEO[Math.floor(Math.random() * FRAZEO.length)];
      if (cand.m === item.m) continue;
      if (wrong.some(function (w) { return w.m === cand.m; })) continue;
      wrong.push(cand);
    }
    var options = shuffle(
      [{ text: item.m, correct: true }].concat(wrong.map(function (w) {
        return { text: w.m, correct: false };
      }))
    );
    return {
      key: idx,
      label: "Що означає вираз",
      prompt: esc(item.p),
      note: "",
      vowels: false,
      options: options,
      answerHtml: "<b>" + esc(item.m) + "</b>"
    };
  }

  // ДАТИ: подія → 4 дати (відволікачі з тієї ж теми)
  function makeDatyQuestion(idx) {
    var item = DATY[idx];
    var pool = DATY.filter(function (x) { return x.topic === item.topic && x.d !== item.d; });
    if (pool.length < 3) pool = DATY.filter(function (x) { return x.d !== item.d; });
    var wrong = [];
    var used = {};
    shuffle(pool).forEach(function (c) {
      if (wrong.length < 3 && !used[c.d]) { used[c.d] = 1; wrong.push(c); }
    });
    var options = shuffle(
      [{ text: item.d, correct: true }].concat(wrong.map(function (w) {
        return { text: w.d, correct: false };
      }))
    );
    return {
      key: idx,
      label: "Коли це сталося",
      prompt: esc(item.e),
      note: item.topicTitle,
      vowels: false,
      options: options,
      answerHtml: "<b>" + esc(item.d) + "</b>"
    };
  }

  // Спільний помічник: вибирає 3 відволікачі з різними назвами
  function pickDistractors(pool, correctText, field, count) {
    var out = [], used = {};
    used[correctText] = 1;
    shuffle(pool).forEach(function (c) {
      if (out.length < count && !used[c[field]]) { used[c[field]] = 1; out.push(c[field]); }
    });
    return out;
  }

  // ПЕРСОНАЛІЇ: портрет → 4 імені; опис зʼявляється лише після відповіді
  function makePersonQuestion(idx) {
    var it = PERSON[idx];
    var options = shuffle(
      [{ text: it.name, correct: true }].concat(
        pickDistractors(PERSON, it.name, "name", 3).map(function (n) {
          return { text: n, correct: false };
        })
      )
    );
    return {
      key: idx,
      label: "Хто зображений на портреті?",
      image: "img/personalii/" + it.img,
      imageKind: "portrait",
      prompt: "",
      note: "",
      options: options,
      answerHtml: "<b>" + esc(it.name) + "</b>" + (it.years ? " (" + esc(it.years) + ")" : ""),
      reveal: esc(it.desc)
    };
  }

  // ПАМʼЯТКИ: фото → 4 назви
  function makePamyatkaQuestion(idx) {
    var it = PAMYATKY[idx];
    var options = shuffle(
      [{ text: it.name, correct: true }].concat(
        pickDistractors(PAMYATKY, it.name, "name", 3).map(function (n) {
          return { text: n, correct: false };
        })
      )
    );
    return {
      key: idx,
      label: "Що це за пам'ятка?",
      image: "img/pamyatky/" + it.img,
      imageKind: "object",
      prompt: "",
      note: "",
      options: options,
      answerHtml: "<b>" + esc(it.name) + "</b>" + (it.note ? " — " + esc(it.note) : "")
    };
  }

  /* ====================== ГРА ====================== */

  var Quiz = {
    mode: null,        // "nag" | "frz" | "dat"
    make: null,
    queue: [],
    endless: false,
    pool: [],
    total: 0,
    index: 0,
    correct: 0,
    streak: 0,
    wrongItems: [],
    current: null,
    restart: null
  };

  function startQuiz(opts) {
    Quiz.mode = opts.mode;
    Quiz.make = opts.make;
    Quiz.pool = opts.pool;
    Quiz.endless = !!opts.endless;
    Quiz.queue = opts.endless ? [] : shuffle(opts.pool).slice(0, opts.limit || opts.pool.length);
    Quiz.total = Quiz.endless ? 0 : Quiz.queue.length;
    Quiz.index = 0;
    Quiz.correct = 0;
    Quiz.streak = 0;
    Quiz.wrongItems = [];
    Quiz.restart = function () { startQuiz(opts); };

    if (!Quiz.endless && Quiz.queue.length === 0) {
      alert("Тут поки немає питань.");
      return;
    }
    go("quiz");
    nextQuestion();
  }

  function nextQuestion() {
    var key;
    if (Quiz.endless) {
      key = Quiz.pool[Math.floor(Math.random() * Quiz.pool.length)];
    } else {
      if (Quiz.index >= Quiz.queue.length) { finishQuiz(); return; }
      key = Quiz.queue[Quiz.index];
    }
    Quiz.index++;
    Quiz.current = Quiz.make(key);
    renderQuestion();
  }

  function renderQuestion() {
    var q = Quiz.current;
    document.getElementById("quizLabel").textContent = q.label;

    var fig = document.getElementById("quizFigure");
    var img = document.getElementById("quizImage");
    if (q.image) {
      fig.hidden = false;
      fig.className = "quiz-figure is-" + (q.imageKind || "object");
      img.src = q.image;
      img.alt = q.label;
    } else {
      fig.hidden = true;
      img.removeAttribute("src");
    }

    var promptEl = document.getElementById("quizPrompt");
    promptEl.innerHTML = q.prompt || "";
    promptEl.hidden = !q.prompt;
    promptEl.classList.toggle("is-long", (q.prompt || "").length > 34);

    var noteEl = document.getElementById("quizNote");
    noteEl.textContent = q.note || "";
    noteEl.style.display = q.note ? "" : "none";

    document.getElementById("quizCounter").textContent =
      Quiz.endless ? "Питання " + Quiz.index : Quiz.index + " / " + Quiz.total;
    document.getElementById("quizStreak").textContent = "🔥 " + Quiz.streak;
    document.getElementById("quizBar").style.width =
      Quiz.endless ? "100%" : Math.round((Quiz.index - 1) / Quiz.total * 100) + "%";

    document.getElementById("quizVerdict").innerHTML = "";
    document.getElementById("quizReveal").hidden = true;
    document.getElementById("quizReveal").innerHTML = "";
    document.getElementById("quizNext").hidden = true;
    preloadNext();

    var box = document.getElementById("quizOptions");
    box.className = "quiz-options" + (q.vowels ? " is-vowels" : "");
    box.innerHTML = "";
    q.options.forEach(function (opt) {
      var b = document.createElement("button");
      b.className = "opt";
      b.type = "button";
      b.textContent = opt.text;
      b.addEventListener("click", function () { answer(opt, b); });
      box.appendChild(b);
    });
  }

  function answer(opt, btn) {
    var q = Quiz.current;
    var box = document.getElementById("quizOptions");
    var buttons = box.querySelectorAll(".opt");

    buttons.forEach(function (b, i) {
      b.disabled = true;
      if (q.options[i].correct) b.classList.add("is-ok");
    });
    if (!opt.correct) btn.classList.add("is-bad");

    Store.state.stats.answered++;
    if (opt.correct) {
      Quiz.correct++;
      Quiz.streak++;
      Store.state.stats.correct++;
      if (Quiz.streak > Store.state.stats.bestStreak) Store.state.stats.bestStreak = Quiz.streak;
      removeMistake(Quiz.mode, q.key);
      document.getElementById("quizVerdict").innerHTML = "<b>Правильно!</b> " + q.answerHtml;
      haptic("ok");
    } else {
      Quiz.streak = 0;
      Quiz.wrongItems.push(q);
      addMistake(Quiz.mode, q.key);
      document.getElementById("quizVerdict").innerHTML = "<i>Правильна відповідь:</i> " + q.answerHtml;
      haptic("bad");
    }
    document.getElementById("quizStreak").textContent = "🔥 " + Quiz.streak;
    Store.save();

    var next = document.getElementById("quizNext");
    next.hidden = false;
    next.textContent = (!Quiz.endless && Quiz.index >= Quiz.total) ? "Результат" : "Далі";
    scrollToEnd();

    // Довідка про персоналію зʼявляється окремо, вже після імені
    if (q.reveal) {
      var box = document.getElementById("quizReveal");
      setTimeout(function () {
        if (Quiz.current !== q) return;   // користувач уже перегорнув
        box.innerHTML = q.reveal;
        box.hidden = false;
        scrollToEnd();
      }, 550);
    }
  }

  function scrollToEnd() {
    try {
      document.getElementById("quizNext").scrollIntoView({ behavior: "smooth", block: "end" });
    } catch (e) {
      window.scrollTo(0, document.body.scrollHeight);
    }
  }

  function preloadNext() {
    if (Quiz.mode !== "per" && Quiz.mode !== "pam") return;
    var key = Quiz.endless
      ? Quiz.pool[Math.floor(Math.random() * Quiz.pool.length)]
      : Quiz.queue[Quiz.index];
    if (key === undefined) return;
    var list = Quiz.mode === "per" ? PERSON : PAMYATKY;
    var dir = Quiz.mode === "per" ? "img/personalii/" : "img/pamyatky/";
    if (!list[key]) return;
    var im = new Image();
    im.src = dir + list[key].img;
  }

  function finishQuiz() {
    var pct = Quiz.total ? Math.round(Quiz.correct / Quiz.total * 100) : 0;
    document.getElementById("resEmoji").textContent = pct === 100 ? "🏆" : pct >= 70 ? "🎉" : pct >= 40 ? "💪" : "📚";
    document.getElementById("resScore").textContent = Quiz.correct + " / " + Quiz.total;
    document.getElementById("resText").textContent =
      pct === 100 ? "Бездоганно!" :
      pct >= 70 ? "Добре, але є що підтягнути." :
      pct >= 40 ? "Половина шляху пройдена." : "Ця тема ще потребує уваги.";

    var wrongBox = document.getElementById("resWrong");
    wrongBox.innerHTML = "";
    if (Quiz.wrongItems.length) {
      var h = document.createElement("p");
      h.className = "page-sub";
      h.textContent = "Помилки цього раунду:";
      wrongBox.appendChild(h);
      Quiz.wrongItems.forEach(function (q) {
        var d = document.createElement("div");
        d.className = "list-item" + (q.image ? " list-item-img" : "");
        var body = q.prompt
          ? "<b>" + q.prompt + "</b><span>" + q.answerHtml.replace(/<\/?b>/g, "") + "</span>"
          : "<span>" + q.answerHtml + "</span>";
        d.innerHTML = (q.image ? '<img src="' + q.image + '" alt="">' : "") +
                      "<div>" + body + "</div>";
        wrongBox.appendChild(d);
      });
    }
    go("result");
  }

  /* ====================== ПОМИЛКИ ====================== */

  function addMistake(mode, key) {
    var list = Store.state.mistakes[mode];
    if (list.indexOf(key) < 0) list.push(key);
  }
  function removeMistake(mode, key) {
    var list = Store.state.mistakes[mode];
    var i = list.indexOf(key);
    if (i >= 0) list.splice(i, 1);
  }

  /* ====================== РЕНДЕР ЕКРАНІВ ====================== */

  function renderHome() {
    var s = Store.state.stats;
    var pct = s.answered ? Math.round(s.correct / s.answered * 100) : 0;
    document.getElementById("homeStats").innerHTML =
      '<div class="stat"><span class="stat-num">' + s.answered + '</span><span class="stat-lbl">відповідей</span></div>' +
      '<div class="stat"><span class="stat-num">' + pct + '%</span><span class="stat-lbl">правильних</span></div>' +
      '<div class="stat"><span class="stat-num">' + s.bestStreak + '</span><span class="stat-lbl">рекорд 🔥</span></div>';

    document.getElementById("cntNagolosy").textContent = NAGOLOSY.length + " " + plural(NAGOLOSY.length, "слово", "слова", "слів");
    document.getElementById("cntFrazeo").textContent = FRAZEO.length + " " + plural(FRAZEO.length, "вираз", "вирази", "виразів");
    document.getElementById("cntDaty").textContent = DATY.length + " дат · " + DATY_T.length + " тем";

    document.getElementById("cntPer").textContent =
      PERSON.length + " " + plural(PERSON.length, "постать", "постаті", "постатей");
    document.getElementById("cntPam").textContent =
      PAMYATKY.length + " " + plural(PAMYATKY.length, "пам'ятка", "пам'ятки", "пам'яток");

    var M = Store.state.mistakes;
    setMistakeLabel("cntNagMistakes", M.nag.length, "слово", "слова", "слів");
    setMistakeLabel("cntFrzMistakes", M.frz.length, "вираз", "вирази", "виразів");
    setMistakeLabel("cntPerMistakes", M.per.length, "постать", "постаті", "постатей");
    setMistakeLabel("cntPamMistakes", M.pam.length, "пам'ятка", "пам'ятки", "пам'яток");
  }

  function setMistakeLabel(id, n, one, few, many) {
    var el = document.getElementById(id);
    if (!el) return;
    el.textContent = n ? n + " " + plural(n, one, few, many) + " чекає" : "Поки помилок немає";
  }

  function renderLetters() {
    var counts = {};
    NAGOLOSY.forEach(function (it, i) {
      var L = it.w.charAt(0).toUpperCase();
      (counts[L] = counts[L] || []).push(i);
    });
    var grid = document.getElementById("lettersGrid");
    grid.innerHTML = "";
    Object.keys(counts).sort(function (a, b) { return a.localeCompare(b, "uk"); }).forEach(function (L) {
      var b = document.createElement("button");
      b.className = "letter";
      b.type = "button";
      b.innerHTML = L + "<small>" + counts[L].length + "</small>";
      b.addEventListener("click", function () {
        startQuiz({ mode: "nag", make: makeNagolosyQuestion, pool: counts[L] });
      });
      grid.appendChild(b);
    });
  }

  function renderDatyTopics() {
    var box = document.getElementById("datyTopics");
    box.innerHTML = "";

    DATY_T.forEach(function (topic) {
      var keys = [];
      DATY.forEach(function (it, i) { if (it.topic === topic.id) keys.push(i); });
      var b = document.createElement("button");
      b.className = "tile";
      b.type = "button";
      b.innerHTML =
        '<span class="tile-icon">📜</span><span class="tile-text">' +
        '<span class="tile-title">' + esc(topic.title) + '</span>' +
        '<span class="tile-sub">' + keys.length + " " + plural(keys.length, "дата", "дати", "дат") + '</span></span>';
      b.addEventListener("click", function () {
        startQuiz({ mode: "dat", make: makeDatyQuestion, pool: keys });
      });
      box.appendChild(b);
    });

    var all = document.createElement("button");
    all.className = "tile";
    all.type = "button";
    all.innerHTML =
      '<span class="tile-icon">🎲</span><span class="tile-text">' +
      '<span class="tile-title">Усі підряд</span>' +
      '<span class="tile-sub">Випадкові дати з усіх тем</span></span>';
    all.addEventListener("click", function () {
      startQuiz({
        mode: "dat", make: makeDatyQuestion,
        pool: DATY.map(function (_, i) { return i; }), endless: true
      });
    });
    box.appendChild(all);

    var mistakes = document.createElement("button");
    mistakes.className = "tile";
    mistakes.type = "button";
    mistakes.innerHTML =
      '<span class="tile-icon">🔁</span><span class="tile-text">' +
      '<span class="tile-title">Робота над помилками</span>' +
      '<span class="tile-sub">' + (Store.state.mistakes.dat.length || "Поки помилок немає") + '</span></span>';
    mistakes.addEventListener("click", function () {
      if (!Store.state.mistakes.dat.length) { alert("Помилок поки немає — спершу пройди тему."); return; }
      startQuiz({ mode: "dat", make: makeDatyQuestion, pool: Store.state.mistakes.dat.slice() });
    });
    box.appendChild(mistakes);
  }

  function renderFrzList(filter) {
    var box = document.getElementById("frzList");
    var q = (filter || "").trim().toLowerCase();
    box.innerHTML = "";
    FRAZEO.filter(function (it) {
      return !q || it.p.toLowerCase().indexOf(q) >= 0 || it.m.toLowerCase().indexOf(q) >= 0;
    }).slice(0, 400).forEach(function (it) {
      var d = document.createElement("div");
      d.className = "list-item";
      d.innerHTML = "<b>" + esc(it.p) + "</b><span>" + esc(it.m) + "</span>";
      box.appendChild(d);
    });
  }

  function renderPerList(filter) {
    var box = document.getElementById("perList");
    var q = (filter || "").trim().toLowerCase();
    box.innerHTML = "";
    PERSON.filter(function (it) {
      return !q || it.name.toLowerCase().indexOf(q) >= 0 || it.desc.toLowerCase().indexOf(q) >= 0;
    }).forEach(function (it) {
      var d = document.createElement("div");
      d.className = "list-item list-item-img";
      d.innerHTML =
        '<img loading="lazy" src="img/personalii/' + it.img + '" alt="">' +
        "<div><b>" + esc(it.name) + "</b><span>" +
        (it.years ? esc(it.years) + " · " : "") + esc(it.desc) + "</span></div>";
      box.appendChild(d);
    });
  }

  function renderPamList(filter) {
    var box = document.getElementById("pamList");
    var q = (filter || "").trim().toLowerCase();
    box.innerHTML = "";
    PAMYATKY.filter(function (it) {
      return !q || it.name.toLowerCase().indexOf(q) >= 0;
    }).forEach(function (it) {
      var d = document.createElement("div");
      d.className = "list-item list-item-img";
      d.innerHTML =
        '<img loading="lazy" src="img/pamyatky/' + it.img + '" alt="">' +
        "<div><b>" + esc(it.name) + "</b>" +
        (it.note ? "<span>" + esc(it.note) + "</span>" : "") + "</div>";
      box.appendChild(d);
    });
  }

  function renderSettings() {
    var t = Store.state.theme;
    document.getElementById("bgPicker").value = t.bg || defaultBg();
    document.getElementById("accentPicker").value = t.accent || defaultAccent();
    document.getElementById("radiusRange").value = t.radius === undefined ? 16 : t.radius;

    fillSwatches("bgSwatches", BG_PRESETS, t.bg, function (c) {
      Store.state.theme.bg = c;
      document.getElementById("bgPicker").value = c;
      Theme.apply(); Store.save(); renderSettings();
    });
    fillSwatches("accentSwatches", ACCENT_PRESETS, t.accent, function (c) {
      Store.state.theme.accent = c;
      document.getElementById("accentPicker").value = c;
      Theme.apply(); Store.save(); renderSettings();
    });
  }

  function fillSwatches(id, colors, current, onPick) {
    var box = document.getElementById(id);
    box.innerHTML = "";
    colors.forEach(function (c) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "swatch" + (current && current.toLowerCase() === c ? " is-on" : "");
      b.style.background = c;
      b.addEventListener("click", function () { onPick(c); });
      box.appendChild(b);
    });
  }

  /* ====================== ЗАПУСК ====================== */

  function bind() {
    document.querySelectorAll("[data-go]").forEach(function (el) {
      el.addEventListener("click", function () {
        var target = el.dataset.go;
        haptic("tap");
        if (target === "home") { goHome(); return; }
        if (target === "nag-alpha") renderLetters();
        if (target === "daty") renderDatyTopics();
        if (target === "frz-list") renderFrzList("");
        if (target === "per-list") renderPerList("");
        if (target === "pam-list") renderPamList("");
        if (target === "settings") renderSettings();
        go(target);
      });
    });

    document.querySelectorAll("[data-quiz]").forEach(function (el) {
      el.addEventListener("click", function () {
        haptic("tap");
        var all = function (arr) { return arr.map(function (_, i) { return i; }); };
        switch (el.dataset.quiz) {
          case "nag-random":
            startQuiz({ mode: "nag", make: makeNagolosyQuestion, pool: all(NAGOLOSY), endless: true }); break;
          case "nag-round":
            startQuiz({ mode: "nag", make: makeNagolosyQuestion, pool: all(NAGOLOSY), limit: 10 }); break;
          case "nag-mistakes":
            if (!Store.state.mistakes.nag.length) { alert("Помилок поки немає — спершу потренуйся."); return; }
            startQuiz({ mode: "nag", make: makeNagolosyQuestion, pool: Store.state.mistakes.nag.slice() }); break;
          case "frz-random":
            startQuiz({ mode: "frz", make: makeFrazeoQuestion, pool: all(FRAZEO), endless: true }); break;
          case "frz-round":
            startQuiz({ mode: "frz", make: makeFrazeoQuestion, pool: all(FRAZEO), limit: 10 }); break;
          case "frz-mistakes":
            if (!Store.state.mistakes.frz.length) { alert("Помилок поки немає — спершу потренуйся."); return; }
            startQuiz({ mode: "frz", make: makeFrazeoQuestion, pool: Store.state.mistakes.frz.slice() }); break;
          case "per-random":
            startQuiz({ mode: "per", make: makePersonQuestion, pool: all(PERSON), endless: true }); break;
          case "per-round":
            startQuiz({ mode: "per", make: makePersonQuestion, pool: all(PERSON), limit: 10 }); break;
          case "per-mistakes":
            if (!Store.state.mistakes.per.length) { alert("Помилок поки немає — спершу потренуйся."); return; }
            startQuiz({ mode: "per", make: makePersonQuestion, pool: Store.state.mistakes.per.slice() }); break;
          case "pam-random":
            startQuiz({ mode: "pam", make: makePamyatkaQuestion, pool: all(PAMYATKY), endless: true }); break;
          case "pam-round":
            startQuiz({ mode: "pam", make: makePamyatkaQuestion, pool: all(PAMYATKY), limit: 10 }); break;
          case "pam-mistakes":
            if (!Store.state.mistakes.pam.length) { alert("Помилок поки немає — спершу потренуйся."); return; }
            startQuiz({ mode: "pam", make: makePamyatkaQuestion, pool: Store.state.mistakes.pam.slice() }); break;
        }
      });
    });

    document.getElementById("backBtn").addEventListener("click", function () {
      haptic("tap");
      back();
    });

    document.getElementById("quizNext").addEventListener("click", function () {
      haptic("tap");
      nextQuestion();
    });

    document.getElementById("resAgain").addEventListener("click", function () {
      haptic("tap");
      if (Quiz.restart) Quiz.restart();
    });

    document.getElementById("frzSearch").addEventListener("input", function (e) {
      renderFrzList(e.target.value);
    });
    document.getElementById("perSearch").addEventListener("input", function (e) {
      renderPerList(e.target.value);
    });
    document.getElementById("pamSearch").addEventListener("input", function (e) {
      renderPamList(e.target.value);
    });

    document.getElementById("bgPicker").addEventListener("input", function (e) {
      Store.state.theme.bg = e.target.value;
      Theme.apply();
    });
    document.getElementById("bgPicker").addEventListener("change", function () {
      Store.save(); renderSettings();
    });

    document.getElementById("accentPicker").addEventListener("input", function (e) {
      Store.state.theme.accent = e.target.value;
      Theme.apply();
    });
    document.getElementById("accentPicker").addEventListener("change", function () {
      Store.save(); renderSettings();
    });

    document.getElementById("radiusRange").addEventListener("input", function (e) {
      Store.state.theme.radius = Number(e.target.value);
      Theme.apply();
    });
    document.getElementById("radiusRange").addEventListener("change", function () { Store.save(); });

    document.getElementById("resetTheme").addEventListener("click", function () {
      Store.state.theme = { bg: "", accent: "", radius: 16 };
      Theme.apply(); Store.save(); renderSettings();
    });

    if (tg && tg.BackButton) {
      try { tg.BackButton.onClick(function () { back(); }); } catch (e) { /* ігноруємо */ }
    }
  }

  function init() {
    if (tg) {
      try { tg.ready(); tg.expand(); } catch (e) { /* ігноруємо */ }
    }
    Store.load();
    Theme.apply();
    bind();
    renderHome();
    show("home");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
