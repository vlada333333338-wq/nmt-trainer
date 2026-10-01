/* Показ математичних формул.
   Готові бібліотеки (KaTeX, MathJax) тягнуть за собою десятки файлів шрифтів
   із чужого сервера. У Telegram на слабкому інтернеті це означає порожні
   екрани, а ще їхні шрифти не містять кирилиці. Тому формули малюємо самі:
   дрібний розбір запису TeX і звичайний HTML зі стилями.

   Підтримано рівно той набір команд, який використовується в даних — список
   нижче. Якщо колись додасться щось нове, воно не зникне: невідома команда
   показується як є, щоб помилку було видно одразу.

   Назовні: window.TeX.render(рядок) → HTML, window.TeX.fill(елемент). */

(function () {
  "use strict";

  var SYMBOLS = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", varphi: "φ", lambda: "λ",
    pi: "π", infty: "∞",
    cdot: "·", times: "×", pm: "±", mp: "∓",
    le: "≤", ge: "≥", ne: "≠", approx: "≈",
    ldots: "…", dots: "…", angle: "∠", circ: "°", percent: "%", "%": "%",
    in: "∈", to: "→", Rightarrow: "⇒"
  };

  // пробіли різної ширини
  var SPACES = { ",": "0.17em", ";": "0.28em", " ": "0.28em", ":": "0.22em", quad: "1em", qquad: "2em" };

  // назви функцій пишуться прямим шрифтом, а не курсивом
  var OPS = ["sin", "cos", "tg", "ctg", "tan", "cot", "sec", "cosec",
             "arcsin", "arccos", "arctg", "arcctg",
             "ln", "lg", "log", "exp", "max", "min", "deg", "mod"];

  function esc(s) {
    return String(s).replace(/[&<>]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c];
    });
  }

  /* ---------- розбір на лексеми ---------- */

  function tokenize(src) {
    var out = [], i = 0;
    while (i < src.length) {
      var c = src.charAt(i);
      if (c === "\\") {
        var m = /^\\([a-zA-Z]+|[^a-zA-Z])/.exec(src.slice(i));
        if (!m) { i++; continue; }
        out.push({ t: "cmd", v: m[1] });
        i += m[0].length;
      } else if ("{}[]^_".indexOf(c) >= 0) {
        out.push({ t: c });
        i++;
      } else if (c === " ") {
        out.push({ t: "sp" });
        i++;
      } else {
        out.push({ t: "ch", v: c });
        i++;
      }
    }
    return out;
  }

  /* ---------- побудова HTML ---------- */

  function Reader(tokens) { this.k = tokens; this.i = 0; }
  Reader.prototype.peek = function () { return this.k[this.i]; };
  Reader.prototype.next = function () { return this.k[this.i++]; };

  var unknown = [];

  // Читає один аргумент: групу в дужках або один символ
  function arg(r) {
    var tk = r.peek();
    if (!tk) return "";
    if (tk.t === "{") { r.next(); return body(r, "}"); }
    return atom(r);
  }

  function optArg(r) {
    if (r.peek() && r.peek().t === "[") { r.next(); return body(r, "]"); }
    return null;
  }

  // Один «атом»: символ, команда або група
  function atom(r) {
    var tk = r.next();
    if (!tk) return "";

    if (tk.t === "{") return '<span class="tx-g">' + body(r, "}") + "</span>";
    if (tk.t === "sp") return " ";
    if (tk.t === "ch") {
      var c = tk.v;
      if (/[a-zA-Z]/.test(c)) return '<i class="tx-v">' + c + "</i>";
      if (c === "-") return '<span class="tx-op">−</span>';
      if (c === "+" || c === "=" || c === "<" || c === ">") return '<span class="tx-op">' + esc(c) + "</span>";
      if (c === ",") return ",";
      return esc(c);
    }
    if (tk.t === "cmd") return command(r, tk.v);
    return esc(tk.t);
  }

  function command(r, name) {
    if (name === "frac" || name === "dfrac" || name === "tfrac") {
      var n = arg(r), d = arg(r);
      return '<span class="tx-fr"><span class="tx-n">' + n +
             '</span><span class="tx-d">' + d + "</span></span>";
    }
    if (name === "sqrt") {
      var idx = optArg(r), b = arg(r);
      return '<span class="tx-sq">' +
             (idx ? '<span class="tx-idx">' + idx + "</span>" : "") +
             '<span class="tx-rad">√</span><span class="tx-sqb">' + b + "</span></span>";
    }
    if (name === "left" || name === "right") {
      var d2 = r.next();
      var ch = d2 ? (d2.t === "ch" ? d2.v : d2.t === "cmd" ? (SYMBOLS[d2.v] || "") : d2.t) : "";
      if (ch === ".") return "";
      return '<span class="tx-dl">' + esc(ch) + "</span>";
    }
    if (name === "operatorname" || name === "mathrm" || name === "text") {
      return '<span class="tx-tt">' + arg(r) + "</span>";
    }
    if (name === "bar" || name === "overline") {
      return '<span class="tx-bar">' + arg(r) + "</span>";
    }
    if (name === "vec") {
      return '<span class="tx-vec">' + arg(r) + "</span>";
    }
    if (OPS.indexOf(name) >= 0) {
      return '<span class="tx-tt">' + name + "</span>";
    }
    if (SPACES[name] !== undefined) {
      return '<span class="tx-sp" style="width:' + SPACES[name] + '"></span>';
    }
    if (SYMBOLS[name] !== undefined) {
      return '<span class="tx-sym">' + SYMBOLS[name] + "</span>";
    }
    if (unknown.indexOf(name) < 0) unknown.push(name);
    return '<span class="tx-bad">\\' + esc(name) + "</span>";
  }

  // Послідовність атомів до закривної дужки (або до кінця)
  function body(r, stop) {
    var out = "";
    while (r.peek()) {
      var tk = r.peek();
      if (stop && tk.t === stop) { r.next(); break; }
      if (tk.t === "}" || tk.t === "]") { r.next(); continue; }   // зайва дужка

      if (tk.t === "^" || tk.t === "_") {
        r.next();
        var raised = arg(r);
        // градус пишемо просто як °, щоб не задирало його надто високо
        if (tk.t === "^" && /^<span class="tx-sym">°<\/span>$/.test(raised)) {
          out += '<span class="tx-sym">°</span>';
        } else {
          out += (tk.t === "^" ? '<sup class="tx-up">' : '<sub class="tx-lo">') +
                 raised + (tk.t === "^" ? "</sup>" : "</sub>");
        }
        continue;
      }
      out += atom(r);
    }
    return out;
  }

  function render(src) {
    if (src === null || src === undefined) return "";
    try {
      var r = new Reader(tokenize(String(src)));
      return '<span class="tx">' + body(r, null) + "</span>";
    } catch (e) {
      return '<span class="tx tx-bad">' + esc(src) + "</span>";
    }
  }

  // Заповнює всі елементи з data-tex усередині кореня
  function fill(root) {
    (root || document).querySelectorAll("[data-tex]").forEach(function (el) {
      el.innerHTML = render(el.getAttribute("data-tex"));
      el.removeAttribute("data-tex");
    });
  }

  window.TeX = { render: render, fill: fill, unknown: unknown };
})();
