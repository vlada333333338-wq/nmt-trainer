/* Практика з математики: задачі з числами, що складаються на ходу.
   Кожен генератор віддає готове питання з чотирма варіантами.

   Головне правило відволікачів: це не випадкові числа, а типові помилки —
   збився на одиницю в показнику, забув поділити на два, переплутав
   сполучення з розміщеннями. Тому варіанти завжди однорідні з правильною
   відповіддю, і вгадати «на око» не вийде.

   Назовні віддаємо window.MATH_PRACTICE. */

(function () {
  "use strict";

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function nz(a, b) { var v = 0; while (v === 0) v = ri(a, b); return v; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // «x - 3» або «x + 3» — щоб ніде не виходило «x - -3»
  function inner(a) { return a === 0 ? "x" : (a > 0 ? "x - " + a : "x + " + (-a)); }
  function whole(v) { return Number.isInteger(v) ? String(v) : null; }

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a; }

  // Дріб у вигляді TeX, уже скорочений
  function frac(n, d) {
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d) || 1;
    n /= g; d /= g;
    if (d === 1) return String(n).replace("-", "-");
    return (n < 0 ? "-" : "") + "\\frac{" + Math.abs(n) + "}{" + d + "}";
  }

  // Число з комою замість точки — як пишуть у школі
  function num(v) {
    var s = (Math.round(v * 1000) / 1000).toString();
    return s.replace(".", "{,}");
  }

  /* Збирає варіанти: правильний плюс відволікачі. Однакові відкидає,
     і якщо чесних відволікачів забракло — питання перескладається. */
  function build(correctTex, wrongTexs) {
    var seen = {}, out = [{ tex: correctTex, correct: true }];
    seen[correctTex] = 1;
    wrongTexs.forEach(function (w) {
      if (out.length >= 4 || w === null || w === undefined || seen[w]) return;
      seen[w] = 1;
      out.push({ tex: w, correct: false });
    });
    return out.length === 4 ? shuffle(out) : null;
  }

  function buildText(correct, wrongs) {
    var seen = {}, out = [{ text: correct, correct: true }];
    seen[correct] = 1;
    wrongs.forEach(function (w) {
      if (out.length >= 4 || !w || seen[w]) return;
      seen[w] = 1;
      out.push({ text: w, correct: false });
    });
    return out.length === 4 ? shuffle(out) : null;
  }

  /* ====================== ПРОГРЕСІЇ ====================== */

  // n-й член арифметичної прогресії
  function arithNth() {
    var a1 = ri(-9, 12), d = nz(-7, 8), n = ri(7, 25);
    var right = a1 + (n - 1) * d;
    var opts = build(String(right), [
      String(a1 + n * d),              // зайвий крок
      String(a1 + (n - 2) * d),        // крок замало
      String(a1 - (n - 1) * d),        // переплутав знак різниці
      String(n * d)                    // забув перший член
    ]);
    if (!opts) return null;
    return {
      label: "Арифметична прогресія",
      text: "a₁ = " + a1 + ", d = " + d + ". Знайди a" + sub(n) + ".",
      options: opts,
      answerTex: String(right),
      reveal: "aₙ = a₁ + (n − 1)d = " + a1 + " + " + (n - 1) + " · (" + d + ") = " + right
    };
  }

  // сума n перших членів арифметичної прогресії
  function arithSum() {
    var a1 = ri(-8, 12), d = nz(-5, 7), n = ri(6, 20);
    var an = a1 + (n - 1) * d;
    var right = n * (a1 + an) / 2;
    if (right !== Math.round(right)) return null;
    var opts = build(String(right), [
      whole(n * (a1 + an)),                 // забув поділити на 2
      whole(n * (2 * a1 + n * d) / 2),      // збився на одиницю
      whole(n * a1 + (n - 1) * d),          // склав формулу навмання
      whole((a1 + an) / 2)                  // знайшов середнє, а не суму
    ]);
    if (!opts) return null;
    return {
      label: "Арифметична прогресія",
      text: "a₁ = " + a1 + ", d = " + d + ". Знайди суму перших " + n + " членів.",
      options: opts,
      answerTex: String(right),
      reveal: "Sₙ = n(a₁ + aₙ)/2 = " + n + " · (" + a1 + " + " + an + ") / 2 = " + right
    };
  }

  // n-й член геометричної прогресії
  function geomNth() {
    var b1 = pick([1, 2, 3, 4, 5, -2, -3]), q = pick([2, 3, -2, -3]), n = ri(4, 8);
    var right = b1 * Math.pow(q, n - 1);
    if (Math.abs(right) > 1e7) return null;
    var opts = build(String(right), [
      String(b1 * Math.pow(q, n)),          // зайвий множник
      String(b1 * Math.pow(q, n - 2)),      // множника забракло
      String(b1 * q * (n - 1)),             // помножив замість піднесення
      String(Math.pow(b1, n - 1) * q)       // переплутав, що підносити
    ]);
    if (!opts) return null;
    return {
      label: "Геометрична прогресія",
      text: "b₁ = " + b1 + ", q = " + q + ". Знайди b" + sub(n) + ".",
      options: opts,
      answerTex: String(right),
      reveal: "bₙ = b₁ · q^(n−1) = " + b1 + " · (" + q + ")^" + (n - 1) + " = " + right
    };
  }

  // сума нескінченної геометричної прогресії
  function geomInf() {
    var qd = pick([2, 3, 4, 5]), qn = pick([1, -1]);
    // b1 добираємо так, щоб сума вийшла цілим числом
    var b1 = (qd - qn) * ri(1, 6);
    var right = b1 / (1 - qn / qd);               // S = b1 / (1 - q)
    var opts = build(num(right), [
      num(b1 / (1 + qn / qd)),                    // переплутав знак у знаменнику
      num(b1 * (1 - qn / qd)),                    // помножив замість поділити
      num(1 / (1 - qn / qd)),                     // забув перший член
      num(b1 / (qn / qd))                         // поділив просто на q
    ]);
    if (!opts) return null;
    return {
      label: "Геометрична прогресія",
      text: "b₁ = " + b1 + ", q = " + (qn < 0 ? "−" : "") + "1/" + qd +
            ". Знайди суму нескінченної прогресії.",
      options: opts,
      answerTex: num(right),
      reveal: "S = b₁ / (1 − q)"
    };
  }

  function sub(n) {
    var map = { "0": "₀", "1": "₁", "2": "₂", "3": "₃", "4": "₄",
                "5": "₅", "6": "₆", "7": "₇", "8": "₈", "9": "₉" };
    return String(n).split("").map(function (c) { return map[c]; }).join("");
  }

  /* ====================== ПОХІДНА ====================== */

  // Запис многочлена у TeX: [{c: коефіцієнт, p: степінь}]
  function poly(terms) {
    var out = "";
    terms.filter(function (t) { return t.c !== 0; }).forEach(function (t, i) {
      var c = t.c, body;
      if (t.p === 0) body = String(Math.abs(c));
      else {
        var k = Math.abs(c) === 1 ? "" : String(Math.abs(c));
        body = k + "x" + (t.p === 1 ? "" : "^{" + t.p + "}");
      }
      out += (i === 0 ? (c < 0 ? "-" : "") : (c < 0 ? " - " : " + ")) + body;
    });
    return out || "0";
  }

  function derivOf(terms) {
    return terms.filter(function (t) { return t.p > 0; })
                .map(function (t) { return { c: t.c * t.p, p: t.p - 1 }; });
  }

  // знайти похідну многочлена
  function derivPoly() {
    var n = ri(2, 4), m = ri(1, n - 1);
    var terms = [{ c: nz(-5, 6), p: n }, { c: nz(-7, 8), p: m }, { c: nz(-9, 9), p: 0 }];
    var right = derivOf(terms);

    var noPower = terms.filter(function (t) { return t.p > 0; })
                       .map(function (t) { return { c: t.c, p: t.p - 1 }; });
    var noDrop = terms.filter(function (t) { return t.p > 0; })
                      .map(function (t) { return { c: t.c * t.p, p: t.p }; });
    var keepConst = right.map(function (t) {
      return t.p === 0 ? { c: t.c + terms[2].c, p: 0 } : t;
    });
    if (!right.some(function (t) { return t.p === 0; })) {
      keepConst = right.concat([{ c: terms[2].c, p: 0 }]);
    }

    var opts = build(poly(right), [poly(noPower), poly(noDrop), poly(keepConst)]);
    if (!opts) return null;
    return {
      label: "Похідна",
      tex: "f(x) = " + poly(terms),
      text: "Знайди f′(x).",
      options: opts,
      answerTex: poly(right),
      reveal: "Кожен доданок: (axⁿ)′ = a·n·xⁿ⁻¹, а стала зникає."
    };
  }

  // значення похідної в точці
  function derivAt() {
    var n = ri(2, 3);
    var terms = [{ c: nz(-4, 5), p: n }, { c: nz(-6, 7), p: 1 }, { c: nz(-9, 9), p: 0 }];
    var d = derivOf(terms);
    var x0 = nz(-3, 3);

    function val(ts, x) {
      return ts.reduce(function (s, t) { return s + t.c * Math.pow(x, t.p); }, 0);
    }
    var right = val(d, x0);
    var noPower = terms.filter(function (t) { return t.p > 0; })
                       .map(function (t) { return { c: t.c, p: t.p - 1 }; });

    var opts = build(String(right), [
      String(val(terms, x0)),        // підставив у саму функцію
      String(val(noPower, x0)),      // забув помножити на показник
      String(-right),                // загубив знак
      String(val(d, -x0))            // підставив протилежне число
    ]);
    if (!opts) return null;
    return {
      label: "Похідна",
      tex: "f(x) = " + poly(terms),
      text: "Знайди f′(" + x0 + ").",
      options: opts,
      answerTex: String(right),
      revealTex: "f'(x) = " + poly(d),
      reveal: "Спершу похідна, аж потім підстановка x = " + x0
    };
  }

  /* ====================== КОМБІНАТОРИКА ====================== */

  function fact(n) { var r = 1; for (var i = 2; i <= n; i++) r *= i; return r; }
  function A(n, k) { var r = 1; for (var i = 0; i < k; i++) r *= (n - i); return r; }
  function C(n, k) { return A(n, k) / fact(k); }

  function combChoose() {
    var n = ri(5, 9), k = ri(2, 3);
    var right = C(n, k);
    var opts = build(String(right), [
      String(A(n, k)),          // порахував із порядком
      String(C(n, k + 1)),
      String(C(n, k - 1)),
      String(n * k)
    ]);
    if (!opts) return null;
    return {
      label: "Комбінаторика",
      text: "Скількома способами можна обрати " + k + " предмети з " + n +
            ", якщо порядок не має значення?",
      options: opts,
      answerTex: String(right),
      reveal: "Це сполучення: C(n, k) = n! / (k!(n − k)!) = " + right
    };
  }

  function combOrder() {
    var n = ri(5, 9), k = ri(2, 3);
    var right = A(n, k);
    var opts = build(String(right), [
      String(C(n, k)),          // забув про порядок
      String(Math.pow(n, k)),   // дозволив повтори
      String(fact(n)),
      String(A(n, k + 1))
    ]);
    if (!opts) return null;
    return {
      label: "Комбінаторика",
      text: "Скількома способами можна зайняти " + k + " призові місця, якщо учасників " +
            n + "?",
      options: opts,
      answerTex: String(right),
      reveal: "Це розміщення: A(n, k) = n! / (n − k)! = " + right
    };
  }

  function combPerm() {
    var n = ri(4, 7);
    var right = fact(n);
    var opts = build(String(right), [
      String(fact(n - 1)),
      String(Math.pow(n, 2)),
      String(Math.pow(2, n)),
      String(fact(n + 1))
    ]);
    if (!opts) return null;
    return {
      label: "Комбінаторика",
      text: "Скількома способами можна розставити " + n + " різних книжок на полиці?",
      options: opts,
      answerTex: String(right),
      reveal: "Це перестановки: Pₙ = n! = " + right
    };
  }

  function probBall() {
    var w = ri(2, 9), b = ri(2, 9);
    var right = frac(w, w + b);
    var opts = build(right, [
      frac(b, w + b),       // узяв не той колір
      frac(w, b),           // поділив на інший колір
      frac(w + b, w),       // перевернув дріб
      frac(b, w)
    ]);
    if (!opts) return null;
    return {
      label: "Ймовірність",
      text: "У коробці " + w + " білих і " + b + " чорних куль. Яка ймовірність " +
            "витягти білу?",
      options: opts,
      answerTex: right,
      reveal: "P = сприятливі / усі = " + w + " / " + (w + b)
    };
  }

  /* ====================== ОБЛАСТЬ ВИЗНАЧЕННЯ ====================== */

  var DOM_SHAPES = [
    { tex: function (a) { return "y = \\sqrt{" + inner(a) + "}"; }, right: function (a) { return "x ≥ " + a; } },
    { tex: function (a) { return "y = \\sqrt{" + (a < 0 ? "-" + (-a) : a) + " - x}"; }, right: function (a) { return "x ≤ " + a; } },
    { tex: function (a) { return "y = \\frac{1}{" + inner(a) + "}"; }, right: function (a) { return "x ≠ " + a; } },
    { tex: function (a) { return "y = \\frac{1}{\\sqrt{" + inner(a) + "}}"; }, right: function (a) { return "x > " + a; } },
    { tex: function (a) { return "y = \\log_{2}(" + inner(a) + ")"; }, right: function (a) { return "x > " + a; } }
  ];

  function domain() {
    var shape = pick(DOM_SHAPES);
    var a = nz(-8, 9);
    var right = shape.right(a);

    var wrongs = [];
    DOM_SHAPES.forEach(function (s) {
      var v = s.right(a);
      if (v !== right) wrongs.push(v);
    });
    wrongs.push("x ≥ " + (-a), "x ≤ " + (-a), "x ≠ " + (-a));

    var opts = buildText(right, shuffle(wrongs));
    if (!opts) return null;
    return {
      label: "Область визначення",
      tex: shape.tex(a),
      text: "Знайди область визначення.",
      options: opts,
      answerHtml: "<b>" + right + "</b>",
      reveal: "Під коренем — невід'ємне, у знаменнику — не нуль, під логарифмом — додатне."
    };
  }

  /* ====================== ТРИГОНОМЕТРІЯ ====================== */

  // Точні значення для табличних кутів
  var TRIG = [
    { deg: 0,   sin: "0",             cos: "1",              tg: "0" },
    { deg: 30,  sin: "\\frac{1}{2}",  cos: "\\frac{\\sqrt{3}}{2}", tg: "\\frac{\\sqrt{3}}{3}" },
    { deg: 45,  sin: "\\frac{\\sqrt{2}}{2}", cos: "\\frac{\\sqrt{2}}{2}", tg: "1" },
    { deg: 60,  sin: "\\frac{\\sqrt{3}}{2}", cos: "\\frac{1}{2}", tg: "\\sqrt{3}" },
    { deg: 90,  sin: "1",             cos: "0",              tg: null },
    { deg: 120, sin: "\\frac{\\sqrt{3}}{2}", cos: "-\\frac{1}{2}", tg: "-\\sqrt{3}" },
    { deg: 135, sin: "\\frac{\\sqrt{2}}{2}", cos: "-\\frac{\\sqrt{2}}{2}", tg: "-1" },
    { deg: 150, sin: "\\frac{1}{2}",  cos: "-\\frac{\\sqrt{3}}{2}", tg: "-\\frac{\\sqrt{3}}{3}" },
    { deg: 180, sin: "0",             cos: "-1",             tg: "0" },
    { deg: 270, sin: "-1",            cos: "0",              tg: null },
    { deg: 360, sin: "0",             cos: "1",              tg: "0" }
  ];

  function trigValue() {
    var fn = pick(["sin", "cos", "tg"]);
    var row = pick(TRIG.filter(function (r) { return r[fn] !== null; }));
    var right = row[fn];

    // відволікачі — значення тієї самої функції при інших кутах
    var pool = [];
    TRIG.forEach(function (r) {
      if (r[fn] && r[fn] !== right) pool.push(r[fn]);
    });
    // і дзеркальне значення з протилежним знаком
    pool.push(right.charAt(0) === "-" ? right.slice(1) : "-" + right);

    var opts = build(right, shuffle(pool));
    if (!opts) return null;
    return {
      label: "Тригонометрія",
      tex: (fn === "tg" ? "\\operatorname{tg}" : "\\" + fn) + " " + row.deg + "^{\\circ}",
      text: "Чому дорівнює?",
      options: opts,
      answerTex: right,
      reveal: "Табличне значення. Варто тримати в голові кути 0°, 30°, 45°, 60°, 90°."
    };
  }

  var TRIPLES = [[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [7, 24, 25], [20, 21, 29]];

  function trigPyth() {
    var t = pick(TRIPLES);
    var a = t[0], b = t[1], c = t[2];
    var given = pick(["sin", "cos"]);
    var right = given === "sin" ? frac(b, c) : frac(a, c);
    var gv = given === "sin" ? frac(a, c) : frac(b, c);
    var want = given === "sin" ? "cos" : "sin";

    var opts = build(right, [
      "-" + right,            // забув, що кут у першій чверті
      gv,                     // повторив те, що дано
      frac(c, given === "sin" ? b : a),   // перевернув дріб
      frac(a, b)
    ]);
    if (!opts) return null;
    return {
      label: "Тригонометрія",
      tex: "\\" + given + "\\alpha = " + gv + ",\\quad 0^{\\circ} < \\alpha < 90^{\\circ}",
      text: "Знайди " + (want === "sin" ? "sin α" : "cos α") + ".",
      options: opts,
      answerTex: right,
      reveal: "sin²α + cos²α = 1, а в першій чверті обидва значення додатні."
    };
  }

  /* ====================== ВІДСОТКИ ====================== */

  function percOf() {
    var p = pick([5, 10, 12, 15, 20, 25, 30, 40, 60, 75]);
    var base = ri(2, 40) * 20;
    var right = base * p / 100;
    if (right !== Math.round(right)) return null;
    var opts = build(num(right), [
      num(base * p),                 // забув поділити на 100
      num(base / p),                 // поділив замість помножити
      num(base - right),             // знайшов решту
      num(base * (100 - p) / 100)
    ]);
    if (!opts) return null;
    return {
      label: "Відсотки",
      text: "Знайди " + p + " % від числа " + base + ".",
      options: opts,
      answerTex: num(right),
      reveal: p + " % = " + (p / 100).toString().replace(".", ",") + ", тому " +
              base + " · " + (p / 100).toString().replace(".", ",") + " = " + right
    };
  }

  function percChange() {
    var p = pick([5, 10, 15, 20, 25, 40, 50]);
    var base = ri(2, 30) * 40;
    var up = Math.random() < 0.5;
    var right = up ? base * (1 + p / 100) : base * (1 - p / 100);
    if (right !== Math.round(right)) return null;
    var opts = build(num(right), [
      num(up ? base * (1 - p / 100) : base * (1 + p / 100)),   // не той бік
      num(base * p / 100),                                     // відповів самою зміною
      num(up ? base + p : base - p),                           // додав відсотки як число
      num(base)
    ]);
    if (!opts) return null;
    return {
      label: "Відсотки",
      text: "Ціну " + base + " грн " + (up ? "підвищили" : "знизили") + " на " + p +
            " %. Яка ціна тепер?",
      options: opts,
      answerTex: num(right),
      reveal: up ? "Нова ціна = " + base + " · 1," + (p < 10 ? "0" + p : p)
                 : "Нова ціна = " + base + " · (1 − 0," + (p < 10 ? "0" + p : p) + ")"
    };
  }

  function percBase() {
    var p = pick([4, 5, 8, 10, 20, 25, 40, 50]);
    var base = ri(2, 30) * 25;
    var part = base * p / 100;
    if (part !== Math.round(part)) return null;
    var opts = build(num(base), [
      num(part * p / 100),
      num(part * p),
      num(part / p),
      num(part + p)
    ]);
    if (!opts) return null;
    return {
      label: "Відсотки",
      text: p + " % числа дорівнює " + part + ". Знайди це число.",
      options: opts,
      answerTex: num(base),
      reveal: "Число = частина · 100 / відсотки = " + part + " · 100 / " + p + " = " + base
    };
  }

  function percDiff() {
    var a = ri(2, 20) * 10;
    var p = pick([10, 20, 25, 50, 100]);
    var b = a * (100 + p) / 100;
    if (b !== Math.round(b)) return null;
    var pc = function (v) { return num(v) + "\\,\\%"; };
    var opts = build(pc(p), [
      pc((b - a) / b * 100),     // поділив на нове значення
      pc(b / a * 100),           // узяв відношення, а не приріст
      pc(b - a),                 // назвав саму різницю
      pc(a / b * 100)
    ]);
    if (!opts) return null;
    return {
      label: "Відсотки",
      text: "Було " + a + ", стало " + b + ". На скільки відсотків зросло?",
      options: opts,
      answerTex: pc(p),
      reveal: "Приріст рахуємо від початкового: (" + b + " − " + a + ") / " + a + " · 100 %"
    };
  }

  /* ====================== ЛОГАРИФМИ І СТЕПЕНІ ====================== */

  function logValue() {
    var a = pick([2, 3, 5, 10]), k = ri(2, 5);
    var right = k;
    var opts = build(String(right), [
      String(Math.pow(a, k)),      // відповів самим числом
      String(k + 1),
      String(k - 1),
      String(a * k)
    ]);
    if (!opts) return null;
    return {
      label: "Логарифми",
      tex: "\\log_{" + a + "} " + Math.pow(a, k),
      text: "Чому дорівнює?",
      options: opts,
      answerTex: String(right),
      reveal: "Логарифм — це показник: " + a + "^" + k + " = " + Math.pow(a, k)
    };
  }

  function logSum() {
    var a = pick([2, 3, 5]), i = ri(1, 3), j = ri(1, 3);
    var x = Math.pow(a, i), y = Math.pow(a, j);
    var right = i + j;
    var opts = build(String(right), [
      String(i * j),               // помножив показники
      String(Math.abs(i - j)),     // відняв замість додати
      String(x * y),               // відповів добутком чисел
      String(i + j + 1)
    ]);
    if (!opts) return null;
    return {
      label: "Логарифми",
      tex: "\\log_{" + a + "} " + x + " + \\log_{" + a + "} " + y,
      text: "Обчисли.",
      options: opts,
      answerTex: String(right),
      reveal: "logₐx + logₐy = logₐ(xy) = log" + sub(a) + " " + (x * y)
    };
  }

  function powSimplify() {
    var base = pick(["a", "x", "b"]);
    var i = ri(2, 7), j = ri(2, 7);
    var kind = pick(["mul", "div", "pow"]);
    var right, tex, wrongs;
    if (kind === "mul") {
      tex = base + "^{" + i + "} \\cdot " + base + "^{" + j + "}";
      right = i + j; wrongs = [i * j, Math.abs(i - j), i + j + 1];
    } else if (kind === "div") {
      if (i === j) return null;
      tex = "\\frac{" + base + "^{" + i + "}}{" + base + "^{" + j + "}}";
      right = i - j; wrongs = [j - i, i + j, Math.round(i / j)];
    } else {
      tex = "\\left(" + base + "^{" + i + "}\\right)^{" + j + "}";
      right = i * j; wrongs = [i + j, Math.pow(i, j), i * j + 1];
    }
    var opts = build(base + "^{" + right + "}", wrongs.map(function (w) {
      return base + "^{" + w + "}";
    }));
    if (!opts) return null;
    return {
      label: "Степені",
      tex: tex,
      text: "Запиши одним степенем.",
      options: opts,
      answerTex: base + "^{" + right + "}",
      reveal: "Множення — показники додаються, ділення — віднімаються, степінь степеня — множаться."
    };
  }

  /* ====================== ТЕМИ ====================== */

  var TOPICS = [
    { id: "prog",  title: "Прогресії",            icon: "📈", gens: [arithNth, arithSum, geomNth, geomInf] },
    { id: "deriv", title: "Похідна",              icon: "📉", gens: [derivPoly, derivAt] },
    { id: "comb",  title: "Комбінаторика",        icon: "🎲", gens: [combChoose, combOrder, combPerm, probBall] },
    { id: "dom",   title: "Область визначення",   icon: "🧩", gens: [domain] },
    { id: "trig",  title: "Тригонометрія",        icon: "📐", gens: [trigValue, trigPyth] },
    { id: "perc",  title: "Відсотки",             icon: "💰", gens: [percOf, percChange, percBase, percDiff] },
    { id: "log",   title: "Логарифми і степені",  icon: "🔢", gens: [logValue, logSum, powSimplify] }
  ];

  // Складаємо задачу. Генератор може відмовитися (вийшло негарне число або
  // збіглися варіанти) — тоді просто пробуємо ще.
  function makeFrom(gens) {
    for (var i = 0; i < 60; i++) {
      var q = pick(gens)();
      if (q) { q.key = "p"; return q; }
    }
    return null;
  }

  window.MATH_PRACTICE = {
    topics: TOPICS,
    makeFrom: makeFrom,
    all: TOPICS.reduce(function (acc, t) { return acc.concat(t.gens); }, [])
  };
})();
