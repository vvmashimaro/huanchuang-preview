(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $$ = function (selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };

  requestAnimationFrame(function () {
    root.classList.add("is-ready");
  });

  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".progress");
  var heroMedia = document.querySelector(".hero-media");
  var timeline = document.querySelector(".timeline");
  var parallax = $$("[data-parallax]");
  var lastY = window.scrollY;
  var ticking = false;

  function onScroll() {
    var y = window.scrollY;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;

    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";

    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
      var hide = y > lastY && y > 480 && !header.classList.contains("menu-open");
      if (Math.abs(y - lastY) > 4) header.classList.toggle("is-hidden", hide);
    }
    lastY = y;

    if (!reduce) {
      if (heroMedia && y < vh * 1.2) {
        heroMedia.style.transform = "translate3d(0," + (y * 0.3).toFixed(1) + "px,0)";
      }
      parallax.forEach(function (img) {
        var box = img.parentElement.getBoundingClientRect();
        if (box.bottom < 0 || box.top > vh) return;
        var p = (box.top + box.height / 2 - vh / 2) / (vh / 2 + box.height / 2);
        var amount = parseFloat(img.getAttribute("data-parallax")) || 40;
        img.style.transform = "translate3d(0," + (-p * amount).toFixed(1) + "px,0)";
      });
    }

    if (timeline) {
      var box = timeline.getBoundingClientRect();
      var t = Math.min(1, Math.max(0, (vh * 0.62 - box.top) / box.height));
      timeline.style.setProperty("--progress", t.toFixed(3));
    }

    ticking = false;
  }

  window.addEventListener("scroll", function () {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(onScroll);
    }
  }, { passive: true });
  window.addEventListener("resize", onScroll);
  onScroll();

  var menuButton = document.querySelector(".menu-btn");
  var menu = document.getElementById("navigation");
  if (menuButton && menu && header) {
    var label = menuButton.querySelector(".menu-label");
    var setOpen = function (open) {
      menuButton.setAttribute("aria-expanded", open ? "true" : "false");
      menu.classList.toggle("open", open);
      header.classList.toggle("menu-open", open);
      header.classList.remove("is-hidden");
      document.body.classList.toggle("no-scroll", open);
      if (label) label.textContent = open ? menuButton.dataset.labelOpen : menuButton.dataset.labelClosed;
    };
    menuButton.addEventListener("click", function () {
      setOpen(menuButton.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
        setOpen(false);
        menuButton.focus();
      }
    });
    menu.addEventListener("click", function (event) {
      if (event.target.closest("a")) setOpen(false);
    });
    window.matchMedia("(min-width: 861px)").addEventListener("change", function (event) {
      if (event.matches) setOpen(false);
    });
  }

  $$("[data-stagger]").forEach(function (group) {
    Array.prototype.forEach.call(group.children, function (child, index) {
      child.style.setProperty("--i", index);
    });
  });

  function countUp(el) {
    var to = Number(el.dataset.count);
    var from = Number(el.dataset.from || 0);
    if (reduce) {
      el.textContent = to;
      return;
    }
    var start = null;
    var step = function (now) {
      if (start === null) start = now;
      var p = Math.min(1, (now - start) / 1800);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 4)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  var targets = $$(".reveal, [data-stagger], .tl-item, .map-anim, [data-count]");
  // A fully clipped element never reports an intersection, so watch its parent instead.
  var clipped = $$(".img-reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    targets.concat(clipped).forEach(function (el) { el.classList.add("is-in"); });
  } else {
    $$("[data-count]").forEach(function (el) { el.textContent = el.dataset.from || 0; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        el.classList.add("is-in");
        if (el.hasAttribute("data-count")) countUp(el);
        io.unobserve(el);
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.12 });
    targets.forEach(function (el) { io.observe(el); });
    var imgIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.__reveal.forEach(function (item) { item.classList.add("is-in"); });
        imgIo.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0 });
    clipped.forEach(function (el) {
      var host = el.parentElement;
      (host.__reveal = host.__reveal || []).push(el);
      imgIo.observe(host);
    });
  }

  $$("[data-gallery]").forEach(function (block) {
    var track = block.querySelector(".gallery");
    if (!track) return;
    $$("[data-dir]", block).forEach(function (button) {
      button.addEventListener("click", function () {
        track.scrollBy({
          left: Number(button.dataset.dir) * track.clientWidth * 0.75,
          behavior: reduce ? "auto" : "smooth"
        });
      });
    });
    var dragging = false;
    var startX = 0;
    var startLeft = 0;
    track.addEventListener("pointerdown", function (event) {
      if (event.pointerType !== "mouse") return;
      dragging = true;
      startX = event.clientX;
      startLeft = track.scrollLeft;
      track.classList.add("is-drag");
    });
    window.addEventListener("pointermove", function (event) {
      if (dragging) track.scrollLeft = startLeft - (event.clientX - startX);
    });
    window.addEventListener("pointerup", function () {
      dragging = false;
      track.classList.remove("is-drag");
    });
  });

  var spyLinks = $$(".subnav a");
  if (spyLinks.length && "IntersectionObserver" in window) {
    var byId = {};
    spyLinks.forEach(function (link) { byId[link.hash.slice(1)] = link; });
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        spyLinks.forEach(function (link) { link.classList.remove("is-active"); });
        var active = byId[entry.target.id];
        if (!active) return;
        active.classList.add("is-active");
        var bar = active.parentElement;
        if (bar.scrollWidth > bar.clientWidth) {
          var offset = active.getBoundingClientRect().left - bar.getBoundingClientRect().left;
          bar.scrollTo({ left: bar.scrollLeft + offset - 20, behavior: reduce ? "auto" : "smooth" });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(byId).forEach(function (id) {
      var section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  $$(".faq details").forEach(function (item) {
    var summary = item.querySelector("summary");
    var body = item.querySelector(".faq-body");
    if (!summary || !body || reduce || !body.animate) return;
    var easing = "cubic-bezier(0.2, 0.7, 0.1, 1)";
    summary.addEventListener("click", function (event) {
      event.preventDefault();
      if (item.open) {
        body.animate(
          [{ height: body.scrollHeight + "px", opacity: 1 }, { height: "0px", opacity: 0 }],
          { duration: 380, easing: easing }
        ).onfinish = function () { item.open = false; };
      } else {
        item.open = true;
        body.animate(
          [{ height: "0px", opacity: 0 }, { height: body.scrollHeight + "px", opacity: 1 }],
          { duration: 520, easing: easing }
        );
      }
    });
  });

  var video = document.querySelector(".hero video");
  if (video) {
    if (reduce) {
      video.removeAttribute("autoplay");
      video.pause();
    } else {
      var playing = video.play();
      if (playing && playing.catch) playing.catch(function () {});
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) video.play().catch(function () {});
            else video.pause();
          });
        }).observe(video);
      }
    }
  }

  if (reduce) {
    $$("svg.map").forEach(function (svg) {
      if (svg.pauseAnimations) svg.pauseAnimations();
    });
  }

  $$("[data-top]").forEach(function (button) {
    button.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  });

  if (!reduce) {
    document.addEventListener("click", function (event) {
      var link = event.target.closest("a");
      if (!link || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (link.target === "_blank" || link.hasAttribute("download")) return;
      var url = new URL(link.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.hash) return;
      if (!/(\.html|\/)$/.test(url.pathname)) return;
      event.preventDefault();
      document.body.classList.add("is-leaving");
      setTimeout(function () { location.href = link.href; }, 260);
    });
    window.addEventListener("pageshow", function (event) {
      if (event.persisted) document.body.classList.remove("is-leaving");
    });
  }
})();
