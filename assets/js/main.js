/* =========================================================
   学术个人主页 · 交互脚本
   ========================================================= */
(function () {
  'use strict';

  var root = document.documentElement;
  root.classList.add('js');

  /* ---------- 1. 移动端导航 ---------- */
  var header = document.getElementById('siteHeader');
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.querySelectorAll('.nav a');

  if (navToggle && header) {
    navToggle.addEventListener('click', function () {
      var open = header.classList.toggle('nav-open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      navToggle.setAttribute('aria-label', open ? '收起导航' : '展开导航');
    });

    navLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        header.classList.remove('nav-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 2. 滚动状态与导航高亮 ---------- */
  var onScroll = function () {
    if (header) {
      header.classList.toggle('is-stuck', window.scrollY > 8);
    }
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  var sections = Array.prototype.slice
    .call(document.querySelectorAll('main section[id]'))
    .filter(function (el) { return el.id !== 'top'; });

  var linkMap = {};
  navLinks.forEach(function (link) {
    var id = (link.getAttribute('href') || '').replace('#', '');
    if (id) { linkMap[id] = link; }
  });

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = linkMap[entry.target.id];
        if (!link || !entry.isIntersecting) { return; }
        navLinks.forEach(function (l) { l.classList.remove('is-current'); });
        link.classList.add('is-current');
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (section) { spy.observe(section); });
  }

  /* ---------- 3. 滚动淡入 ---------- */
  var revealItems = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    var revealer = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealItems.forEach(function (item, index) {
      item.style.transitionDelay = Math.min(index % 6, 5) * 60 + 'ms';
      revealer.observe(item);
    });
  } else {
    revealItems.forEach(function (item) { item.classList.add('is-visible'); });
  }

  /* ---------- 4. 成果筛选 ---------- */
  var filterButtons = document.querySelectorAll('.filter-btn');
  var pubs = document.querySelectorAll('.pub');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');

      filterButtons.forEach(function (b) { b.classList.remove('is-active'); });
      btn.classList.add('is-active');

      pubs.forEach(function (pub) {
        var match = filter === 'all' || pub.getAttribute('data-type') === filter;
        pub.classList.toggle('is-hidden', !match);
        if (match) { pub.classList.add('is-visible'); }
      });
    });
  });

  /* ---------- 5. 数字滚动 ---------- */
  var counters = document.querySelectorAll('.stat-num');

  var animateCount = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10);
    if (!target || isNaN(target)) { return; }

    var duration = 1200;
    var start = null;

    var step = function (timestamp) {
      if (start === null) { start = timestamp; }
      var progress = Math.min((timestamp - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.round(target * eased);
      el.textContent = value.toLocaleString('en-US');
      if (progress < 1) { window.requestAnimationFrame(step); }
    };

    window.requestAnimationFrame(step);
  };

  if ('IntersectionObserver' in window && counters.length) {
    var countObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) { return; }
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.6 });

    counters.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------- 6. 页脚年份 ---------- */
  var yearEl = document.getElementById('year');
  if (yearEl) { yearEl.textContent = new Date().getFullYear(); }
})();
