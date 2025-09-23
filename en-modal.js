/* en-modal.js — drop-in для Notion export */
(() => {
  const EDIT_CODE = 'roma'; // код для редактирования на мобиле
  const STYLE_ID = 'en-modal-style';
  const LS_KEY = 'enModalDict:v1';
  const isMobile = window.innerWidth < 768 || /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);

  /* ——— CSS (скоуп по префиксу .en-*) ——— */
  const CSS = `
:root{--safe-bottom:env(safe-area-inset-bottom,0px)}
.en-chip{display:inline-flex;align-items:center;gap:6px;font:600 12px/1 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;padding:4px 8px;border-radius:999px;border:1px solid rgba(0,0,0,.15);background:#fff;cursor:pointer;margin-left:.5rem;vertical-align:middle;box-shadow:0 1px 2px rgba(0,0,0,.06);transition:transform .12s,box-shadow .12s,background .12s}
.en-chip:hover{transform:translateY(-1px);box-shadow:0 3px 10px rgba(0,0,0,.12)}
.en-backdrop{position:fixed;inset:0;background:rgba(0,0,0,.55);backdrop-filter:blur(2px);z-index:9999;display:flex;align-items:flex-start;justify-content:center;overflow-y:auto;padding:40px 16px calc(40px + var(--safe-bottom)) 16px;overscroll-behavior:contain;touch-action:none}
.en-panel{display:flex;flex-direction:column;padding-bottom:calc(56px + var(--safe-bottom));background:linear-gradient(180deg,#fff 0%,#f9fbff 100%);border:1px solid rgba(0,86,179,.12);border-radius:16px;box-shadow:0 14px 36px rgba(0,0,0,.25),0 0 0 1px rgba(0,86,179,.04) inset;padding:16px 20px;max-width:720px;width:min(720px,90vw);color:#0b234a;position:relative;overflow:hidden}
.en-inner{transform-origin:center center; touch-action:pinch-zoom;}

.en-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.en-title{font:700 18px/1.2 system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;color:#082a63;word-wrap:break-word;overflow-wrap:anywhere;white-space:pre-wrap}
.en-actions{display:inline-flex;gap:6px;align-items:center}
.en-btn{padding:6px 10px;border-radius:10px;font-weight:600;border:1px solid rgba(0,0,0,.15);background:#f0f5ff;color:#06306b;cursor:pointer}
.en-btn:hover{background:#e6efff}
.en-close{background:#e74c3c;color:#fff;border:none}
.en-save{background:#2ecc71;color:#fff;border:none}
.en-cancel{background:#bdc3c7;border:none}
.en-sections{display:grid;gap:10px;margin-top:12px;flex:1 1 auto;overflow:auto;-webkit-overflow-scrolling:touch;overscroll-behavior:contain}
.en-sec{background:#fff;border:1px solid rgba(0,86,179,.10);border-radius:10px;padding:8px 10px}
.en-label{font-weight:650;color:#0f3c7d;margin-bottom:4px}
.en-text{white-space:pre-wrap;word-wrap:break-word;overflow-wrap:anywhere}
.en-editor{display:none}
.en-editing .en-text{display:none}
.en-editing .en-editor{display:block}
.en-editor textarea,.en-editor input{width:100%;resize:vertical;border:1px solid rgba(0,0,0,.2);border-radius:8px;padding:12px 12px;font:inherit;background:#fff;min-height:6em}
.en-foot{display:none;justify-content:flex-end;gap:8px;margin-top:12px;position:sticky;bottom:0;background:linear-gradient(180deg,rgba(249,251,255,0),#f9fbff 40%);padding:12px 0 calc(18px + var(--safe-bottom));border-top:1px solid rgba(0,86,179,.08)}
.en-editing .en-foot{display:flex}
.en-audio-under{display:block;margin-top:.4rem}
.en-audio-chip{display:inline-flex;align-items:center;gap:.35rem;padding:.2rem .55rem;border:1px solid rgba(0,0,0,.18);border-radius:999px;background:rgba(0,0,0,.06);font-size:.85rem;line-height:1;white-space:nowrap}
.en-audio-chip button{all:unset;cursor:pointer;padding:.1rem .4rem;border-radius:999px;border:1px solid rgba(0,0,0,.25);line-height:1}
.en-audio-chip button:active{transform:scale(.95)}
@media (max-width:768px){.en-panel{border-radius:14px;padding:12px 14px}}
/* скрыть поле Name в режиме просмотра */
.en-panel:not(.en-editing) .en-sec[data-key="name"]{display:none !important}
`;

  /* ——— helpers ——— */
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const slugify = (str) => {
    const map={'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z','и':'i','й':'y',
      'к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h',
      'ц':'ts','ч':'ch','ш':'sh','щ':'sch','ы':'y','э':'e','ю':'yu','я':'ya'};
    return (str||'').toLowerCase().replace(/[ъь]/g,'')
      .replace(/[\\u0400-\\u04FF]/g, ch => map[ch] ?? ch)
      .replace(/[^a-z0-9]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'');
  };
  const getRuTitleFromH3 = (h3) => {
    const clone = h3.cloneNode(true);
    clone.querySelectorAll('.en-chip').forEach(b=>b.remove());
    return clone.textContent.trim();
  };

  /* ——— storage ——— */
  const loadDict = () => {
    try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}'); } catch { return {}; }
  };
  const saveDict = (d) => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(d)); } catch {}
  };

  /* ——— style injection ——— */
  const ensureStyle = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  };

  /* ——— chips ——— */
  const ensureChips = () => {
    document.querySelectorAll('h3').forEach(h3 => {
      if (!h3.querySelector('.en-chip')) {
        const b = document.createElement('button');
        b.className = 'en-chip'; b.type = 'button'; b.textContent = 'EN';
        h3.appendChild(b);
      }
    });
  };

  /* ——— render sections ——— */
  function renderSectionsHTML(data, isEditing){
    const fields = [
      {key:'name', label:'Name', single:true},
      {key:'description', label:'Description'},
      {key:'features', label:'Features'},
      {key:'ingredients', label:'Ingredients'}
    ];
    let html = '';
    fields.forEach(f=>{
      const val = data[f.key] || '';
      if (f.key==='name' && !isEditing) return;              // Name только в режиме редактирования
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

  /* ——— modal ——— */
  function openPanel(slug, ruName, data, dict){
    ensureStyle();
    const backdrop = document.createElement('div');
    backdrop.className = 'en-backdrop';
    const panel = document.createElement('div');
    panel.className = 'en-panel';
    panel.setAttribute('role','dialog');
    panel.setAttribute('aria-modal','true');

    panel.innerHTML = `
      <div class="en-inner">
      <div class="en-head">
        <div class="en-title">${esc(data.name || ruName)}</div>
        <div class="en-actions">
          <button class="en-btn en-edit" type="button">✎ Edit</button>
          <button class="en-btn en-close" type="button">✕</button>
        </div>
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

    const headEl = panel.querySelector('.en-head');
    const bodyEl = panel.querySelector('.en-sections');
    const footEl = panel.querySelector('.en-foot');

    // запрет фонового скролла (надёжный фикс, сохраняем позицию)
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const scrollY = window.scrollY || document.documentElement.scrollTop;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'relative';

    function layout(){
      const vv = window.visualViewport;
      const scale = vv ? vv.scale || 1 : 1;
      const W = vv ? vv.width : window.innerWidth;
      const H = vv ? vv.height : window.innerHeight;
      // target size = 70% of viewport (physical)
      const targetW = Math.max(280, Math.floor(W * 0.80));
      const targetH = Math.max(240, Math.floor(H * 0.80));
      // counter-scale to keep physical size stable under page zoom
      panel.style.transformOrigin = 'top left';
      panel.style.transform = 'scale(' + (1/scale) + ')';
      panel.style.width  = Math.floor(targetW * scale) + 'px';
      panel.style.height = Math.floor(targetH * scale) + 'px';
      panel.style.maxWidth = 'none'; panel.style.maxHeight = 'none';
      // center using visualViewport offsets
      const ox = vv ? vv.offsetLeft : 0;
      const oy = vv ? vv.offsetTop : 0;
      panel.style.position = 'fixed';
      panel.style.left = (ox + (W - targetW)/2) + 'px';
      panel.style.top  = (oy + (H - targetH)/2) + 'px';
      // compute inner sections layout
      const headH = headEl.getBoundingClientRect().height / scale; // correct for transform
      const footH = panel.classList.contains('en-editing') ? (footEl.getBoundingClientRect().height / scale) : 0;
      const avail = Math.max(80, Math.floor(targetH - headH - footH - 24));
      bodyEl.style.maxHeight = avail + 'px';
      bodyEl.style.overflow = (bodyEl.scrollHeight > bodyEl.clientHeight + 1) ? 'auto' : 'hidden';
    }
    layout(); setTimeout(layout, 50);
    const vv = window.visualViewport;
    if (vv){ vv.addEventListener('resize', layout); vv.addEventListener('scroll', layout); }
    window.addEventListener('resize', layout);

    // ---- Inner zoom (pinch / ctrl+wheel) ----
    const inner = panel.querySelector('.en-inner');
    let z = 1, zMin = 0.75, zMax = 2.5;

    function applyZoom(cx, cy){
      inner.style.transform = `scale(${z})`;
    }
    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

    // Ctrl+wheel (desktop / trackpad pinch)
    panel.addEventListener('wheel', (e)=>{
      if (!e.ctrlKey) return;
      e.preventDefault();
      const dz = -e.deltaY * 0.0015;
      z = clamp(z + dz, zMin, zMax);
      applyZoom(e.clientX, e.clientY);
    }, {passive:false});

    // Two-finger pinch (pointer events)
    let p1=null, p2=null, baseDist=0, baseZ=1;
    function dist(a,b){ const dx=a.clientX-b.clientX, dy=a.clientY-b.clientY; return Math.hypot(dx,dy); }

    panel.addEventListener('pointerdown', (e)=>{
      if (e.pointerType !== 'touch') return;
      panel.setPointerCapture(e.pointerId);
      if (!p1) p1 = e;
      else if (!p2) { p2 = e; baseDist = dist(p1,p2); baseZ = z; }
    });
    panel.addEventListener('pointermove', (e)=>{
      if (e.pointerType !== 'touch') return;
      if (p1 && p1.pointerId === e.pointerId) p1 = e;
      if (p2 && p2.pointerId === e.pointerId) p2 = e;
      if (p1 && p2){ const d = dist(p1,p2); z = clamp(baseZ * (d/baseDist), zMin, zMax); applyZoom((p1.clientX+p2.clientX)/2, (p1.clientY+p2.clientY)/2); }
    });
    function up(e){ if (p1 && p1.pointerId===e.pointerId) p1=null; if (p2 && p2.pointerId===e.pointerId) p2=null; }
    panel.addEventListener('pointerup', up); panel.addEventListener('pointercancel', up); panel.addEventListener('pointerleave', up);

    // Double-tap to reset
    let lastTap = 0;
    panel.addEventListener('touchend', (e)=>{
      const t = Date.now();
      if (t - lastTap < 300) { z = 1; applyZoom(); }
      lastTap = t;
    });

    // Блокируем скролл на фоне при тачах по подложке
    backdrop.addEventListener('touchmove', (e)=>{ if(e.target===backdrop) e.preventDefault(); }, {passive:false});

    backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
    panel.querySelector('.en-close').addEventListener('click', close);

    function close(){
      backdrop.remove();
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.body.style.position = '';
      window.scrollTo(0, scrollY);
      const vv = window.visualViewport; if (vv){ vv.removeEventListener('resize', layout); vv.removeEventListener('scroll', layout); }
      window.removeEventListener('resize', layout);
    }

    const editBtn = panel.querySelector('.en-edit');
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
      layout();
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
      const title=headEl.querySelector('.en-title');
      if(!title) return;
      const under=document.createElement('div');
      under.className='en-audio-under';
      const chip=document.createElement('span');
      chip.className='en-audio-chip';
      chip.innerHTML='<span>EN audio</span> <button type="button">🔊</button>';
      under.appendChild(chip); title.appendChild(under);
      chip.querySelector('button').addEventListener('click',()=>{
        try{ const u=new SpeechSynthesisUtterance((title.childNodes[0]?.textContent||title.textContent||'').trim()); u.lang='en-US'; speechSynthesis.speak(u);}catch(e){}
      });
    })();
  }

  /* ——— binding ——— */
  function bind(){
    ensureStyle();
    ensureChips();
    const dict = loadDict();
    document.querySelectorAll('h3 .en-chip').forEach(btn=>{
      btn.onclick = () => {
        const h3 = btn.closest('h3');
        const ruName = getRuTitleFromH3(h3);
        const slug = slugify(ruName);
        const data = dict[slug] || {name:'',description:'',features:'',ingredients:''};
        openPanel(slug, ruName, data, dict);
      };
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, {once:true});
  } else {
    bind();
  }
})();