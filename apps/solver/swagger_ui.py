"""Swagger UI with UMTAS logos injected into the topbar."""

from fastapi.responses import HTMLResponse

_VIGIL_LOGO = '/brand/vigil-owl.png'
_UMTAS_LOGO = '/brand/umtas-logo.png'
_DNS_LOGO = '/brand/dns-logo.png'

_CUSTOM_CSS = """
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
"""

_CUSTOM_JS = f"""
(function () {{
  function injectTopbar() {{
    var wrapper = document.querySelector('.swagger-ui .topbar-wrapper');
    if (!wrapper || wrapper.dataset.umtasInjected) return;
    wrapper.dataset.umtasInjected = 'true';

    var group = document.createElement('div');
    group.style.cssText = 'display:flex;align-items:center;gap:14px;padding:10px 0;';

    function logo(src, alt, h) {{
      var img = document.createElement('img');
      img.src = src; img.alt = alt;
      img.style.cssText = 'height:' + h + ';width:auto;object-fit:contain;';
      return img;
    }}
    function divider() {{
      var d = document.createElement('div');
      d.style.cssText = 'width:1px;height:28px;background:rgba(255,255,255,0.3);flex-shrink:0;';
      return d;
    }}

    group.appendChild(logo('{_UMTAS_LOGO}', 'UMTAS', '48px'));
    group.appendChild(divider());
    group.appendChild(logo('{_VIGIL_LOGO}', 'Vigil', '48px'));
    group.appendChild(divider());
    group.appendChild(logo('{_DNS_LOGO}', 'DNS', '64px'));

    wrapper.innerHTML = '';
    wrapper.appendChild(group);
  }}

  var observer = new MutationObserver(function () {{ injectTopbar(); }});
  observer.observe(document.body, {{ childList: true, subtree: true }});

  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', injectTopbar);
  }} else {{
    injectTopbar();
  }}
  setTimeout(injectTopbar, 500);
}})();
"""


def get_custom_swagger_html(*, openapi_url: str, title: str) -> HTMLResponse:
    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title} – API Docs</title>
  <link rel="icon" type="image/png" href="{_VIGIL_LOGO}"/>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"/>
  <style>{_CUSTOM_CSS}</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
<script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
<script>
window.onload = function () {{
  SwaggerUIBundle({{
    url: '{openapi_url}',
    dom_id: '#swagger-ui',
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    layout: 'StandaloneLayout',
    deepLinking: true,
    persistAuthorization: true,
  }});
}};
</script>
<script>{_CUSTOM_JS}</script>
</body>
</html>"""
    return HTMLResponse(html)
