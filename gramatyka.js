/* Граматика англійської: завдання з пропуском і чотирма варіантами —
   рівно той формат, що на НМТ (там 16 таких завдань із 32).

   Задачі складаються на ходу, тож не повторюються. Слова всередині речень
   підставляються з невеликих наборів, але сама конструкція й маркер часу
   лишаються незмінними — саме вони роблять правильною рівно одну відповідь.

   Головне правило відволікачів те саме, що в інших розділах: усі чотири
   варіанти одного роду. Якщо питають час дієслова, то й варіанти — форми
   того самого дієслова, а не випадкові слова.

   Назовні віддаємо window.ENG_GRAMATYKA. */

(function () {
  "use strict";

  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // Збирає питання. right — правильний варіант, wrong — три відволікачі.
  function make(label, text, right, wrong, reveal) {
    var seen = {}, opts = [{ text: right, correct: true }];
    seen[right] = 1;
    wrong.forEach(function (w) {
      if (opts.length >= 4 || !w || seen[w]) return;
      seen[w] = 1;
      opts.push({ text: w, correct: false });
    });
    if (opts.length !== 4) return null;
    return {
      key: "g",
      label: label,
      text: text,
      options: shuffle(opts),
      answerHtml: "<b>" + right + "</b>",
      reveal: reveal || ""
    };
  }

  /* ====================== ЧАСИ ====================== */

  function presentContinuous() {
    var c = pick([
      { v: "play", ing: "playing", p: "played", pp: "played", place: "in the garden" },
      { v: "run", ing: "running", p: "ran", pp: "run", place: "in the park" },
      { v: "swim", ing: "swimming", p: "swam", pp: "swum", place: "in the pool" },
      { v: "dance", ing: "dancing", p: "danced", pp: "danced", place: "in the hall" }
    ]);
    return make("Часи",
      "Look! The children ___ " + c.place + ".",
      "are " + c.ing,
      [c.v, c.p, "have " + c.pp],
      "«Look!» — дія відбувається просто зараз, це Present Continuous: am / is / are + -ing.");
  }

  function presentSimple() {
    var c = pick([
      { s: "My father", v: "drinks", base: "drink", ing: "drinking", p: "drank", pp: "drunk", o: "coffee every morning" },
      { s: "My sister", v: "gets", base: "get", ing: "getting", p: "got", pp: "got", o: "up at seven every day" },
      { s: "Our teacher", v: "gives", base: "give", ing: "giving", p: "gave", pp: "given", o: "us homework every week" }
    ]);
    return make("Часи",
      c.s + " ___ " + c.o + ".",
      c.v,
      ["is " + c.ing, c.p, "has " + c.pp],
      "«every morning / every day / every week» — звичайна, повторювана дія. Це Present Simple.");
  }

  function pastSimple() {
    var c = pick([
      { v: "go", p: "went", pp: "gone", ing: "going", o: "to the cinema", w: "last Saturday" },
      { v: "write", p: "wrote", pp: "written", ing: "writing", o: "a letter", w: "yesterday" },
      { v: "buy", p: "bought", pp: "bought", ing: "buying", o: "a new phone", w: "two days ago" }
    ]);
    return make("Часи",
      "We ___ " + c.o + " " + c.w + ".",
      c.p,
      [c.v, "have " + c.pp, "are " + c.ing],
      "«" + c.w + "» — конкретний момент у минулому. Це Past Simple.");
  }

  function presentPerfectAux() {
    var c = pick([
      { s: "They", aux: "have", o: "just arrived" },
      { s: "We", aux: "have", o: "already finished the work" },
      { s: "She", aux: "has", o: "just left the room" },
      { s: "He", aux: "has", o: "already read this book" }
    ]);
    var others = c.aux === "have" ? ["has", "are", "did"] : ["have", "is", "did"];
    return make("Часи",
      c.s + " ___ " + c.o + ".",
      c.aux, others,
      "«just / already» — ознака Present Perfect. Допоміжне: have для I / we / you / they, has для he / she / it.");
  }

  function pastPerfect() {
    var c = pick([
      { a: "When we arrived", b: "the film ___ already started" },
      { a: "When I came home", b: "my sister ___ already cooked dinner" },
      { a: "By the time he phoned", b: "we ___ already left" }
    ]);
    return make("Часи",
      c.a + ", " + c.b + ".",
      "had", ["has", "was", "did"],
      "Дві дії в минулому: та, що сталася раніше, стоїть у Past Perfect — had + третя форма.");
  }

  function futureSimple() {
    var c = pick([
      { s: "I think it", v: "rain", f: "will rain", p: "rained", s3: "rains", ing: "is raining", w: "tomorrow" },
      { s: "I think it", v: "snow", f: "will snow", p: "snowed", s3: "snows", ing: "is snowing", w: "tomorrow" },
      { s: "I'm sure she", v: "pass", f: "will pass", p: "passed", s3: "passes", ing: "is passing", w: "the exam next week" }
    ]);
    return make("Часи",
      c.s + " ___ " + c.w + ".",
      c.f, [c.s3, c.p, c.ing],
      "Припущення чи думка про майбутнє — will + інфінітив.");
  }

  /* ====================== АРТИКЛІ ====================== */

  function articleAn() {
    var c = pick(["engineer", "artist", "actor", "architect", "umbrella", "apple"]);
    return make("Артиклі",
      "My brother has " + (c === "umbrella" || c === "apple" ? "" : "become ") + "___ " + c + ".",
      "an", ["a", "the", "— (без артикля)"],
      "Перед голосним звуком ставимо an, а не a.");
  }

  function articleThe() {
    // якщо пропуск усередині речення, артикль пишеться з малої літери
    var c = pick([
      { s: "___ sun rises in the east.", r: "The", w: ["A", "An", "— (без артикля)"] },
      { s: "___ moon was very bright last night.", r: "The", w: ["A", "An", "— (без артикля)"] },
      { s: "There was not a single cloud in ___ sky.", r: "the", w: ["a", "an", "— (без артикля)"] },
      { s: "We watched ___ sunset from the balcony.", r: "the", w: ["a", "an", "— (без артикля)"] }
    ]);
    return make("Артиклі", c.s, c.r, c.w,
      "Перед єдиними у своєму роді предметами — the.");
  }

  function articleSecond() {
    var c = pick([
      { n: "book", a: "I bought a book yesterday.", b: "___ book was very interesting." },
      { n: "car", a: "They have a car.", b: "___ car is quite old." },
      { n: "dog", a: "We saw a dog in the street.", b: "___ dog was very friendly." }
    ]);
    return make("Артиклі", c.a + " " + c.b, "The", ["A", "An", "— (без артикля)"],
      "Перший раз — a, а коли мова про вже згаданий предмет — the.");
  }

  function articleNone() {
    var c = pick(["Everest", "Kyiv", "London", "Poland", "Africa"]);
    return make("Артиклі",
      "___ " + c + " is mentioned in this article.",
      "— (без артикля)", ["The", "A", "An"],
      "Перед назвами міст, країн і більшості гір артикль не ставиться.");
  }

  /* ====================== ПАСИВНИЙ СТАН ====================== */

  function passivePast() {
    var c = pick([
      { n: "This bridge", v3: "built", v: "build", year: "1995" },
      { n: "This castle", v3: "destroyed", v: "destroy", year: "1648" },
      { n: "Our school", v3: "opened", v: "open", year: "1970" }
    ]);
    return make("Пасивний стан",
      c.n + " ___ in " + c.year + ".",
      "was " + c.v3,
      [c.v3, "has " + c.v3, "is " + c.v3],
      "Дію виконали над предметом, і це сталося в минулому: was / were + третя форма.");
  }

  function passivePresent() {
    var c = pick([
      { s: "The letters", v3: "delivered", v: "deliver", w: "every morning", be: "are" },
      { s: "This room", v3: "cleaned", v: "clean", w: "every day", be: "is" },
      { s: "These cars", v3: "made", v: "make", w: "in Germany", be: "are" }
    ]);
    var wrongBe = c.be === "are" ? "were" : "was";
    return make("Пасивний стан",
      c.s + " ___ " + c.w + ".",
      c.be + " " + c.v3,
      [c.v, c.v3, wrongBe + " " + c.v3],
      "Регулярна дія над предметом — am / is / are + третя форма.");
  }

  /* ====================== УМОВНІ РЕЧЕННЯ ====================== */

  function conditional1() {
    var c = pick([
      { i: "rain", s: "rains", p: "rained", t: "we will stay at home" },
      { i: "snow", s: "snows", p: "snowed", t: "we will not go out" },
      { i: "be", s: "is", p: "was", t: "we will go to the park", word: "warm" }
    ]);
    var cond = c.word ? "If the weather ___ " + c.word : "If it ___";
    return make("Умовні речення",
      cond + " tomorrow, " + c.t + ".",
      c.s, ["will " + c.i, c.p, "would " + c.i],
      "Перший тип: у частині з if — теперішній час, хоч ідеться про майбутнє.");
  }

  function conditional2() {
    return make("Умовні речення",
      "If I ___ you, I would accept the offer.",
      "were", ["am", "will be", "would be"],
      "Другий тип, уявна ситуація. У сталому звороті «If I were you» завжди were.");
  }

  function conditional3() {
    var c = pick([
      { a: "If she had studied harder", s: "she", b: "the exam", v: "passed", f: "pass" },
      { a: "If we had left earlier", s: "we", b: "the train", v: "caught", f: "catch" },
      { a: "If they had asked me", s: "they", b: "the answer", v: "known", f: "know" }
    ]);
    return make("Умовні речення",
      c.a + ", " + c.s + " ___ " + c.b + ".",
      "would have " + c.v,
      ["would " + c.f, c.v, "will " + c.f],
      "Третій тип — про те, що вже не можна змінити: would have + третя форма.");
  }

  /* ====================== ГЕРУНДІЙ ТА ІНФІНІТИВ ====================== */

  var GER = [
    { s: "I enjoy ___ books in the evening.", ing: "reading", base: "read" },
    { s: "I avoid ___ late at night.", ing: "eating", base: "eat" },
    { s: "She finished ___ her homework an hour ago.", ing: "doing", base: "do" },
    { s: "I don't mind ___ for a few minutes.", ing: "waiting", base: "wait" },
    { s: "He suggested ___ a taxi.", ing: "taking", base: "take" },
    { s: "They kept ___ about the same thing.", ing: "talking", base: "talk" }
  ];
  var INF = [
    { s: "She decided ___ abroad.", base: "study", ing: "studying", p: "studied" },
    { s: "He promised ___ us with the project.", base: "help", ing: "helping", p: "helped" },
    { s: "They agreed ___ a bit earlier.", base: "come", ing: "coming", p: "came" },
    { s: "We hope ___ you again soon.", base: "see", ing: "seeing", p: "saw" },
    { s: "She refused ___ the door.", base: "open", ing: "opening", p: "opened" }
  ];

  function gerund() {
    var c = pick(GER);
    return make("Герундій та інфінітив", c.s,
      c.ing, ["to " + c.base, c.base, "to " + c.ing],
      "Після enjoy, avoid, finish, mind, suggest, keep іде форма на -ing.");
  }

  function infinitive() {
    var c = pick(INF);
    return make("Герундій та інфінітив", c.s,
      "to " + c.base, [c.ing, c.base, c.p],
      "Після decide, promise, agree, hope, refuse, want іде інфінітив з to.");
  }

  /* ====================== МОДАЛЬНІ ДІЄСЛОВА ====================== */

  function modalMust() {
    var c = pick([
      "You ___ wear a helmet when you ride a bike. It's the law.",
      "Drivers ___ stop at a red light. It's the law.",
      "Passengers ___ fasten their seat belts. It's the rule."
    ]);
    return make("Модальні дієслова", c, "must", ["can", "may", "might"],
      "Обов'язок, припис або закон — must.");
  }

  function modalRequest() {
    var c = pick([
      "___ you help me with this box, please?",
      "___ you open the window, please?",
      "___ you pass me the salt, please?"
    ]);
    return make("Модальні дієслова", c, "Could", ["Should", "Must", "Need"],
      "Увічливе прохання — Could you…?");
  }

  function modalAbility() {
    var c = pick([
      { o: "swim when I was five" },
      { o: "ride a bike when I was six" },
      { o: "read when I was four" }
    ]);
    return make("Модальні дієслова",
      "I ___ " + c.o + ".",
      "could", ["can", "must", "should"],
      "Уміння в минулому — could.");
  }

  /* ====================== ПРИЙМЕННИКИ ====================== */

  function prepPlace() {
    var c = pick([
      { s: "We arrived ___ the airport two hours early.", r: "at", w: ["in", "to", "on"] },
      { s: "She is waiting ___ the bus stop.", r: "at", w: ["in", "to", "on"] },
      { s: "The keys are ___ the table.", r: "on", w: ["in", "at", "to"] },
      { s: "My books are ___ the bag.", r: "in", w: ["on", "at", "to"] }
    ]);
    return make("Прийменники", c.s, c.r, c.w,
      "at — точка чи місце зустрічі, on — на поверхні, in — усередині.");
  }

  function prepTime() {
    var c = pick([
      { s: "She has been working here ___ 2019.", r: "since", w: ["for", "from", "during"] },
      { s: "He has lived in Lviv ___ five years.", r: "for", w: ["since", "from", "during"] },
      { s: "The meeting is ___ Monday.", r: "on", w: ["in", "at", "to"] },
      { s: "I was born ___ May.", r: "in", w: ["on", "at", "to"] },
      { s: "The lesson starts ___ nine o'clock.", r: "at", w: ["in", "on", "to"] }
    ]);
    return make("Прийменники", c.s, c.r, c.w,
      "since — від моменту, for — протягом; on — день, in — місяць, at — година.");
  }

  /* ====================== СТУПЕНІ ПОРІВНЯННЯ ====================== */

  function compShort() {
    var c = pick([
      { a: "big", r: "bigger", sup: "biggest" },
      { a: "old", r: "older", sup: "oldest" },
      { a: "small", r: "smaller", sup: "smallest" },
      { a: "warm", r: "warmer", sup: "warmest" }
    ]);
    return make("Ступені порівняння",
      "My room is ___ than yours.",
      c.r, ["more " + c.a, c.sup, "the " + c.sup],
      "Короткі прикметники: додаємо -er, а не more.");
  }

  function compLong() {
    var c = pick(["interesting", "beautiful", "difficult", "expensive"]);
    return make("Ступені порівняння",
      "This book is ___ " + c + " than that one.",
      "more", ["most", "the most", "much"],
      "Довгі прикметники: more + прикметник.");
  }

  function compSuper() {
    var c = pick([
      { s: "This is ___ film I have ever seen.", r: "the best", w: ["the better", "best", "more good"] },
      { s: "That was ___ day of my life.", r: "the worst", w: ["the worse", "worst", "more bad"] },
      { s: "She is ___ student in our class.", r: "the best", w: ["the better", "best", "more good"] }
    ]);
    return make("Ступені порівняння", c.s,
      c.r, c.w,
      "Найвищий ступінь від good — the best, від bad — the worst.");
  }

  /* ====================== ОБЧИСЛЮВАНІ Й НЕОБЧИСЛЮВАНІ ====================== */

  function muchMany() {
    var c = pick([
      { s: "How ___ sugar do you need?", r: "much", w: ["many", "few", "a few"] },
      { s: "How ___ water is there in the bottle?", r: "much", w: ["many", "few", "a few"] },
      { s: "There weren't ___ people at the concert.", r: "many", w: ["much", "a little", "little"] },
      { s: "He doesn't have ___ friends here.", r: "many", w: ["much", "a little", "little"] }
    ]);
    return make("Обчислювані й необчислювані", c.s, c.r, c.w,
      "many — з тим, що можна порахувати, much — з тим, що не можна.");
  }

  function fewLittle() {
    var c = pick([
      { s: "I have only ___ money left.", r: "a little", w: ["a few", "many", "few"] },
      { s: "She bought ___ apples at the market.", r: "a few", w: ["a little", "much", "little"] }
    ]);
    return make("Обчислювані й необчислювані", c.s, c.r, c.w,
      "a few — трохи з того, що рахується, a little — трохи з того, що не рахується.");
  }

  /* ====================== SOME / ANY / NO ====================== */

  function someAny() {
    var c = pick([
      { s: "Is there ___ milk in the fridge?", r: "any", w: ["some", "no", "a"] },
      { s: "Have you got ___ questions?", r: "any", w: ["some", "no", "a"] },
      { s: "Would you like ___ tea?", r: "some", w: ["any", "no", "a"] },
      { s: "There is ___ bread on the table.", r: "some", w: ["any", "no", "a"] }
    ]);
    return make("some / any / no", c.s, c.r, c.w,
      "У питаннях — any, у ствердженні — some, але в пропозиції («Would you like…?») теж some.");
  }

  function noneNo() {
    var c = pick([
      { s: "I have ___ idea what he means.", r: "no", w: ["any", "some", "none"] },
      { s: "There were ___ tickets left.", r: "no", w: ["any", "some", "none"] }
    ]);
    return make("some / any / no", c.s, c.r, c.w,
      "no стоїть перед іменником, none — замість нього.");
  }

  /* ====================== ТЕМИ ====================== */

  var TOPICS = [
    { id: "tenses", title: "Часи", icon: "⏳",
      gens: [presentContinuous, presentSimple, pastSimple, presentPerfectAux, pastPerfect, futureSimple] },
    { id: "art", title: "Артиклі", icon: "🔤",
      gens: [articleAn, articleThe, articleSecond, articleNone] },
    { id: "pass", title: "Пасивний стан", icon: "🔄",
      gens: [passivePast, passivePresent] },
    { id: "cond", title: "Умовні речення", icon: "🔀",
      gens: [conditional1, conditional2, conditional3] },
    { id: "ging", title: "Герундій та інфінітив", icon: "🔗",
      gens: [gerund, infinitive] },
    { id: "modal", title: "Модальні дієслова", icon: "🗝️",
      gens: [modalMust, modalRequest, modalAbility] },
    { id: "prep", title: "Прийменники", icon: "📍",
      gens: [prepPlace, prepTime] },
    { id: "comp", title: "Ступені порівняння", icon: "📊",
      gens: [compShort, compLong, compSuper] },
    { id: "count", title: "Обчислювані й необчислювані", icon: "🧮",
      gens: [muchMany, fewLittle] },
    { id: "some", title: "some / any / no", icon: "❓",
      gens: [someAny, noneNo] }
  ];

  function makeFrom(gens) {
    for (var i = 0; i < 60; i++) {
      var q = pick(gens)();
      if (q) return q;
    }
    return null;
  }

  window.ENG_GRAMATYKA = {
    topics: TOPICS,
    makeFrom: makeFrom,
    all: TOPICS.reduce(function (acc, t) { return acc.concat(t.gens); }, [])
  };
})();
