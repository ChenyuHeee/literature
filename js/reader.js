/* =============================================
   阅读页逻辑 — reader.js
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
  (function initTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    applyTheme(saved || preferred);
  })();

  document.getElementById('themeToggle').addEventListener('click', () => {
    applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
  });

  /* === 字体大小 === */
  const FONT_KEY = 'gmc-font-size';
  const FONT_MIN = 14;
  const FONT_MAX = 24;
  const FONT_STEP = 1;
  let fontSize = parseInt(localStorage.getItem(FONT_KEY) || '17');

  function applyFontSize() {
    document.documentElement.style.setProperty('--reader-font', fontSize + 'px');
    localStorage.setItem(FONT_KEY, fontSize);
  }
  applyFontSize();

  document.getElementById('fontDecrease').addEventListener('click', () => {
    if (fontSize > FONT_MIN) { fontSize -= FONT_STEP; applyFontSize(); }
  });
  document.getElementById('fontIncrease').addEventListener('click', () => {
    if (fontSize < FONT_MAX) { fontSize += FONT_STEP; applyFontSize(); }
  });

  /* === 解析 URL 参数 === */
  const params = new URLSearchParams(window.location.search);
  const contentPath = params.get('path');
  const titleParam  = params.get('title') || '阅读';

  /* 更新 <title> 和顶栏标题 */
  document.title = titleParam + ' — 草木留声';
  document.getElementById('readerTitle').textContent = titleParam;

  /* === 阅读进度条 === */
  const progressBar = document.getElementById('readingProgress');

  function updateProgress() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight  = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? Math.min(100, (scrollTop / docHeight) * 100) : 0;
    progressBar.style.width = pct + '%';
    progressBar.setAttribute('aria-valuenow', Math.round(pct));
  }

  /* === 记忆阅读位置 === */
  const POS_KEY  = contentPath ? `readPos_${contentPath}`  : null;
  const TIME_KEY = contentPath ? `readTime_${contentPath}` : null;
  let saveTimer  = null;
  let didRestore = false;

  function savePosition() {
    if (!POS_KEY) return;
    localStorage.setItem(POS_KEY, Math.round(window.scrollY));
    localStorage.setItem(TIME_KEY, Date.now());
  }

  function restorePosition() {
    if (!POS_KEY || didRestore) return;
    const saved = localStorage.getItem(POS_KEY);
    if (saved && parseInt(saved) > 80) {
      window.scrollTo({ top: parseInt(saved), behavior: 'instant' });
    }
    didRestore = true;
  }

  window.addEventListener('scroll', () => {
    updateProgress();
    clearTimeout(saveTimer);
    saveTimer = setTimeout(savePosition, 300);
  }, { passive: true });

  /* === 加载并渲染 Markdown === */
  function showError(msg) {
    document.getElementById('readerContent').innerHTML = `
      <div class="reader-error">
        <h2>加载失败</h2>
        <p>${msg}</p>
        <p style="margin-top:16px"><a href="index.html">← 返回首页</a></p>
      </div>`;
  }

  function detectPoem(text) {
    // 如果正文行平均长度 < 20 个字符，视为诗歌 / 短行体裁
    const lines = text.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    if (lines.length === 0) return false;
    const avg = lines.reduce((s, l) => s + l.trim().length, 0) / lines.length;
    return avg < 20;
  }

  if (!contentPath) {
    showError('未指定内容路径。');
  } else {
    fetch(contentPath)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.text();
      })
      .then(markdown => {
        // 配置 marked
        if (typeof marked !== 'undefined') {
          marked.setOptions({ breaks: true, gfm: true });
        }
        const html = typeof marked !== 'undefined'
          ? marked.parse(markdown)
          : markdown.replace(/\n/g, '<br>');

        const content = document.getElementById('readerContent');
        content.innerHTML = html;

        // 诗歌样式
        if (detectPoem(markdown)) {
          content.classList.add('is-poem');
        }

        // 还原阅读位置（等待图片等加载后）
        requestAnimationFrame(() => setTimeout(restorePosition, 80));
        updateProgress();
      })
      .catch(err => {
        showError(`无法加载文件「${contentPath}」。<br><small>${err.message}</small>`);
      });
  }
})();
