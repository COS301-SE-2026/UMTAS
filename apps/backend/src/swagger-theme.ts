// Logos served as static files from /public/brand/ via useStaticAssets()
const VIGIL_LOGO = '/brand/vigil-owl.png';
const UMTAS_LOGO = '/brand/umtas-logo.png';
const DNS_LOGO = '/brand/dns-logo.png';

export const swaggerCustomCss = `
@import url('https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Fira+Code:wght@300..700&display=swap');

.swagger-ui, .swagger-ui * { font-family: 'Inter', sans-serif !important; }
.swagger-ui .info .title,
.swagger-ui .opblock-tag,
.swagger-ui .opblock-tag a,
.swagger-ui section.models h4,
.swagger-ui .model-title,
.swagger-ui span.model-title__text { font-family: 'DM Sans', sans-serif !important; }
.swagger-ui .opblock-summary-path,
.swagger-ui .opblock-summary-path span,
.swagger-ui .opblock-summary-method,
.swagger-ui .parameter__name,
.swagger-ui .parameter__type,
.swagger-ui .prop-type,
.swagger-ui .prop-format,
.swagger-ui span.prop-name,
.swagger-ui pre,
.swagger-ui code,
.swagger-ui textarea,
.swagger-ui .highlight-code,
.swagger-ui .microlight { font-family: 'Fira Code', monospace !important; }

.swagger-ui .topbar-wrapper > a > img { display: none !important; }
.swagger-ui .topbar .download-url-wrapper { display: none !important; }

.swagger-ui .version-stamp { display: none !important; }
.swagger-ui .info pre.version { display: none !important; }
.swagger-ui .info .title small { display: none !important; }
`;

export const swaggerCustomJs = `
(function () {
  function injectTopbar() {
    var wrapper = document.querySelector('.swagger-ui .topbar-wrapper');
    if (!wrapper || wrapper.dataset.umtasInjected) return;
    wrapper.dataset.umtasInjected = 'true';

    var group = document.createElement('div');
    group.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 0;';

    function logo(src, alt, h) {
      var img = document.createElement('img');
      img.src = src; img.alt = alt;
      img.style.cssText = 'height:' + h + ';width:auto;object-fit:contain;';
      return img;
    }
    function divider() {
      var d = document.createElement('div');
      d.style.cssText = 'width:1px;height:28px;background:rgba(255,255,255,0.3);flex-shrink:0;';
      return d;
    }

    group.appendChild(logo('${UMTAS_LOGO}', 'UMTAS', '48px'));
    group.appendChild(divider());
    group.appendChild(logo('${VIGIL_LOGO}', 'Vigil', '48px'));
    group.appendChild(divider());
    group.appendChild(logo('${DNS_LOGO}', 'DNS', '64px'));

    wrapper.innerHTML = '';
    wrapper.appendChild(group);
  }

  var observer = new MutationObserver(function () { injectTopbar(); });
  observer.observe(document.body, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectTopbar);
  } else {
    injectTopbar();
  }
  setTimeout(injectTopbar, 500);
})();
`;

export const swaggerFaviconUrl = VIGIL_LOGO;
