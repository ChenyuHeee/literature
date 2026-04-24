// Giscus 挂载函数，供 reader.js 调用
window.mountGiscus = function() {
  function getGiscusContainer() {
    let el = document.getElementById('giscus-container');
    if (!el) {
      el = document.createElement('section');
      el.id = 'giscus-container';
      el.style.margin = '48px auto 0';
      el.style.maxWidth = '680px';
      el.style.background = 'var(--bg-card)';
      el.style.borderRadius = 'var(--radius)';
      el.style.boxShadow = 'var(--shadow-sm)';
      el.style.padding = '0 0 8px';
      const main = document.getElementById('readerMain');
      main.appendChild(el);
    }
    return el;
  }

  // 根据当前站点主题返回对应的 Giscus 主题
  function getGiscusTheme() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    return dark ? 'dark_dimmed' : 'light';
  }

  // 用作 discussion term 的稳定短标识（用 id 或 path 的末段，避免特殊字符过多）
  function getTerm() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) return id;                               // 优先用短 id
    const path = params.get('path') || '';
    // 取路径末段文件名，去掉扩展名
    return path.split('/').pop().replace(/\.[^.]+$/, '') || 'index';
  }

  const el = getGiscusContainer();
  if (el.hasChildNodes()) return;
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-repo', 'ChenyuHeee/literature');
  s.setAttribute('data-repo-id', 'R_kgDOSKMIEQ');
  s.setAttribute('data-category', 'General');
  s.setAttribute('data-category-id', 'DIC_kwDOSKMIEc4C7muQ');
  s.setAttribute('data-mapping', 'specific');
  s.setAttribute('data-term', getTerm());
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'top');
  s.setAttribute('data-theme', getGiscusTheme());
  s.setAttribute('data-lang', 'zh-CN');
  el.appendChild(s);

  // 监听站点主题变化，同步更新 Giscus 主题
  const observer = new MutationObserver(() => {
    const frame = document.querySelector('iframe.giscus-frame');
    if (!frame) return;
    frame.contentWindow.postMessage(
      { giscus: { setConfig: { theme: getGiscusTheme() } } },
      'https://giscus.app'
    );
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
};
