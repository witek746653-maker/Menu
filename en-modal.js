/* en-modal.js — drop-in для Notion export (ultra-compact header, actions over title) */
(() => {

// --- version & debug ---
try {
  window.EN_MODAL_VERSION = "EN-Modal v2025.09.23-ultraCompactHead-actionsOverlay+mobileHideEmpty";
  console.log("%cEN-Modal v2025.09.23-ultraCompactHead-actionsOverlay+mobileHideEmpty loaded","padding:2px 6px;border-radius:6px;background:#0b234a;color:#fff");
  if (location.hash.includes('enmodaldebug')) {
    const b=document.createElement('div');
    b.textContent="EN-Modal v2025.09.23-ultraCompactHead-actionsOverlay+mobileHideEmpty";
    b.style.cssText="position:fixed;right:8px;bottom:8px;z-index:100000;font:600 11px system-ui;padding:6px 8px;border-radius:8px;background:#0b234a;color:#fff;opacity:.85";
    document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(b),{once:true});
  }
} catch(e) {}

  const EDIT_CODE = 'roma';
  const STYLE_ID = 'en-modal-style';
  const LS_KEY = 'enModalDict:v1';
  const JSON_URL = 'en.json';

  // load remote JSON (seed data) and merge with local edits
  const loadRemote = () => fetch(JSON_URL, {cache:'no-store'})
    .then(r => r.ok ? r.json() : ({}))
    .catch(()=>({}));

  const deepClone = (o) => JSON.parse(JSON.stringify(o||{}));

  // Merge remote (base) with local (overrides). Local wins.
  const mergeDicts = (remote, local) => {
    const out = deepClone(remote);
    for (const k in local) {
      out[k] = Object.assign({}, remote[k]||{}, local[k]||{});
    }
    return out;
  };

  const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  /* ——— CSS ——— */
  const CSS = `

.en-modal-open .toc-button,
.en-modal-open .floating-toc,
.en-modal-open [data-toc],
.en-modal-open [data-role="toc"]{ display:none !important; }

:root{--safe-bottom:env(safe-area-inset-bottom,0px)}
.en-chip{display:inline-flex;align-items:center;gap:6px;font:600 12px/1 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:4px 8px;border-radius:999px;border:1px solid rgba(0,0,0,.15);background:#fff;cursor:pointer;margin-left:.5rem;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,.06);transition:transform .12s,box-shadow .12s,background .12s}
.en-chip:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.12)}
.en-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:16px 8px calc(20px + var(--safe-bottom)) 8px;overscroll-behavior:contain;touch-action:none}
.en-panel{display:flex;flex-direction:column;background:linear-gradient(180deg,#fff 0%,#f9fbff 100%);border:1px solid rgba(0,86,179,.12);border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.25),0 0 0 1px rgba(0,86,179,.04) inset;padding:6px 8px 10px;max-width:720px;width:min(720px,90vw);color:#0b234a;position:relative;overflow:hidden}
.en-inner{transform-origin:center center;touch-action:pinch-zoom;}

.en-head{
  position:relative;
  padding-top:2px;
  margin-bottom:2px;
}
.en-title{
  display:block;
  margin:0;
  font:700 12px/1.1 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;
  color:#082a63;
  word-wrap:break-word;overflow-wrap:anywhere;white-space:pre-wrap;
  padding-right:36px;
}
.en-actions{
  position:absolute;
  top:2px;
  right:4px;
  display:inline-flex;
  gap:4px;
}
.en-btn{
  display:grid;place-items:center;
  width:24px;height:24px;
  padding:0;border-radius:999px;
  font-weight:700;font-size:12px;
  border:1px solid rgba(0,0,0,.15);
  background:#f0f5ff;color:#06306b;cursor:pointer
}
.en-btn:hover{background:#e6efff}
.en-close{background:#e74c3c;color:#fff;border:none}
.en-save{background:#2ecc71;color:#fff;border:none}
.en-cancel{background:#bdc3c7;border:none}

.en-sections{display:grid;gap:6px;margin-top:2px;flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;box-sizing:border-box;padding-bottom:calc(60px + var(--safe-bottom));min-height:0}
.en-sections::after{content:"";display:block;height:max(60px,calc(12px + var(--safe-bottom)));}
.en-sec{position:relative;background:#fff;border:1px solid rgba(0,86,179,.10);border-radius:8px;padding:10px 8px 6px}
.en-label{position:absolute;top:2px;left:8px;margin:0;font-size:10px;line-height:1.1;font-weight:600;color:#0f3c7d;opacity:.9;background:#fff;padding:0 4px;border-radius:6px}
.en-text{white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}
.en-editor{display:none}
.en-editing .en-text{display:none}
.en-editing .en-editor{display:block}
.en-editor textarea,.en-editor input{width:100%;resize:vertical;border:1px solid rgba(0,0,0,.2);border-radius:6px;padding:8px 10px;font:inherit;background:#fff;min-height:5em; box-sizing:border-box;}

.en-foot{display:none;justify-content:flex-end;gap:6px;margin-top:4px;position:sticky;bottom:0;background:linear-gradient(180deg,rgba(249,251,255,0),#f9fbff 40%);padding:6px 0 calc(10px + var(--safe-bottom));border-top:1px solid rgba(0,86,179,.08)}
.en-editing .en-foot{display:flex}

.en-audio-under{display:block;margin-top:.2rem}
.en-audio-chip{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .45rem;border:1px solid rgba(0,0,0,.18);border-radius:999px;background:rgba(0,0,0,.06);font-size:.8rem;line-height:1;white-space:nowrap}
.en-audio-chip button{all:unset;cursor:pointer;padding:.1rem .3rem;border-radius:999px;border:1px solid rgba(0,0,0,.25);line-height:1}
.en-audio-chip button:active{transform:scale(.95)}


.en-sec{
  position:relative;
  background:#fff;
  border:1px solid rgba(0,86,179,.10);
  border-radius:6px;
  padding:4px 6px 4px; /* уменьшенные отступы */
}
.en-text{
  margin:2px 0;
  white-space:pre-wrap;
  word-wrap:break-word;
  overflow-wrap:anywhere;
}
.en-editor textarea,
.en-editor input{
  width:100%;
  resize:vertical;
  border:1px solid rgba(0,0,0,.2);
  border-radius:6px;
  padding:4px 6px; /* уменьшенные отступы */
  font:inherit;
  background:#fff;
  min-height:5em;
  box-sizing:border-box;
}
@media (max-width:768px){
  .en-panel{border-radius:12px;padding:6px 8px 8px}
  .en-title{font-size:11px}
  .en-actions{top:2px;right:4px}
  .en-panel:not(.en-editing) .en-sec:has(.en-text:empty){ display:none !important; }
  .en-text,
  .en-editor textarea,
  .en-editor input {
    font-size: 0.5em !important; /* уменьшение в 2 раза */
    line-height: 1.25;
  }
}

/* Скрывать пустые секции