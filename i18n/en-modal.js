
/* en-modal.js — drop-in для Notion export (ultra-compact header, actions over title)
   Mobile hard-lock: no background zoom/scroll; modal keeps constant visual size regardless of pre-zoom;
   Restores page exactly as it was on close.
*/
(() => {

// --- version & debug ---
try {
  window.EN_MODAL_VERSION = "EN-Modal v2025.10.01-mobileZoomFix";
  console.log("%cEN-Modal v2025.10.01-mobileZoomFix loaded","padding:2px 6px;border-radius:6px;background:#0b234a;color:#fff");
  if (location.hash.includes('enmodaldebug')) {
    const b=document.createElement('div');
    b.textContent="EN-Modal v2025.10.01-mobileZoomFix";
    b.style.cssText="position:fixed;right:8px;bottom:8px;z-index:100000;font:600 11px system-ui;padding:6px 8px;border-radius:8px;background:#0b234a;color:#fff;opacity:.85";
    document.addEventListener('DOMContentLoaded',()=>document.body.appendChild(b),{once:true});
  }
} catch(e) {}

  const EDIT_CODE = 'roma';
  const STYLE_ID = 'en-modal-style-v2';
  const LS_KEY = 'enModalDict:v1';
  const JSON_URL = 'en.json';

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
html.en-modal-open { -webkit-text-size-adjust: 100%; }
.en-modal-open .toc-button,
.en-modal-open .floating-toc,
.en-modal-open [data-toc],
.en-modal-open [data-role="toc"]{ display:none !important; }

/* Полный запрет жестов/скролла за пределами модалки */
.en-modal-open {
  touch-action: none;
  overscroll-behavior: contain;
}
/* разрешаем вертикальный скролл только внутри секций модалки */
.en-modal-open .en-sections {
  touch-action: pan-y;
}

:root{--safe-bottom:env(safe-area-inset-bottom,0px)}
.en-chip{display:inline-flex;align-items:center;gap:6px;font:600 12px system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:4px 8px;border-radius:999px;border:1px solid rgba(0,0,0,.15);background:#fff;cursor:pointer;margin-left:.5rem;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,.06);transition:transform .12s,box-shadow .12s,background .12s}
.en-chip:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.12)}
.en-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow:hidden;padding:8px 6px calc(8px + var(--safe-bottom)) 6px;overscroll-behavior:contain;touch-action:none}
.en-panel{display:flex;flex-direction:column;background:linear-gradient(180deg,#fff 0%,#f9fbff 100%);border:1px solid rgba(0,86,179,.12);border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.25),0 0 0 1px rgba(0,86,179,.04) inset;padding:0px 10px 0px;max-width:720px;width:min(720px,90vw);color:#0b234a;position:fixed;overflow:hidden;transform-origin:top left}
.en-inner{transform-origin:center center;touch-action:none;}

.en-head{display:flex;align-items:center;justify-content:space-between;margin:0;padding:0 2px;min-height:0;}
.en-title{display:block;margin:0;font:700 20px/1.1 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#082a63;word-wrap:break-word;overflow-wrap:anywhere;white-space:pre-wrap;padding-right:36px;}
.en-actions{position:absolute;top:6px;right:4px;display:inline-flex;gap:4px;}
.en-btn{display:grid;place-items:center;width:24px;height:24px;padding:0;border-radius:999px;font-weight:700;font-size:12px;border:1px solid rgba(0,0,0,.15);background:#f0f5ff;color:#06306b;cursor:pointer}
.en-btn:hover{background:#e6efff}
.en-close{background:#e74c3c;color:#fff;border:none}
.en-save{background:#2ecc71;color:#fff;border:none}
.en-cancel{background:#bdc3c7;border:none}

.en-sections{display:grid;gap:6px;margin-top:2px;flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain;box-sizing:border-box;padding-bottom:calc(96px + var(--safe-bottom));min-height:0;scrollbar-gutter: stable both-edges;touch-action: pan-y;}
.en-sections::after{content:"";display:block;height:max(96px,calc(32px + var(--safe-bottom)));}
.en-sec{display:flex;flex-direction:column;justify-content:center;position:relative;background:#fff;border:1px solid rgba(0,86,179,.10);border-radius:8px;padding:15px 10px 6px}
.en-label{position:absolute;top:2px;left:8px;margin:0;font-size:10px;line-height:1.1;font-weight:600;color:#0f3c7d;opacity:.9;background:#fff;padding:0 4px;border-radius:6px}
.en-text{white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}
.en-editor{display:none}
.en-editing .en-text{display:none}
.en-editing .en-editor{display:block}
.en-editor textarea,.en-editor input{width:100%;resize:vertical;border:1px solid rgba(0,0,0,.2);border-radius:6px;padding:8px 10px;font:16px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:#fff;min-height:5em; box-sizing:border-box;} /* >=16px предотвращает авто-зум iOS */

.en-foot{display:none;justify-content:flex-end;gap:6px;margin-top:4px;position:sticky;bottom:0;background:linear-gradient(180deg,rgba(249,251,255,0),#f9fbff 40%);padding:6px 0 calc(10px + var(--safe-bottom));border-top:1px solid rgba(0,86,179,.08)}
.en-editing .en-foot{display:flex}

.en-audio-under{margin:8px 0 0;}
.en-audio-chip{display:inline-flex;align-items:center;gap:.3rem;padding:.15rem .45rem;border:1px solid rgba(0,0,0,.18);border-radius:999px;background:rgba(0,0,0,.06);font-size:.8rem;line-height:1;white-space:nowrap}
.en-audio-chip button{all:unset;cursor:pointer;padding:.1rem .3rem;border-radius:999px;border:1px solid rgba(0,0,0,.25);line-height:1}
.en-audio-chip button:active{transform:scale(.95)}

@media (max-width:768px){
  .en-panel{border-radius:12px;padding:4px 8px 4px}
  .en-title{font-size:18px}
  .en-actions{top:2px;right:2px}
  .en-panel:not(.en-editing) .en-sec:has(.en-text:empty){ display:none !important; }
}
.en-panel:not(.en-editing) .en-sec[data-key="name"]{display:none !important}
`;

  /* ——— helpers ——— */
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const slugify = (str) => {
    const map={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya'};
    return (str||'').toLowerCase().replace(/[ъь]/g,'').replace(/[\u0400-\u04FF]/g, ch => map[ch] ?? ch).replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  };
  const getRuTitleFromH3 = (h3) => {
    const clone = h3.cloneNode(true);
    clone.querySelectorAll('.en-chip').forEach(b=>b.remove());
    return clone.textContent.trim();
  };

  function findTocBtn(){
    let el = document.querySelector('.toc-button, .floating-toc, [data-toc], [data-role="toc"]');
    if (el) return el;
    const candidates = Array.from(document.querySelectorAll('button, a, .chip, .fab, [role="button"]'));
    return candidates.find(n => (n.textContent||'').trim().includes('Оглавление'));
  }

  const loadDict = () => { try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; } };
  const saveDict = (d) => { try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {} };

  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID; style.textContent = CSS;
    document.head.appendChild(style);
  };

  const ensureChips = () => {
    document.querySelectorAll('h3').forEach(h3 => {
      if (!h3.querySelector('.en-chip')) {
        const b = document.createElement('button');
        b.className = 'en-chip'; b.type = 'button'; b.textContent = 'EN';
        h3.appendChild(b);
        h3.setAttribute('data-en-chip-initialized','1');
      }
    });
  };

  function renderSectionsHTML(data, isEditing){
    const fields = [
      {key:'name', label:'Name', single:true},
      {key:'description', label:'Description'},
      {key:'features', label:'Features'},
      {key:'ingredients', label:'Useful words, phrases & facts'}
    ];
    let html = '';
    fields.forEach(f=>{
      const val = data[f.key] || '';
      if (f.key==='name' && !isEditing) return;
      if (isMobile && !isEditing && !String(val).trim()) return;
      html += `<div class="en-sec" data-key="${f.key}">
        <div class="en-label">${esc(f.label)}</div>
        <div class="en-text">${esc(val)}</div>
        <div class="en-editor">${
           f.single
            ? `<input class="en-${f.key}" value="${esc(val)}">`
            : `<textarea class="en-${f.key}" rows="9">${esc(val)}</textarea>`
        }</div>
      </div>`;
    });
    return html;
  }

  /* ——— Hard-lock for zoom/keys while modal is open (does NOT change page zoom level) ——— */
  const listeners = [];
  function on(el, ev, fn, opts){ el.addEventListener(ev, fn, opts); listeners.push([el, ev, fn, opts]); }
  function lockZoomAndGestures(){
    const preventWheelZoom = (e)=>{ if (e.ctrlKey) { e.preventDefault(); } };
    const preventZoomKeys = (e)=>{
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const cmd = isMac ? e.metaKey : e.ctrlKey;
      if (!cmd) return;
      const k = e.key;
      if (k === '+' || k === '-' || k === '=' || k === '_' || k === '0' || e.code === 'NumpadAdd' || e.code === 'NumpadSubtract') {
        e.preventDefault(); e.stopPropagation();
      }
    };
    const preventSafariGestures = (e)=>{ e.preventDefault(); };
    const preventDblTap = (()=>{
      let last=0; return (e)=>{ const now=Date.now(); if (now-last<300){ e.preventDefault(); } last=now; };
    })();

    on(window, 'wheel', preventWheelZoom, {passive:false, capture:true});
    on(window, 'keydown', preventZoomKeys, true);
    on(window, 'gesturestart', preventSafariGestures, {passive:false});
    on(window, 'gesturechange', preventSafariGestures, {passive:false});
    on(window, 'gestureend', preventSafariGestures, {passive:false});
    on(window, 'touchend', preventDblTap, {passive:false, capture:true});
  }
  function releaseZoomAndGestures(){
    while (listeners.length){
      const [el, ev, fn, opts] = listeners.pop();
      el.removeEventListener(ev, fn, opts);
    }
  }

  /* ——— modal ——— */
  function openPanel(slug, ruName, data, dict){
    ensureStyle();
    const backdrop = document.createElement('div'); backdrop.className = 'en-backdrop';
    const panel = document.createElement('div'); panel.className = 'en-panel'; panel.setAttribute('role','dialog'); panel.setAttribute('aria-modal','true');

    panel.innerHTML = `
      <div class="en-inner">
        <div class="en-head">
          <div class="en-title">${esc(data.name || ruName)}</div>
          <div class="en-actions"><button class="en-btn en-export" type="button" title="Export JSON">⤓</button><button class="en-btn en-import" type="button" title="Import JSON">⤒</button><button class="en-btn en-edit" type="button" title="Edit">✎</button><button class="en-btn en-close" type="button" title="Close">✕</button></div>
        </div>
        <div class="en-sections">${renderSectionsHTML(data,false)}</div>
        <div class="en-foot">
          <button class="en-btn en-save" type="button">Save</button>
          <button class="en-btn en-cancel" type="button">Cancel</button>
        </div>
      </div>
    `;

    backdrop.appendChild(panel);
    document.body.appendChild(backdrop);
    document.documentElement.classList.add('en-modal-open');
    const tocBtn = findTocBtn();
    const prevTocDisplay = tocBtn ? tocBtn.style.display : null;
    if (tocBtn) tocBtn.style.display = 'none';

    const headEl = panel.querySelector('.en-head');
    const bodyEl = panel.querySelector('.en-sections');
    const footEl = panel.querySelector('.en-foot');

    // внутри скролл-контейнера не даём событиям улетать вверх
    bodyEl.addEventListener('wheel', (e)=>{ e.stopPropagation(); }, {passive:false});
    bodyEl.addEventListener('touchmove', (e)=>{ e.stopPropagation(); }, {passive:false});

    // --- Разрешаем скролл только внутри .en-sections ---
    const isInsideScrollable = (el) => {
      while (el && el !== panel) {
        if (el === bodyEl) return true;
        el = el.parentElement;
      }
      return false;
    };
    const stopBgScroll = (e) => { if (!isInsideScrollable(e.target)) e.preventDefault(); };
    backdrop.addEventListener('wheel', stopBgScroll, {passive:false});
    backdrop.addEventListener('touchmove', stopBgScroll, {passive:false});
    panel.addEventListener('wheel', (e)=>{ if (!isInsideScrollable(e.target)) e.preventDefault(); }, {passive:false});

    // блокируем фон (позиция/скролл) и запоминаем состояние
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevBodyPos = document.body.style.position;
    const prevBodyTop = document.body.style.top;
    const prevBodyLeft = document.body.style.left;
    const prevBodyRight = document.body.style.right;
    const prevBodyWidth = document.body.style.width;

    const scrollY = window.scrollY || document.documentElement.scrollTop;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.right = '0';
    document.body.style.width = '100%';

    // Жёстко блокируем все виды зума/жестов без изменения текущего масштаба страницы
    lockZoomAndGestures();

    function layout(){
      const vv = window.visualViewport;
      const scale = vv && vv.scale ? (1 / vv.scale) : 1;        // компенсируем пользовательский зум
      const layoutW = vv ? vv.width * (vv.scale || 1) : window.innerWidth;  // "базовая" ширина без учета зума
      const layoutH = vv ? vv.height * (vv.scale || 1) : window.innerHeight;

      const targetW = Math.max(280, Math.floor(layoutW * 0.94));
      const targetH = Math.max(240, Math.floor(layoutH * 0.92));

      // размеры панели до масштабирования
      panel.style.width  = targetW + 'px';
      panel.style.height = targetH + 'px';
      panel.style.transform = `scale(${scale})`;

      // позиционирование с учетом масштабирования и смещения визуального вьюпорта
      const ox = vv ? vv.offsetLeft : 0;
      const oy = vv ? vv.offsetTop : 0;
      const visW = vv ? vv.width : window.innerWidth;
      const visH = vv ? vv.height : window.innerHeight;
      const scaledW = targetW * scale;
      const scaledH = targetH * scale;
      panel.style.left = (ox + (visW - scaledW)/2) + 'px';
      panel.style.top  = (oy + (visH - scaledH)/2) + 'px';

      const headH = headEl.getBoundingClientRect().height;
      const footH = panel.classList.contains('en-editing') ? (footEl.getBoundingClientRect().height) : 0;
      const pb = Math.max(96, Math.floor(targetH * 0.08));
      const avail = Math.max(80, Math.floor(targetH - headH/scale - footH/scale - 14 - pb));
      bodyEl.style.maxHeight = avail + 'px';
      bodyEl.style.height = avail + 'px';
      bodyEl.style.overflow = 'auto';
      bodyEl.style.paddingBottom = pb + 'px';
    }
    layout(); setTimeout(layout, 50);
    const vv = window.visualViewport;
    if (vv){ vv.addEventListener('resize', layout); vv.addEventListener('scroll', layout); }
    window.addEventListener('resize', layout);

    // клик по фону закрывает модалку
    backdrop.addEventListener('touchmove',(e)=>{ if (e.target===backdrop) e.preventDefault(); },{passive:false});
    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    panel.querySelector('.en-close').addEventListener('click', close);

    function close(){
      if (tocBtn) tocBtn.style.display = prevTocDisplay ?? '';
      document.documentElement.classList.remove('en-modal-open');

      backdrop.remove();
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = prevBodyPos;
      document.body.style.top = prevBodyTop;
      document.body.style.left = prevBodyLeft;
      document.body.style.right = prevBodyRight;
      document.body.style.width = prevBodyWidth;

      // снимаем жесты/зум-блок
      releaseZoomAndGestures();

      // восстановить позицию скролла и оставшийся пользовательский зум (мы его не меняли)
      window.scrollTo(0, scrollY);

      const vv = window.visualViewport;
      if (vv){ vv.removeEventListener('resize', layout); vv.removeEventListener('scroll', layout); }
      window.removeEventListener('resize', layout);
    }

    const editBtn = panel.querySelector('.en-edit');
    const exportBtn = panel.querySelector('.en-export');
    const importBtn = panel.querySelector('.en-import');

    // Export
    exportBtn.addEventListener('click', () => {
      const merged = {};
      for (const k in dict) merged[k] = dict[k];
      const blob = new Blob([JSON.stringify(merged, null, 2)], {type:'application/json'});
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'en.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(()=>{URL.revokeObjectURL(a.href); a.remove();}, 0);
    });

    // Import
    importBtn.addEventListener('click', () => {
      const input = document.createElement('input');
      input.type = 'file'; input.accept = 'application/json';
      input.onchange = async () => {
        const file = input.files && input.files[0];
        if (!file) return;
        try {
          const text = await file.text();
          const remote = JSON.parse(text);
          const local = loadDict();
          const merged = mergeDicts(remote, local);
          saveDict(merged);
          alert('Imported and merged. Reopen the modal to see updates.');
        } catch (e) {
          console.error('Import error:', e);
          alert('Import failed: invalid JSON.');
        }
      };
      input.click();
    });

    const saveBtn = panel.querySelector('.en-save');
    const cancelBtn = panel.querySelector('.en-cancel');

    if (isMobile) panel.classList.add('en-mobile-locked');

    editBtn.addEventListener('click', () => {
      if (isMobile && panel.classList.contains('en-mobile-locked')){
        const pass = (window.prompt('Enter editor code') || '').trim().toLowerCase();
        if (pass !== EDIT_CODE){ alert('Wrong code'); return; }
        panel.classList.remove('en-mobile-locked');
      }
      panel.classList.add('en-editing');
      bodyEl.innerHTML = renderSectionsHTML(data,true);
      (function(){
        const nameInput = panel.querySelector('.en-name');
        const titleEl = panel.querySelector('.en-title');
        const currentTitle = ((titleEl && (titleEl.childNodes[0]?.textContent || titleEl.textContent)) || ruName).trim();
        if (nameInput){ if (!nameInput.value) nameInput.value = currentTitle; }
        if (nameInput && titleEl){
          const upd = ()=>{ const v=(nameInput.value||'').trim(); titleEl.childNodes[0].textContent = v || ruName; };
          nameInput.addEventListener('input', upd);
          upd();
        }
      })();
      // при входе в режим редактирования перепозиционируем (избегаем авто-зумов iOS)
      setTimeout(()=>{
        bodyEl.querySelectorAll('input,textarea').forEach(el=>el.setAttribute('inputmode','text'));
      },0);
      // обновить лейаут
      const vv = window.visualViewport; if (vv) { setTimeout(()=>{ layout(); }, 0); }
    });

    cancelBtn.addEventListener('click', () => {
      panel.classList.remove('en-editing');
      bodyEl.innerHTML = renderSectionsHTML(data,false);
      layout();
    });

    saveBtn.addEventListener('click', () => {
      const updated = {
        name: panel.querySelector('.en-name')?.value?.trim() || '',
        description: panel.querySelector('.en-description')?.value?.trim() || '',
        features: panel.querySelector('.en-features')?.value?.trim() || '',
        ingredients: panel.querySelector('.en-ingredients')?.value?.trim() || '',
      };
      dict[slug] = updated;
      try { localStorage.setItem(LS_KEY, JSON.stringify(dict)); } catch {}
      panel.classList.remove('en-editing');
      panel.querySelector('.en-title').textContent = updated.name || ruName;
      bodyEl.innerHTML = renderSectionsHTML(updated,false);
      layout();
    });

    // аудио-чип под заголовком
    (function attachAudio(){
      const title = headEl.querySelector('.en-title');
      if (!title) return;
      const under = document.createElement('div');
      under.className = 'en-audio-under';
      const chip = document.createElement('span');
      chip.className = 'en-audio-chip';
      chip.innerHTML = '<span>EN audio</span> <button type="button">🔊</button>';
      under.appendChild(chip);
      headEl.appendChild(under);

      const btn = chip.querySelector('button');
      btn.addEventListener('click', () => {
        const fileName = slug + '.mp3';
        const audio = new Audio('../audio/en/' + fileName);
        audio.play().catch(err => console.error('Audio play error:', err));
      });
    })();
  }

  /* ——— binding ——— */
  function bind(){
    ensureStyle();
    ensureChips();
    loadRemote().then((remote)=>{
      const local = loadDict();
      const baseDict = mergeDicts(remote, local);
      let enChipRebindTimer = null;
      const rebind = () => {
        ensureChips();
        const dict2 = mergeDicts({}, baseDict);
        document.querySelectorAll('h3 .en-chip').forEach(btn=>{
          if (btn.dataset.bound) return;
          btn.dataset.bound = '1';
          btn.onclick = () => {
            const h3 = btn.closest('h3');
            const ruName = getRuTitleFromH3(h3);
            const slug = slugify(ruName);
            const data = dict2[slug] || {name:'',description:'',features:'',ingredients:''};
            openPanel(slug, ruName, data, dict2);
          };
        });
      };
      const mo = new MutationObserver(() => {
        clearTimeout(enChipRebindTimer);
        enChipRebindTimer = setTimeout(rebind, 50);
      });
      mo.observe(document.documentElement || document.body, {subtree:true, childList:true});
      rebind();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, {once:true});
  } else {
    bind();
  }
})();
