/* Функції та графіки для розділу «Математика».
   Графіки не зберігаються картинками — вони малюються просто в застосунку
   (SVG), тож важать нуль і завжди в кольорі теми.

   Назовні віддаємо window.MATH_GRAPHS з готовими питаннями. */

(function () {
  "use strict";

  /* ====================== МАЛЮВАННЯ ====================== */

  var PAD = 12, W = 100, H = 100;        // поле 100×100 плюс поля по краях
  var BOX = W + PAD * 2;

  // Переводимо математичні координати в координати картинки
  function mapper(win) {
    return {
      x: function (x) { return PAD + (x - win.x0) / (win.x1 - win.x0) * W; },
      y: function (y) { return PAD + (win.y1 - y) / (win.y1 - win.y0) * H; }
    };
  }

  // Будуємо лінію графіка. Там, де функція не визначена або злітає за межі,
  // лінія рветься — інакше вийшла б фальшива «перемичка» через увесь екран.
  function curvePath(f, win, m) {
    var N = 320, parts = [], cur = [], prev = null;
    var slack = (win.y1 - win.y0) * 0.1;
    for (var i = 0; i <= N; i++) {
      var x = win.x0 + (win.x1 - win.x0) * i / N;
      var y;
      try { y = f(x); } catch (e) { y = NaN; }

      var ok = isFinite(y) && y > win.y0 - slack && y < win.y1 + slack;
      // різкий стрибок — ознака розриву (наприклад, біля осі у k/x)
      if (ok && prev !== null && Math.abs(y - prev) > (win.y1 - win.y0) * 0.9) ok = false;

      if (ok) {
        cur.push(m.x(x).toFixed(1) + "," + m.y(y).toFixed(1));
        prev = y;
      } else {
        if (cur.length > 1) parts.push(cur);
        cur = [];
        prev = null;
      }
    }
    if (cur.length > 1) parts.push(cur);

    return parts.map(function (p) { return "M" + p.join(" L"); }).join(" ");
  }

  function axes(win, m) {
    var out = "", g;
    // сітка по цілих числах
    for (g = Math.ceil(win.x0); g <= win.x1; g++) {
      if (g === 0) continue;
      out += '<line class="g-grid" x1="' + m.x(g).toFixed(1) + '" y1="' + PAD +
             '" x2="' + m.x(g).toFixed(1) + '" y2="' + (PAD + H) + '"/>';
    }
    for (g = Math.ceil(win.y0); g <= win.y1; g++) {
      if (g === 0) continue;
      out += '<line class="g-grid" x1="' + PAD + '" y1="' + m.y(g).toFixed(1) +
             '" x2="' + (PAD + W) + '" y2="' + m.y(g).toFixed(1) + '"/>';
    }
    // самі осі зі стрілками
    var zx = m.x(0), zy = m.y(0);
    out += '<line class="g-axis" x1="' + (PAD - 4) + '" y1="' + zy.toFixed(1) +
           '" x2="' + (PAD + W + 7) + '" y2="' + zy.toFixed(1) + '"/>';
    out += '<line class="g-axis" x1="' + zx.toFixed(1) + '" y1="' + (PAD + H + 4) +
           '" x2="' + zx.toFixed(1) + '" y2="' + (PAD - 7) + '"/>';
    out += '<path class="g-arrow" d="M' + (PAD + W + 8) + ',' + zy.toFixed(1) +
           ' l-5,-2.6 l0,5.2 z"/>';
    out += '<path class="g-arrow" d="M' + zx.toFixed(1) + ',' + (PAD - 8) +
           ' l-2.6,5 l5.2,0 z"/>';
    out += '<text class="g-lbl" x="' + (PAD + W + 3) + '" y="' + (zy - 4).toFixed(1) + '">x</text>';
    out += '<text class="g-lbl" x="' + (zx + 5).toFixed(1) + '" y="' + (PAD - 1) + '">y</text>';
    // риски з одиницею
    out += '<line class="g-axis" x1="' + m.x(1).toFixed(1) + '" y1="' + (zy - 2.5).toFixed(1) +
           '" x2="' + m.x(1).toFixed(1) + '" y2="' + (zy + 2.5).toFixed(1) + '"/>';
    out += '<text class="g-lbl" x="' + m.x(1).toFixed(1) + '" y="' + (zy + 9).toFixed(1) +
           '" text-anchor="middle">1</text>';
    out += '<line class="g-axis" x1="' + (zx - 2.5).toFixed(1) + '" y1="' + m.y(1).toFixed(1) +
           '" x2="' + (zx + 2.5).toFixed(1) + '" y2="' + m.y(1).toFixed(1) + '"/>';
    out += '<text class="g-lbl" x="' + (zx - 4).toFixed(1) + '" y="' + (m.y(1) + 3).toFixed(1) +
           '" text-anchor="end">1</text>';
    return out;
  }

  // curves: [{ f: функція, ghost: true — блідим пунктиром }]
  function draw(curves, win, cls) {
    var m = mapper(win || WIN);
    var body = axes(win || WIN, m);
    curves.forEach(function (c) {
      var d = curvePath(c.f, win || WIN, m);
      if (!d) return;
      body += '<path class="' + (c.ghost ? "g-ghost" : "g-curve") + '" d="' + d + '"/>';
    });
    return '<svg class="graph ' + (cls || "") + '" viewBox="0 0 ' + BOX + ' ' + BOX +
           '" preserveAspectRatio="xMidYMid meet" aria-hidden="true">' + body + "</svg>";
  }

  var WIN = { x0: -5.5, x1: 5.5, y0: -5.5, y1: 5.5 };

  /* ====================== СІМ'Ї ФУНКЦІЙ ====================== */

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  // coef(k, v) — як записати число перед змінною: 1 і −1 пишуться без одиниці
  function coef(k, v) {
    if (k === 1) return v;
    if (k === -1) return "-" + v;
    return k + v;
  }
  function plus(b) { return b === 0 ? "" : (b > 0 ? " + " + b : " - " + (-b)); }
  function shiftX(h) { return h === 0 ? "x" : (h > 0 ? "(x - " + h + ")" : "(x + " + (-h) + ")"); }
  function inner(h) { return h === 0 ? "x" : (h > 0 ? "x - " + h : "x + " + (-h)); }

  var BASES = [
    { v: 2, tex: "2" }, { v: 3, tex: "3" }, { v: 4, tex: "4" },
    { v: 0.5, tex: "\\frac{1}{2}" }, { v: 1 / 3, tex: "\\frac{1}{3}" }
  ];

  var FAMILIES = [
    {
      id: "lin", title: "Лінійна",
      rand: function () { return { k: pick([-3, -2, -1, 1, 2, 3]), b: ri(-3, 3) }; },
      f: function (p) { return function (x) { return p.k * x + p.b; }; },
      tex: function (p) { return "y = " + coef(p.k, "x") + plus(p.b); },
      dom: function () { return "x — будь-яке число"; },
      ran: function () { return "y — будь-яке число"; }
    },
    {
      id: "quad", title: "Квадратична", even: true,
      rand: function () { return { a: pick([-1, -1, 1, 1, 2, -2]), h: ri(-2, 2), k: ri(-3, 3) }; },
      f: function (p) { return function (x) { return p.a * (x - p.h) * (x - p.h) + p.k; }; },
      tex: function (p) { return "y = " + coef(p.a, shiftX(p.h) + "^2") + plus(p.k); },
      dom: function () { return "x — будь-яке число"; },
      ran: function (p) { return p.a > 0 ? "y ≥ " + p.k : "y ≤ " + p.k; }
    },
    {
      id: "cube", title: "Кубічна", odd: true,
      rand: function () { return { a: pick([-1, 1]), h: ri(-2, 2), k: ri(-2, 2) }; },
      f: function (p) { return function (x) { return p.a * Math.pow(x - p.h, 3) + p.k; }; },
      tex: function (p) { return "y = " + coef(p.a, shiftX(p.h) + "^3") + plus(p.k); },
      dom: function () { return "x — будь-яке число"; },
      ran: function () { return "y — будь-яке число"; }
    },
    {
      id: "inv", title: "Обернена пропорційність", odd: true,
      rand: function () { return { k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]) }; },
      f: function (p) { return function (x) { return p.k / x; }; },
      tex: function (p) {
        return p.k < 0 ? "y = -\\frac{" + (-p.k) + "}{x}" : "y = \\frac{" + p.k + "}{x}";
      },
      dom: function () { return "x ≠ 0"; },
      ran: function () { return "y ≠ 0"; }
    },
    {
      id: "sqrt", title: "Квадратний корінь",
      rand: function () { return { h: ri(-3, 2), k: ri(-2, 2) }; },
      f: function (p) {
        return function (x) { return x < p.h ? NaN : Math.sqrt(x - p.h) + p.k; };
      },
      tex: function (p) { return "y = \\sqrt{" + inner(p.h) + "}" + plus(p.k); },
      dom: function (p) { return "x ≥ " + p.h; },
      ran: function (p) { return "y ≥ " + p.k; }
    },
    {
      id: "abs", title: "Модуль", even: true,
      rand: function () { return { a: pick([-1, 1, 2, -2]), h: ri(-2, 2), k: ri(-3, 2) }; },
      f: function (p) { return function (x) { return p.a * Math.abs(x - p.h) + p.k; }; },
      tex: function (p) { return "y = " + coef(p.a, "|" + inner(p.h) + "|") + plus(p.k); },
      dom: function () { return "x — будь-яке число"; },
      ran: function (p) { return p.a > 0 ? "y ≥ " + p.k : "y ≤ " + p.k; }
    },
    {
      id: "exp", title: "Показникова",
      rand: function () { var b = pick(BASES); return { a: b.v, tex: b.tex }; },
      f: function (p) { return function (x) { return Math.pow(p.a, x); }; },
      tex: function (p) {
        return "y = " + (p.a < 1 ? "\\left(" + p.tex + "\\right)" : p.tex) + "^{x}";
      },
      dom: function () { return "x — будь-яке число"; },
      ran: function () { return "y > 0"; }
    },
    {
      id: "log", title: "Логарифмічна",
      rand: function () { var b = pick(BASES); return { a: b.v, tex: b.tex }; },
      f: function (p) {
        return function (x) { return x <= 0 ? NaN : Math.log(x) / Math.log(p.a); };
      },
      tex: function (p) { return "y = \\log_{" + p.tex + "} x"; },
      dom: function () { return "x > 0"; },
      ran: function () { return "y — будь-яке число"; }
    },
    {
      id: "sin", title: "Синус", odd: true,
      rand: function () { return { a: pick([1, 2, 3, -1, -2]), b: pick([1, 2]) }; },
      f: function (p) { return function (x) { return p.a * Math.sin(p.b * x); }; },
      tex: function (p) { return "y = " + coef(p.a, "\\sin " + (p.b === 1 ? "x" : p.b + "x")); },
      dom: function () { return "x — будь-яке число"; },
      ran: function (p) { return "−" + Math.abs(p.a) + " ≤ y ≤ " + Math.abs(p.a); }
    },
    {
      id: "cos", title: "Косинус", even: true,
      rand: function () { return { a: pick([1, 2, 3, -1, -2]), b: pick([1, 2]) }; },
      f: function (p) { return function (x) { return p.a * Math.cos(p.b * x); }; },
      tex: function (p) { return "y = " + coef(p.a, "\\cos " + (p.b === 1 ? "x" : p.b + "x")); },
      dom: function () { return "x — будь-яке число"; },
      ran: function (p) { return "−" + Math.abs(p.a) + " ≤ y ≤ " + Math.abs(p.a); }
    }
  ];

  function famById(id) {
    for (var i = 0; i < FAMILIES.length; i++) if (FAMILIES[i].id === id) return FAMILIES[i];
    return null;
  }

  /* Чи помітно відрізняються два графіки. Без цієї перевірки серед варіантів
     міг би трапитися майже такий самий графік — і питання стало б нечесним. */
  function differs(f1, f2) {
    var n = 0;
    for (var i = 0; i <= 44; i++) {
      var x = WIN.x0 + (WIN.x1 - WIN.x0) * i / 44;
      var a, b;
      try { a = f1(x); } catch (e) { a = NaN; }
      try { b = f2(x); } catch (e) { b = NaN; }
      var aIn = isFinite(a) && a >= WIN.y0 && a <= WIN.y1;
      var bIn = isFinite(b) && b >= WIN.y0 && b <= WIN.y1;
      if (aIn !== bIn) { n += 1; continue; }
      if (aIn && Math.abs(a - b) > 0.5) n++;
    }
    return n >= 6;
  }

  // Набираємо кілька різних наборів параметрів однієї сім'ї
  function variants(fam, correct, count) {
    var out = [], guard = 0;
    var fc = fam.f(correct);
    while (out.length < count && guard++ < 250) {
      var p = fam.rand();
      var fp = fam.f(p);
      if (!differs(fc, fp)) continue;
      var dup = out.some(function (o) { return !differs(fam.f(o), fp); });
      if (!dup) out.push(p);
    }
    return out;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Сім'ї, у яких мало різних наборів параметрів (показникова, логарифмічна),
  // для питань «знайди графік» не беремо: там важко набрати 3 чесні відволікачі.
  var RICH = FAMILIES.filter(function (f) {
    return ["lin", "quad", "cube", "inv", "sqrt", "abs", "sin", "cos"].indexOf(f.id) >= 0;
  });

  /* ====================== ПИТАННЯ ====================== */

  // 1. Формула → знайти її графік
  function qFindGraph() {
    for (var attempt = 0; attempt < 12; attempt++) {
      var fam = pick(RICH);
      var p = fam.rand();
      var others = variants(fam, p, 3);
      if (others.length < 3) continue;

      var opts = shuffle(
        [{ html: draw([{ f: fam.f(p) }], WIN, "is-opt"), correct: true }].concat(
          others.map(function (o) {
            return { html: draw([{ f: fam.f(o) }], WIN, "is-opt"), correct: false };
          })
        )
      );
      return {
        key: "g1",
        label: "Який графік відповідає функції?",
        tex: fam.tex(p),
        optionKind: "graphs",
        options: opts,
        answerTex: fam.tex(p),
        reveal: fam.title + " · " + fam.dom(p) + " · " + fam.ran(p),
        check: { fam: fam.id, right: p, wrong: others }
      };
    }
    return qProps();
  }

  // 2. Графік → знайти формулу
  function qFindFormula() {
    for (var attempt = 0; attempt < 12; attempt++) {
      var fam = pick(RICH);
      var p = fam.rand();
      var others = variants(fam, p, 3);
      if (others.length < 3) continue;

      var right = fam.tex(p);
      var texts = others.map(function (o) { return fam.tex(o); });
      if (texts.indexOf(right) >= 0) continue;          // підпис випадково зійшовся
      if (texts[0] === texts[1] || texts[1] === texts[2] || texts[0] === texts[2]) continue;

      var opts = shuffle(
        [{ tex: right, correct: true }].concat(
          texts.map(function (t) { return { tex: t, correct: false }; })
        )
      );
      return {
        key: "g2",
        label: "Яка формула задає цей графік?",
        svg: draw([{ f: fam.f(p) }], WIN, "is-big"),
        optionKind: "tex",
        options: opts,
        answerTex: right,
        reveal: fam.title + " · " + fam.dom(p) + " · " + fam.ran(p),
        check: { fam: fam.id, right: p, wrong: others }
      };
    }
    return qProps();
  }

  // 3. Перенесення графіка
  var MOVES = [
    { tex: "y = f(x) + B", say: "зсув угору на B", g: function (f, b) { return function (x) { return f(x) + b; }; } },
    { tex: "y = f(x) - B", say: "зсув униз на B", g: function (f, b) { return function (x) { return f(x) - b; }; } },
    { tex: "y = f(x - B)", say: "зсув праворуч на B", g: function (f, b) { return function (x) { return f(x - b); }; } },
    { tex: "y = f(x + B)", say: "зсув ліворуч на B", g: function (f, b) { return function (x) { return f(x + b); }; } },
    { tex: "y = -f(x)", say: "симетрія відносно осі x", g: function (f) { return function (x) { return -f(x); }; } },
    { tex: "y = f(-x)", say: "симетрія відносно осі y", g: function (f) { return function (x) { return f(-x); }; } },
    { tex: "y = 2f(x)", say: "розтяг від осі x удвічі", g: function (f) { return function (x) { return 2 * f(x); }; } }
  ];

  var MOVE_BASES = [
    { fam: "quad", p: { a: 1, h: 0, k: 0 } },
    { fam: "abs", p: { a: 1, h: 0, k: 0 } },
    { fam: "sqrt", p: { h: 0, k: 0 } },
    { fam: "cube", p: { a: 1, h: 0, k: 0 } },
    { fam: "inv", p: { k: 2 } }
  ];

  function qMove() {
    for (var attempt = 0; attempt < 12; attempt++) {
      var spec = pick(MOVE_BASES);
      var fam = famById(spec.fam);
      var base = fam.f(spec.p);
      var b = ri(2, 3);

      // Відкидаємо перетворення, які для цієї функції дають той самий графік
      // (наприклад, y = f(−x) для парної функції нічого не змінює).
      var good = MOVES.filter(function (mv) {
        return differs(base, mv.g(base, b));
      });
      // і ті, що між собою дають однакову картинку
      var set = [];
      shuffle(good).forEach(function (mv) {
        var fn = mv.g(base, b);
        var same = set.some(function (o) { return !differs(o.g(base, b), fn); });
        if (!same) set.push(mv);
      });
      if (set.length < 4) continue;

      set = set.slice(0, 4);
      var right = pick(set);
      var opts = shuffle(set.map(function (mv) {
        return {
          html: draw([{ f: base, ghost: true }, { f: mv.g(base, b) }], WIN, "is-opt"),
          correct: mv === right
        };
      }));

      return {
        key: "g3",
        label: "Як виглядатиме графік після перетворення?",
        tex: right.tex.replace("B", b),
        note: "Блідим пунктиром — початковий графік y = f(x)",
        optionKind: "graphs",
        options: opts,
        answerHtml: "<b>" + right.say.replace("B", b) + "</b>",
        revealTex: fam.tex(spec.p),
        reveal: "Початковий графік",
        check: { fam: fam.id, base: spec.p, b: b, moves: set.map(function (mv) { return mv.tex; }), rightMove: right.tex }
      };
    }
    return qProps();
  }

  // 4. Властивості функції за графіком
  function qProps() {
    for (var attempt = 0; attempt < 20; attempt++) {
      var fam = pick(FAMILIES);
      var p = fam.rand();
      var askDom = Math.random() < 0.5;

      var right = askDom ? fam.dom(p) : fam.ran(p);
      var bag = [], guard = 0;
      while (bag.length < 3 && guard++ < 200) {
        var f2 = pick(FAMILIES);
        var p2 = f2.rand();
        var v = askDom ? f2.dom(p2) : f2.ran(p2);
        if (v === right || bag.indexOf(v) >= 0) continue;
        bag.push(v);
      }
      if (bag.length < 3) continue;

      var opts = shuffle(
        [{ text: right, correct: true }].concat(bag.map(function (v) {
          return { text: v, correct: false };
        }))
      );
      return {
        key: "g4",
        label: askDom ? "Яка область визначення функції?" : "Яка область значень функції?",
        svg: draw([{ f: fam.f(p) }], WIN, "is-big"),
        options: opts,
        answerHtml: "<b>" + right + "</b>",
        revealTex: fam.tex(p),
        reveal: fam.title,
        check: { fam: fam.id, right: p, askDom: askDom }
      };
    }
    return null;
  }

  window.MATH_GRAPHS = {
    families: FAMILIES,
    famById: famById,
    differs: differs,
    MOVES: MOVES,
    draw: draw,
    WIN: WIN,
    makers: {
      "find-graph": qFindGraph,
      "find-formula": qFindFormula,
      "move": qMove,
      "props": qProps
    }
  };
})();
