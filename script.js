(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const root = document.documentElement;
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(pointer: fine)").matches;
  const clamp = (v, a = 0, b = 1) => Math.min(Math.max(v, a), b);

  /* ---------- Theme ---------- */
  $("#themeToggle").addEventListener("click", () => {
    const next = root.dataset.theme === "light" ? "dark" : "light";
    root.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch {}
  });

  /* ---------- Split hero name into letters ---------- */
  let charIndex = 0;
  $$(".hero__title .word").forEach(word => {
    const text = word.textContent;
    word.textContent = "";
    [...text].forEach((ch, i) => {
      const span = document.createElement("span");
      span.className = "char";
      span.textContent = ch;
      span.style.setProperty("--i", charIndex++);
      span.style.setProperty("--p", `${Math.round((i / Math.max(text.length - 1, 1)) * 100)}%`);
      word.appendChild(span);
    });
    word.classList.add("is-split");
    word.setAttribute("aria-label", text);
  });

  /* ---------- Split about text into words for scroll-lit effect ---------- */
  const litText = $("#litText");
  litText.innerHTML = litText.textContent.trim().split(/\s+/).map(w => `<span class="w">${w}</span>`).join(" ");
  const litWords = $$(".w", litText);

  /* ---------- Smooth scroll (Lenis, falls back to native) ---------- */
  let lenis = null;
  if (window.Lenis && !reduceMotion) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 1, smoothWheel: true });
    lenis.stop();
  }
  document.addEventListener("click", e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const target = $(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    if (lenis) lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    else target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------- Preloader ---------- */
  document.body.classList.add("is-loading");
  const finishLoading = () => {
    $("#loader").classList.add("is-done");
    document.body.classList.remove("is-loading");
    document.body.classList.add("is-ready");
    if (lenis) lenis.start();
    startTyping();
  };
  window.addEventListener("load", () => setTimeout(finishLoading, reduceMotion ? 0 : 1200));

  /* ---------- Typed role ---------- */
  const roles = ["SAP CPQ & Vendavo", "Quote-to-Cash Expert", "Legacy Modernisation", "Enterprise Integrations"];
  const typedEl = $("#typed");
  let typingStarted = false;
  function startTyping() {
    if (typingStarted) return;
    typingStarted = true;
    if (reduceMotion) { typedEl.textContent = roles[0]; return; }
    let r = 0, i = 0, deleting = false;
    const tick = () => {
      const word = roles[r];
      i += deleting ? -1 : 1;
      typedEl.textContent = word.slice(0, i);
      let delay = deleting ? 40 : 80;
      if (!deleting && i === word.length) { deleting = true; delay = 1800; }
      else if (deleting && i === 0) { deleting = false; r = (r + 1) % roles.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 900);
  }

  /* ---------- Mobile menu ---------- */
  const nav = $("#nav");
  const menuBtn = $("#menuBtn");
  const setMenu = open => {
    nav.classList.toggle("is-open", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $$(".nav__link").forEach(a => a.addEventListener("click", () => setMenu(false)));
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  /* ---------- Active nav link ---------- */
  const links = $$(".nav__link");
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      links.forEach(l => l.classList.toggle("is-active", l.getAttribute("href") === `#${e.target.id}`));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach(s => sectionObserver.observe(s));

  /* ---------- Scroll reveal ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObserver.unobserve(e.target);
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
  $$(".reveal").forEach(el => {
    if (el.dataset.delay) el.style.setProperty("--d", `${el.dataset.delay}ms`);
    revealObserver.observe(el);
  });

  /* ---------- Animated counters ---------- */
  const countObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const target = +el.dataset.count;
      const start = performance.now();
      const dur = reduceMotion ? 1 : 1600;
      const step = now => {
        const t = Math.min((now - start) / dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1 - t, 4)));
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObserver.unobserve(el);
    });
  }, { threshold: 0.6 });
  $$("[data-count]").forEach(el => countObserver.observe(el));

  /* ---------- Scroll-linked effects ---------- */
  const header = $("#header");
  const progress = $("#scrollProgress");
  const heroText = $("#heroText");
  const heroPhoto = $("#heroPhoto");
  const timeline = $("#timeline");
  const fill = $("#timelineFill");
  const head = $("#timelineHead");
  const items = $$(".tl", timeline);
  const blobs = $$(".blob");
  const stacked = matchMedia("(max-width: 880px)");
  let lastY = 0;

  function onScroll() {
    const y = scrollY;
    const vh = innerHeight;

    header.classList.toggle("is-scrolled", y > 20);
    header.classList.toggle("is-hidden", y > lastY && y > 400 && !nav.classList.contains("is-open"));
    lastY = y;
    const max = root.scrollHeight - vh;
    progress.style.transform = `scaleX(${max > 0 ? y / max : 0})`;

    if (!reduceMotion) {
      blobs[0].style.translate = `0 ${y * -0.12}px`;
      blobs[1].style.translate = `0 ${y * -0.06}px`;
    }

    // hero parallax: text drifts and fades, photo lags behind
    // (on stacked layouts both move together so the photo never overlaps the text)
    if (!reduceMotion && y < vh * 1.2) {
      const textSpeed = stacked.matches ? 0.1 : 0.18;
      const photoSpeed = stacked.matches ? 0.1 : 0.32;
      heroText.style.transform = `translate3d(0, ${y * textSpeed}px, 0)`;
      heroText.style.opacity = 1 - clamp(y / (vh * 0.8));
      heroPhoto.style.transform = `translate3d(0, ${y * photoSpeed}px, 0) scale(${1 - clamp(y / vh) * 0.08})`;
    }

    // about text lights up word by word
    if (!reduceMotion) {
      const r = litText.getBoundingClientRect();
      const p = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const lit = p * litWords.length;
      litWords.forEach((w, i) => { w.style.opacity = 0.16 + 0.84 * clamp(lit - i); });
    }

    // timeline draws itself with a glowing head
    const tr = timeline.getBoundingClientRect();
    const mid = vh * 0.6;
    const pct = clamp((mid - tr.top) / tr.height);
    fill.style.transform = `scaleY(${pct})`;
    head.style.top = `${pct * 100}%`;
    head.style.opacity = pct > 0 && pct < 1 ? 1 : 0;
    items.forEach(it => it.classList.toggle("is-lit", it.getBoundingClientRect().top < mid));
  }

  // run scroll work at most once per frame
  let ticking = false;
  const requestScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; onScroll(); });
  };
  addEventListener("scroll", requestScroll, { passive: true });
  addEventListener("resize", requestScroll);
  onScroll();

  /* ---------- Pointer effects (desktop only) ---------- */
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, active: false };
  if (finePointer && !reduceMotion) {
    const glow = $("#cursorGlow");
    const dot = $("#cursorDot");
    const ring = $("#cursorRing");
    const g = { x: pointer.x, y: pointer.y };
    const rg = { x: pointer.x, y: pointer.y };

    addEventListener("pointermove", e => {
      pointer.x = e.clientX; pointer.y = e.clientY;
      if (!pointer.active) { pointer.active = true; document.body.classList.add("has-cursor"); glow.style.opacity = 1; }
    });
    document.addEventListener("pointerleave", () => { document.body.classList.remove("has-cursor"); pointer.active = false; });
    addEventListener("pointerdown", () => ring.classList.add("is-down"));
    addEventListener("pointerup", () => ring.classList.remove("is-down"));
    document.addEventListener("pointerover", e => {
      ring.classList.toggle("is-hover", !!e.target.closest("a, button, .card, .cred, .tl__body, .industry"));
    });

    // spotlight on cards
    $$(".spotlight").forEach(card => card.addEventListener("pointermove", e => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    }));

    // magnetic buttons
    $$(".magnetic").forEach(btn => {
      btn.addEventListener("pointermove", e => {
        const r = btn.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        btn.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
      });
      btn.addEventListener("pointerleave", () => { btn.style.transform = ""; });
    });

    // 3D tilt on portrait
    const portrait = $("#portrait");
    portrait.addEventListener("pointermove", e => {
      const r = portrait.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      portrait.style.transform = `perspective(900px) rotateY(${px * 12}deg) rotateX(${-py * 12}deg)`;
    });
    portrait.addEventListener("pointerleave", () => { portrait.style.transform = ""; });

    // one frame loop for glow + cursor easing
    const frame = () => {
      g.x += (pointer.x - g.x) * 0.1; g.y += (pointer.y - g.y) * 0.1;
      rg.x += (pointer.x - rg.x) * 0.2; rg.y += (pointer.y - rg.y) * 0.2;
      glow.style.transform = `translate(${g.x - 260}px, ${g.y - 260}px)`;
      dot.style.transform = `translate(${pointer.x}px, ${pointer.y}px)`;
      ring.style.transform = `translate(${rg.x}px, ${rg.y}px)`;
    };
    const raf = t => { if (lenis) lenis.raf(t); frame(); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  } else if (lenis) {
    const raf = t => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
  }

  $("#year").textContent = new Date().getFullYear();
})();
