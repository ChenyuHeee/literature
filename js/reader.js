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

  /* === 目录面板 === */
  const tocPanel   = document.getElementById('tocPanel');
  const tocOverlay = document.getElementById('tocOverlay');
  const tocNav     = document.getElementById('tocNav');
  const tocToggle  = document.getElementById('tocToggle');
  const tocClose   = document.getElementById('tocClose');
  const TOC_STATE_KEY = 'gmc-toc-open';
  let tocOpen = false;

  function openToc() {
    tocOpen = true;
    tocPanel.classList.add('open');
    tocPanel.setAttribute('aria-hidden', 'false');
    tocOverlay.classList.add('visible');
    tocToggle.classList.add('toc-active');
    tocToggle.setAttribute('aria-expanded', 'true');
    if (window.innerWidth >= 1200) localStorage.setItem(TOC_STATE_KEY, '1');
  }
  function closeToc() {
    tocOpen = false;
    tocPanel.classList.remove('open');
    tocPanel.setAttribute('aria-hidden', 'true');
    tocOverlay.classList.remove('visible');
    tocToggle.classList.remove('toc-active');
    tocToggle.setAttribute('aria-expanded', 'false');
    if (window.innerWidth >= 1200) localStorage.setItem(TOC_STATE_KEY, '0');
  }
  function toggleToc() { tocOpen ? closeToc() : openToc(); }

  tocToggle.addEventListener('click', toggleToc);
  tocClose.addEventListener('click', closeToc);
  tocOverlay.addEventListener('click', closeToc);

  // Esc 关闭
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && tocOpen) closeToc();
  });

  /* 构建目录：解析文章内的标题 */
  function buildToc(contentEl) {
    const headings = Array.from(
      contentEl.querySelectorAll('h1, h2, h3, h4')
    );
    if (headings.length < 2) {
      // 标题太少，隐藏目录按钮
      tocToggle.style.display = 'none';
      return;
    }

    // 给每个标题分配 id
    headings.forEach((h, i) => {
      if (!h.id) {
        const slug = h.textContent.trim().replace(/\s+/g, '-').replace(/[^\w\u4e00-\u9fa5-]/g, '');
        h.id = slug || `toc-heading-${i}`;
      }
    });

    // 生成目录项
    const fragment = document.createDocumentFragment();
    headings.forEach(h => {
      const level = parseInt(h.tagName[1]);
      const a = document.createElement('a');
      a.className = 'toc-item';
      a.dataset.level = level;
      a.textContent = h.textContent.trim();
      a.href = '#' + h.id;
      a.addEventListener('click', e => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // 移动端点击后关闭
        if (window.innerWidth < 1200) closeToc();
      });
      fragment.appendChild(a);
    });
    tocNav.appendChild(fragment);

    // 滚动高亮当前章节
    const items = Array.from(tocNav.querySelectorAll('.toc-item'));
    let spyTimer = null;

    function updateActiveTocItem() {
      const scrollY = window.scrollY + 80;
      let activeIdx = 0;
      headings.forEach((h, i) => {
        if (h.offsetTop <= scrollY) activeIdx = i;
      });
      items.forEach((item, i) => {
        item.classList.toggle('active', i === activeIdx);
      });
      // 把激活项滚入目录视野
      const activeItem = items[activeIdx];
      if (activeItem) {
        activeItem.scrollIntoView({ block: 'nearest' });
      }
    }

    window.addEventListener('scroll', () => {
      clearTimeout(spyTimer);
      spyTimer = setTimeout(updateActiveTocItem, 60);
    }, { passive: true });

    updateActiveTocItem();

    // 桌面端：恢复上次 TOC 展开状态（默认首次展开）
    if (window.innerWidth >= 1200) {
      const saved = localStorage.getItem(TOC_STATE_KEY);
      if (saved !== '0') openToc(); // 首次或主动展开过则打开
    }
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

  /* === 分享功能 === */
  const shareBtn  = document.getElementById('shareBtn');
  const shareToast = document.getElementById('shareToast');
  let toastTimer = null;

  function showToast(msg) {
    shareToast.textContent = msg;
    shareToast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => shareToast.classList.remove('show'), 2400);
  }

  async function getShortUrl(longUrl) {
    try {
      const res = await fetch(
        'https://is.gd/create.php?format=json&url=' + encodeURIComponent(longUrl),
        { mode: 'cors' }
      );
      const data = await res.json();
      return data.shorturl || longUrl;
    } catch {
      return longUrl;
    }
  }

  shareBtn && shareBtn.addEventListener('click', async () => {
    const longUrl = location.href;
    const title   = titleParam;

    // 移动端优先用原生分享
    if (navigator.share) {
      try {
        await navigator.share({ title, url: longUrl });
        return;
      } catch {
        // 用户取消则静默处理
        return;
      }
    }

    // 桌面端：生成短链后复制
    shareBtn.disabled = true;
    const short = await getShortUrl(longUrl);
    shareBtn.disabled = false;
    try {
      await navigator.clipboard.writeText(short);
      showToast('链接已复制 ' + short);
    } catch {
      // clipboard 失败则展示短链
      showToast(short);
    }
  });

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

        // 构建目录
        buildToc(content);

        // 还原阅读位置（等待图片等加载后）
        requestAnimationFrame(() => setTimeout(restorePosition, 80));
        updateProgress();

        // 挂载评论系统（Giscus）
        if (window.mountGiscus) window.mountGiscus();
      })
      .catch(err => {
        showError(`无法加载文件「${contentPath}」。<br><small>${err.message}</small>`);
      });
  }
})();
