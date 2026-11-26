/* =========================================================
   EESMIL — 电化学储能材料与界面实验室交互脚本
   1. 顶部导航状态 / 移动端菜单
   2. 滚动定位高亮
   3. 进场动画
   4. 数字滚动
   5. 论文与成员筛选
   6. 回到顶部
   ========================================================= */
(function () {
  'use strict';

  var header = document.getElementById('siteHeader');
  var nav = document.getElementById('nav');
  var navToggle = document.getElementById('navToggle');
  var toTop = document.getElementById('toTop');
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isEnglish = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;

  /* ---------------- 1. 顶部导航 ---------------- */
  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (toTop) toTop.classList.toggle('is-visible', y > 640);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', isEnglish ? 'Open menu' : '打开菜单');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open
        ? (isEnglish ? 'Close menu' : '关闭菜单')
        : (isEnglish ? 'Open menu' : '打开菜单'));
    });

    // 点击导航项或页面其他区域时收起菜单
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeNav();
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeNav();
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 860) closeNav();
    });
  }

  /* ---------------- 2. 当前页面导航高亮 ---------------- */
  // 多页结构下高亮由各页面的 aria-current 静态指定，这里仅兜底：
  // 若链接与当前文件名一致，则自动激活。
  var currentFile = window.location.pathname.split('/').pop() || 'index.html';
  navLinks.forEach(function (link) {
    var href = link.getAttribute('href') || '';
    if (href === currentFile) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    }
  });

  /* ---------------- 3. 进场动画 ---------------- */
  var revealItems = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));

  if (prefersReduced || !('IntersectionObserver' in window)) {
    revealItems.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          // 同组元素依次淡入，制造轻微错落感
          var siblings = el.parentElement
            ? Array.prototype.filter.call(el.parentElement.children, function (child) {
                return child.hasAttribute('data-reveal');
              })
            : [];
          var index = Math.max(0, siblings.indexOf(el));
          el.style.transitionDelay = Math.min(index, 5) * 70 + 'ms';
          el.classList.add('is-visible');
          revealObserver.unobserve(el);
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
    );
    revealItems.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------- 4. 数字滚动 ---------------- */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));

  function animateCount(el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (prefersReduced) {
      el.textContent = target;
      return;
    }
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * eased);
      if (progress < 1) window.requestAnimationFrame(step);
    }
    window.requestAnimationFrame(step);
  }

  if (counters.length && 'IntersectionObserver' in window) {
    var countObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          countObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach(function (el) { countObserver.observe(el); });
  } else {
    counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
  }

  /* ---------------- 5. 筛选（论文 / 成员） ---------------- */
  function initFilter(groupSelector, itemSelector, countElId, unit) {
    var group = document.querySelector(groupSelector);
    if (!group) return;
    var items = Array.prototype.slice.call(document.querySelectorAll(itemSelector));
    var countEl = countElId ? document.getElementById(countElId) : null;

    function updateCount(visible) {
      if (!countEl) return;
      countEl.textContent = isEnglish
        ? visible + (visible === 1 ? ' paper' : ' papers')
        : '共 ' + visible + ' 条' + (unit || '');
    }

    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn || !group.contains(btn)) return;

      var filter = btn.getAttribute('data-filter');
      Array.prototype.forEach.call(group.querySelectorAll('.chip'), function (chip) {
        chip.classList.toggle('is-active', chip === btn);
      });

      var visible = 0;
      items.forEach(function (item) {
        var key = item.getAttribute('data-year') || item.getAttribute('data-role') || '';
        var match = filter === 'all' || key === filter;
        item.classList.toggle('is-hidden', !match);
        if (match) visible += 1;
      });
      updateCount(visible);
    });

    updateCount(items.length);
  }

  initFilter('[data-filter-group="papers"]', '.paper-item', 'paperCount', '');

  // 年份筛选时同步隐藏亮点论文卡，并让计数包含特稿
  var featuredPaper = document.querySelector('.featured-paper');
  var paperFilterBar = document.querySelector('[data-filter-group="papers"]');
  if (featuredPaper && paperFilterBar) {
    var paperHint = document.getElementById('paperCount');

    function syncPaperCount(filter) {
      if (!paperHint) return;
      var visible = document.querySelectorAll('.paper-item:not(.is-hidden)').length;
      if (filter === 'all' || filter === featuredPaper.getAttribute('data-year')) visible += 1;
      paperHint.textContent = isEnglish
        ? visible + (visible === 1 ? ' paper' : ' papers')
        : '共 ' + visible + ' 条';
    }

    syncPaperCount('all');

    paperFilterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.chip');
      if (!btn) return;
      var filter = btn.getAttribute('data-filter');
      var featuredYear = featuredPaper.getAttribute('data-year');
      featuredPaper.classList.toggle('is-hidden', filter !== 'all' && filter !== featuredYear);
      syncPaperCount(filter);
    });
  }

  // 成员筛选：计数提示用筛选栏内的 hint（若存在）
  var teamGrid = document.getElementById('teamGrid');
  if (teamGrid) {
    var teamHint = document.createElement('span');
    teamHint.className = 'filter-hint';
    var teamBar = document.querySelector('[data-filter-group="team"]');
    if (teamBar && teamBar.parentElement) teamBar.parentElement.appendChild(teamHint);

    var teamItems = Array.prototype.slice.call(teamGrid.querySelectorAll('.member-card'));
    function teamCount() {
      var visible = teamItems.filter(function (item) {
        return !item.classList.contains('is-hidden');
      }).length;
      teamHint.textContent = isEnglish
        ? visible + (visible === 1 ? ' member' : ' members')
        : '共 ' + visible + ' 位';
    }
    if (teamBar) {
      teamBar.addEventListener('click', function (e) {
        var btn = e.target.closest('.chip');
        if (!btn) return;
        var filter = btn.getAttribute('data-filter');
        Array.prototype.forEach.call(teamBar.querySelectorAll('.chip'), function (chip) {
          chip.classList.toggle('is-active', chip === btn);
        });
        teamItems.forEach(function (item) {
          var match = filter === 'all' || item.getAttribute('data-role') === filter;
          item.classList.toggle('is-hidden', !match);
        });
        teamCount();
      });
    }
    teamCount();
  }

  /* ---------------- 6. 回到顶部 ---------------- */
  if (toTop) {
    toTop.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  }

  /* ---------------- 7. 当前页链接不回刷 ---------------- */
  // 点击指向当前页面的导航/页脚链接时，只回顶部，不重新加载
  document.querySelectorAll('a[href$=".html"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      var url;
      try { url = new URL(link.href, window.location.href); } catch (err) { return; }
      if (url.origin !== window.location.origin) return;
      if (url.pathname !== window.location.pathname) return;

      e.preventDefault();
      closeNav();
      window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' });
    });
  });

  /* ---------------- 8. 占位链接处理 ---------------- */
  document.querySelectorAll('a[aria-disabled="true"]').forEach(function (link) {
    link.addEventListener('click', function (e) { e.preventDefault(); });
  });
})();
