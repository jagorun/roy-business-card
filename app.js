(function () {
  const root = document.querySelector("[data-carousel]");
  if (!root) return;

  const items = Array.from(root.querySelectorAll("[data-carousel-item]"));
  const dotsWrap = root.querySelector("[data-carousel-dots]");
  const prevBtn = root.querySelector("[data-carousel-prev]");
  const nextBtn = root.querySelector("[data-carousel-next]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let index = 0;
  let timer = null;
  const INTERVAL = 5500;

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

  function go(next, user) {
    if (!items.length) return;
    const prev = index;
    index = (next + items.length) % items.length;
    items.forEach((el, i) => {
      el.classList.remove("is-active", "is-leaving");
      if (i === index) el.classList.add("is-active");
      else if (i === prev && !reduceMotion && prev !== index) el.classList.add("is-leaving");
    });
    renderDots();
    if (user) restart();
  }

  function next() { go(index + 1, false); }
  function prev() { go(index - 1, true); }

  function restart() {
    if (timer) clearInterval(timer);
    if (!reduceMotion) timer = setInterval(next, INTERVAL);
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", () => go(index + 1, true));

  root.addEventListener("mouseenter", () => { if (timer) clearInterval(timer); });
  root.addEventListener("mouseleave", restart);
  root.addEventListener("focusin", () => { if (timer) clearInterval(timer); });
  root.addEventListener("focusout", restart);

  go(0, false);
  restart();
})();
