(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const track = root.querySelector("[data-carousel-track]");
  const dotsWrap = root.querySelector("[data-carousel-dots]");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  const progress = root.querySelector("[data-carousel-progress]");
  const shuffleBtn = document.querySelector("[data-reshuffle]");
  const countEl = document.querySelector("[data-quote-count]");

  const INTERVAL = 6000;
  const PICK = 7;
  let pool = [];
  let items = [];
  let index = 0;
  let timer = null;
  let progressRAF = null;
  let startedAt = 0;

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function pickSet() {
    if (!pool.length) return [];
    const n = Math.min(PICK, pool.length);
    return shuffle(pool).slice(0, n);
  }

  function renderSlides(set) {
    items = set;
    track.innerHTML = "";
    set.forEach((q, i) => {
      const div = document.createElement("div");
      div.className = "carousel-item" + (i === 0 ? " is-active" : "");
      div.setAttribute("data-carousel-item", "");
      div.innerHTML =
        '<blockquote><p></p></blockquote>';
      div.querySelector("p").textContent = q.text;
      track.appendChild(div);
    });
    index = 0;
    renderDots();
    if (countEl) countEl.textContent = String(pool.length);
  }

  function renderDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    items.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "dot";
      b.setAttribute("aria-label", "Афоризм " + (i + 1));
      if (i === index) b.setAttribute("aria-current", "true");
      b.addEventListener("click", () => go(i, true));
      dotsWrap.appendChild(b);
    });
  }

  function burst() {
    if (reduceMotion) return;
    const layer = root.querySelector("[data-spark]");
    if (!layer) return;
    for (let i = 0; i < 8; i++) {
      const s = document.createElement("span");
      s.className = "spark";
      const x = 20 + Math.random() * 60;
      const y = 20 + Math.random() * 50;
      s.style.left = x + "%";
      s.style.top = y + "%";
      s.style.setProperty("--dx", (Math.random() * 40 - 20) + "px");
      s.style.setProperty("--dy", (-20 - Math.random() * 40) + "px");
      layer.appendChild(s);
      setTimeout(() => s.remove(), 900);
    }
  }

  function go(next, user) {
    if (!items.length) return;
    const nodes = Array.from(track.querySelectorAll("[data-carousel-item]"));
    const prev = index;
    index = (next + items.length) % items.length;
    nodes.forEach((el, i) => {
      el.classList.remove("is-active", "is-leaving");
      if (i === index) el.classList.add("is-active");
      else if (i === prev && !reduceMotion && prev !== index) el.classList.add("is-leaving");
    });
    renderDots();
    root.classList.remove("flash");
    void root.offsetWidth;
    root.classList.add("flash");
    burst();
    if (user) restart();
    else resetProgress();
  }

  function resetProgress() {
    startedAt = performance.now();
    if (progressRAF) cancelAnimationFrame(progressRAF);
    if (reduceMotion || !progress) return;
    const tick = (now) => {
      const p = Math.min(1, (now - startedAt) / INTERVAL);
      progress.style.transform = "scaleX(" + p + ")";
      if (p < 1) progressRAF = requestAnimationFrame(tick);
    };
    progress.style.transform = "scaleX(0)";
    progressRAF = requestAnimationFrame(tick);
  }

  function restart() {
    if (timer) clearInterval(timer);
    resetProgress();
    if (!reduceMotion) {
      timer = setInterval(() => go(index + 1, false), INTERVAL);
    }
  }

  function reshuffle() {
    renderSlides(pickSet());
    root.classList.add("reshuffled");
    setTimeout(() => root.classList.remove("reshuffled"), 700);
    burst();
    restart();
  }

  if (prevBtn) prevBtn.addEventListener("click", () => go(index - 1, true));
  if (nextBtn) nextBtn.addEventListener("click", () => go(index + 1, true));
  if (shuffleBtn) shuffleBtn.addEventListener("click", reshuffle);

  document.addEventListener("keydown", (e) => {
    if (!root.matches(":hover, :focus-within") && document.activeElement !== document.body) {
      /* still allow arrows when page focused */
    }
    if (e.key === "ArrowLeft") go(index - 1, true);
    if (e.key === "ArrowRight") go(index + 1, true);
  });

  root.addEventListener("mouseenter", () => {
    if (timer) clearInterval(timer);
    if (progressRAF) cancelAnimationFrame(progressRAF);
  });
  root.addEventListener("mouseleave", restart);
  root.addEventListener("focusin", () => {
    if (timer) clearInterval(timer);
    if (progressRAF) cancelAnimationFrame(progressRAF);
  });
  root.addEventListener("focusout", (e) => {
    if (!root.contains(e.relatedTarget)) restart();
  });

  fetch("aphorisms.json", { cache: "no-store" })
    .then((r) => {
      if (!r.ok) throw new Error("aphorisms missing");
      return r.json();
    })
    .then((data) => {
      pool = Array.isArray(data) ? data.filter((x) => x && x.text) : [];
      if (!pool.length) throw new Error("empty pool");
      renderSlides(pickSet());
      restart();
    })
    .catch(() => {
      pool = [
        { text: "На самом деле жизнь проста, но мы настойчиво её усложняем." },
        { text: "Трудно идти по жизни несколькими путями одновременно." },
        { text: "Не делай зла — не будешь знать и страха." }
      ];
      renderSlides(pickSet());
      restart();
    });
})();

/* subtle cursor glow */
(function () {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.matchMedia("(pointer: coarse)").matches) return;
  const glow = document.createElement("div");
  glow.className = "cursor-glow";
  glow.setAttribute("aria-hidden", "true");
  document.body.appendChild(glow);
  let x = 0, y = 0, tx = 0, ty = 0;
  window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
  function loop() {
    x += (tx - x) * 0.12;
    y += (ty - y) * 0.12;
    glow.style.transform = "translate(" + (x - 120) + "px," + (y - 120) + "px)";
    requestAnimationFrame(loop);
  }
  loop();
})();
