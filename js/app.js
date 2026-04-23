/* =============================================
   首页逻辑 — app.js
   ============================================= */

(function () {
  'use strict';

  /* === 主题 === */
  const THEME_KEY = 'gmc-theme';
  const root = document.documentElement;

  function applyTheme(t) {
    root.setAttribute('data-theme', t);
    localStorage.setItem(THEME_KEY, t);
  }
  function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
  }
  initTheme();

  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* === 分类徽章映射 === */
  const CAT_NAME = { novel: '小说', poems: '诗文' };

  /* === 渲染卡片 === */
  function renderCard(work) {
    const url = `reader.html?path=${encodeURIComponent(work.path)}&title=${encodeURIComponent(work.title)}`;
    const tags = (work.tags || []).map(t => `<span class="work-tag">${t}</span>`).join('');
    const badge = CAT_NAME[work.category] || work.category;
    const sub = work.subtitle ? `<div class="work-subtitle">${work.subtitle}</div>` : '';
    return `
      <a class="work-card" href="${url}" role="listitem" data-cat="${work.category}">
        <div class="work-card-top">
          <div>
            <div class="work-title">${work.title}</div>
            ${sub}
          </div>
          <span class="work-badge">${badge}</span>
        </div>
        <p class="work-excerpt">${work.excerpt}</p>
        <div class="work-meta">
          <div class="work-tags">${tags}</div>
          <span class="read-link">阅读 →</span>
        </div>
      </a>`;
  }

  /* === 继续阅读 === */
  function checkContinueReading(works) {
    let latest = null;
    let latestTime = 0;
    works.forEach(w => {
      const key = `readPos_${w.path}`;
      const ts  = `readTime_${w.path}`;
      const t   = parseInt(localStorage.getItem(ts) || '0');
      if (t > latestTime && localStorage.getItem(key)) {
        latestTime = t;
        latest = w;
      }
    });
    if (!latest) return;
    const banner = document.getElementById('continueReading');
    const titleEl = document.getElementById('continueTitle');
    const url = `reader.html?path=${encodeURIComponent(latest.path)}&title=${encodeURIComponent(latest.title)}`;
    titleEl.textContent = latest.title + (latest.subtitle ? `·${latest.subtitle}` : '');
    banner.href = url;
    banner.style.display = 'flex';
  }

  /* === 加载内容 === */
  let allWorks = [];

  fetch('content.json')
    .then(r => r.json())
    .then(data => {
      allWorks = data.works || [];
      const grid = document.getElementById('worksGrid');
      grid.innerHTML = allWorks.map(renderCard).join('');
      checkContinueReading(allWorks);
    })
    .catch(() => {
      document.getElementById('worksGrid').innerHTML =
        '<p style="color:var(--text-muted);padding:40px 0;">暂无内容</p>';
    });

  /* === 分类筛选 === */
  document.querySelector('.category-nav').addEventListener('click', e => {
    const btn = e.target.closest('.cat-btn');
    if (!btn) return;
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const cat = btn.dataset.cat;
    document.querySelectorAll('.work-card').forEach(card => {
      const show = cat === 'all' || card.dataset.cat === cat;
      card.style.display = show ? '' : 'none';
    });
  });
})();
