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

  function getGiscusMapping() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('path') || location.pathname) + '|' + (params.get('title') || document.title);
  }

  const el = getGiscusContainer();
  if (el.hasChildNodes()) return;
  const s = document.createElement('script');
  s.src = 'https://giscus.app/client.js';
  s.async = true;
  s.crossOrigin = 'anonymous';
  s.setAttribute('data-repo', 'ChenyuHeee/literature');
  s.setAttribute('data-repo-id', 'R_kgDOJkQw6w'); // 仓库 ID（需替换为你的仓库 ID）
  s.setAttribute('data-category', 'Announcements'); // Discussions 分类名（需替换为你的分类）
  s.setAttribute('data-category-id', 'DIC_kwDOJkQw684CXYQK'); // 分类 ID（需替换为你的分类 ID）
  s.setAttribute('data-mapping', 'specific');
  s.setAttribute('data-term', getGiscusMapping());
  s.setAttribute('data-reactions-enabled', '1');
  s.setAttribute('data-emit-metadata', '0');
  s.setAttribute('data-input-position', 'top');
  s.setAttribute('data-theme', 'preferred_color_scheme');
  s.setAttribute('data-lang', 'zh-CN');
  el.appendChild(s);
};
