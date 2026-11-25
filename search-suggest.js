/* =========================================================
   Scale Planet - Search Suggestions (Autocomplete)
   Works on every page that has <input id="searchInput">.
   Products Supabase se aate hain (ek baar fetch, phir cache).
   Links: slug ho to /products/<slug>.html, warna /product-detail.html?id=
   ========================================================= */
(function () {
    'use strict';

    var SUPABASE_URL = 'https://lwsfenkvgrqnjmsxfuqo.supabase.co';
    var SUPABASE_KEY = 'sb_publishable_K9EjWvaqMevI5z1FPTGUzw_iLFoWI3v';
    var MAX_SUGGESTIONS = 7;
    var CACHE_KEY = 'sp_products_v1';
    var CACHE_MS = 10 * 60 * 1000; /* 10 minute */

    /* ---------- CSS ---------- */
    var css = '\
    .search-bar.ws-suggest-host { position: relative; }\
    .search-bar.ws-suggest-host > button {\
        border-radius: 50%; background: var(--primary, #3e4095); color: #fff;\
        box-shadow: 0 3px 10px -2px rgba(62,64,149,0.45); transition: background 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease;\
    }\
    .search-bar.ws-suggest-host > button:hover {\
        background: var(--primary-deep, #2d2e6b); box-shadow: 0 6px 14px -3px rgba(62,64,149,0.55);\
        transform: translateY(-50%) scale(1.07);\
    }\
    .search-bar.ws-suggest-host > button:active { transform: translateY(-50%) scale(0.96); }\
    .search-bar.ws-suggest-host > .search-suggest { display: none !important; }\
    .ws-sg-box {\
        position: absolute; top: calc(100% + 8px); left: 0; right: 0; background: #fff;\
        border: 1px solid var(--line-dark, #c9cee3); border-radius: 12px;\
        box-shadow: 0 18px 44px -14px rgba(45,46,107,0.38); z-index: 100000;\
        display: none; max-height: 420px; overflow-y: auto; overflow-x: hidden;\
        text-align: left; font-family: var(--font-body, "Inter", sans-serif);\
        text-transform: none; letter-spacing: 0; min-width: 240px;\
    }\
    .ws-sg-box.show { display: block; animation: wsSgIn 0.18s ease; }\
    @keyframes wsSgIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }\
    .ws-sg-head { padding: 9px 14px 7px; font-size: 10px; font-weight: 800; letter-spacing: 1.2px; text-transform: uppercase; color: var(--text-muted, #8b8fab); background: var(--paper-2, #fafbff); border-bottom: 1px solid var(--line, #e0e2ee); }\
    .ws-sg-item {\
        display: flex; align-items: center; gap: 12px; padding: 9px 14px; cursor: pointer;\
        border-bottom: 1px solid var(--line, #e0e2ee); color: var(--text, #1a1d3f);\
        text-decoration: none; transition: background 0.15s ease;\
    }\
    .ws-sg-item:hover, .ws-sg-item.active { background: var(--primary-pale, #eeeffa); }\
    .ws-sg-thumb {\
        width: 46px; height: 46px; flex-shrink: 0; border-radius: 8px; background: var(--paper-3, #f2f3fb);\
        border: 1px solid var(--line, #e0e2ee); display: flex; align-items: center; justify-content: center; overflow: hidden;\
    }\
    .ws-sg-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 3px; pointer-events: none; }\
    .ws-sg-thumb i { display: none; color: var(--primary, #3e4095); font-size: 16px; }\
    .ws-sg-thumb.noimg i { display: block; }\
    .ws-sg-text { flex: 1; min-width: 0; }\
    .ws-sg-name { font-size: 13px; font-weight: 700; line-height: 1.3; color: var(--text, #1a1d3f); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    .ws-sg-name mark { background: #fff0a8; color: inherit; padding: 0 1px; border-radius: 2px; }\
    .ws-sg-meta { font-size: 11px; font-weight: 600; color: var(--text-muted, #8b8fab); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; margin-top: 1px; }\
    .ws-sg-meta b { color: var(--primary, #3e4095); font-weight: 700; }\
    .ws-sg-badge { flex-shrink: 0; font-size: 9px; font-weight: 800; letter-spacing: 0.4px; text-transform: uppercase; padding: 3px 9px; border-radius: 100px; background: var(--primary-pale, #eeeffa); color: var(--primary, #3e4095); }\
    .ws-sg-item:hover .ws-sg-badge, .ws-sg-item.active .ws-sg-badge { background: #fff; }\
    .ws-sg-all { justify-content: center; gap: 8px; padding: 12px 14px; border-bottom: none; background: var(--paper-2, #fafbff); color: var(--primary, #3e4095); font-size: 12px; font-weight: 800; letter-spacing: 0.3px; text-transform: uppercase; }\
    .ws-sg-all.active, .ws-sg-all:hover { background: var(--primary-pale, #eeeffa); }\
    .ws-sg-empty { padding: 18px 14px; text-align: center; font-size: 13px; font-weight: 600; color: var(--text-soft, #52557a); }\
    .ws-sg-empty i { color: var(--primary-soft, #a4a7e0); margin-right: 6px; }\
    @media (max-width: 768px) {\
        .ws-sg-box { max-height: 340px; }\
        .ws-sg-thumb { width: 40px; height: 40px; }\
        .ws-sg-badge { display: none; }\
        .ws-sg-name { font-size: 12px; }\
    }';

    var styleEl = document.createElement('style');
    styleEl.setAttribute('data-ws-suggest', 'true');
    styleEl.textContent = css;
    document.head.appendChild(styleEl);

    /* ---------- Helpers ---------- */
    function esc(v) {
        return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    function rx(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

    function highlight(text, tokens) {
        if (!tokens.length) return esc(text);
        var re = new RegExp('(' + tokens.map(rx).join('|') + ')', 'gi');
        return String(text).split(re).map(function (part, i) {
            return i % 2 ? '<mark>' + esc(part) + '</mark>' : esc(part);
        }).join('');
    }

    function productUrl(p) {
        var slug = String(p.slug || '').trim();
        return slug ? '/products/' + encodeURIComponent(slug) + '.html'
                    : '/product-detail.html?id=' + encodeURIComponent(p.id);
    }

    function normalize(p) {
        var feats = p.features;
        if (typeof feats === 'string') feats = feats.split(/[\n,]+/);
        if (!Array.isArray(feats)) feats = [];
        return {
            id: p.id,
            slug: p.slug || '',
            name: p.name || '',
            cat: p.category || '',
            capacity: p.capacity || '',
            model: p.model_number || '',
            badge: p.badge || '',
            features: feats,
            img: p.image || (Array.isArray(p.images) && p.images[0]) || ''
        };
    }

    /* ---------- Products load (Supabase REST, cache ke saath) ---------- */
    var PRODUCTS_LIST = null;
    var loadPromise = null;

    function loadProducts() {
        if (PRODUCTS_LIST) return Promise.resolve(PRODUCTS_LIST);
        if (loadPromise) return loadPromise;

        try {
            var cached = JSON.parse(sessionStorage.getItem(CACHE_KEY) || 'null');
            if (cached && cached.t && Date.now() - cached.t < CACHE_MS && Array.isArray(cached.d)) {
                PRODUCTS_LIST = cached.d;
                return Promise.resolve(PRODUCTS_LIST);
            }
        } catch (e) { /* ignore */ }

        loadPromise = fetch(
            SUPABASE_URL + '/rest/v1/products?select=id,name,slug,category,capacity,model_number,badge,features,image,images&order=name.asc',
            { headers: { apikey: SUPABASE_KEY } }
        )
            .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
            .then(function (rows) {
                PRODUCTS_LIST = (rows || []).map(normalize);
                try { sessionStorage.setItem(CACHE_KEY, JSON.stringify({ t: Date.now(), d: PRODUCTS_LIST })); } catch (e) { /* ignore */ }
                return PRODUCTS_LIST;
            })
            .catch(function (err) {
                console.error('Search suggestions: products load nahi hue', err);
                loadPromise = null;
                return [];
            });
        return loadPromise;
    }

    function search(query) {
        var tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (!tokens.length || !PRODUCTS_LIST) return { tokens: tokens, items: [] };
        var scored = [];
        PRODUCTS_LIST.forEach(function (p, idx) {
            var name = p.name.toLowerCase();
            var cat = p.cat.toLowerCase();
            var hay = [p.name, p.cat, p.capacity, p.model].concat(p.features).join(' ').toLowerCase();
            var total = 0;
            for (var i = 0; i < tokens.length; i++) {
                var t = tokens[i];
                if (hay.indexOf(t) === -1) return;
                if (name.indexOf(t) === 0) total += 6;
                else if (name.indexOf(' ' + t) !== -1) total += 4;
                else if (name.indexOf(t) !== -1) total += 3;
                else if (cat.indexOf(t) !== -1) total += 2;
                else total += 1;
            }
            scored.push({ p: p, s: total, i: idx });
        });
        scored.sort(function (a, b) { return b.s - a.s || a.i - b.i; });
        return { tokens: tokens, items: scored.slice(0, MAX_SUGGESTIONS).map(function (x) { return x.p; }) };
    }

    /* ---------- Init ---------- */
    function init() {
        var input = document.getElementById('searchInput');
        if (!input || input.getAttribute('data-ws-suggest-init')) return;
        input.setAttribute('data-ws-suggest-init', '1');

        var host = input.closest('.search-bar') || input.parentElement;
        host.classList.add('ws-suggest-host');

        var box = document.createElement('div');
        box.className = 'ws-sg-box';
        box.setAttribute('role', 'listbox');
        host.appendChild(box);

        input.setAttribute('autocomplete', 'off');
        input.setAttribute('aria-autocomplete', 'list');
        input.setAttribute('aria-expanded', 'false');

        var rows = [];
        var active = -1;

        function hide() {
            box.classList.remove('show');
            input.setAttribute('aria-expanded', 'false');
            active = -1;
        }

        function setActive(n) {
            rows.forEach(function (r) { r.classList.remove('active'); });
            active = n;
            if (n >= 0 && rows[n]) {
                rows[n].classList.add('active');
                if (rows[n].scrollIntoView) rows[n].scrollIntoView({ block: 'nearest' });
            }
        }

        function seeAll() {
            var q = input.value.trim();
            if (!q) return;
            hide();
            if (typeof window.searchProducts === 'function') window.searchProducts();
            else window.location.href = '/products.html?search=' + encodeURIComponent(q);
        }

        function render() {
            var q = input.value;
            if (!q.trim()) { hide(); return; }

            if (!PRODUCTS_LIST) {
                box.innerHTML = '<div class="ws-sg-empty"><i class="fas fa-spinner fa-spin"></i>Loading…</div>';
                rows = [];
                box.classList.add('show');
                loadProducts().then(function () { if (input.value.trim()) render(); });
                return;
            }

            var res = search(q);
            var html = '';
            if (!res.items.length) {
                html = '<div class="ws-sg-empty"><i class="fas fa-magnifying-glass"></i>No matching products found</div>';
            } else {
                html += '<div class="ws-sg-head">Suggested products</div>';
                res.items.forEach(function (p) {
                    var thumb = p.img
                        ? '<img src="' + esc(p.img) + '" alt="" loading="lazy" onerror="this.style.display=\'none\';this.parentNode.classList.add(\'noimg\')">'
                        : '';
                    html += '<a class="ws-sg-item" role="option" href="' + esc(productUrl(p)) + '">' +
                        '<span class="ws-sg-thumb' + (p.img ? '' : ' noimg') + '">' + thumb + '<i class="fas fa-weight-hanging"></i></span>' +
                        '<span class="ws-sg-text">' +
                        '<div class="ws-sg-name">' + highlight(p.name, res.tokens) + '</div>' +
                        '<div class="ws-sg-meta"><b>' + esc(p.cat) + '</b>' + (p.capacity ? ' · ' + esc(p.capacity) : '') + '</div>' +
                        '</span>' +
                        (p.badge ? '<span class="ws-sg-badge">' + esc(p.badge) + '</span>' : '') +
                        '</a>';
                });
                html += '<div class="ws-sg-item ws-sg-all" role="option" data-all="1"><i class="fas fa-magnifying-glass"></i> See all results for “' + esc(q.trim()) + '”</div>';
            }
            box.innerHTML = html;
            rows = Array.prototype.slice.call(box.querySelectorAll('.ws-sg-item'));
            active = -1;
            box.classList.add('show');
            input.setAttribute('aria-expanded', 'true');
        }

        input.addEventListener('input', render);
        input.addEventListener('focus', function () { loadProducts(); render(); });

        input.addEventListener('keydown', function (e) {
            var open = box.classList.contains('show') && rows.length;
            if (e.key === 'ArrowDown' && open) {
                e.preventDefault();
                setActive(active + 1 >= rows.length ? 0 : active + 1);
            } else if (e.key === 'ArrowUp' && open) {
                e.preventDefault();
                setActive(active - 1 < 0 ? rows.length - 1 : active - 1);
            } else if (e.key === 'Enter' && open && active >= 0) {
                e.preventDefault();
                e.stopImmediatePropagation();
                var row = rows[active];
                if (row.getAttribute('data-all')) seeAll();
                else window.location.href = row.getAttribute('href');
            } else if (e.key === 'Escape') {
                hide();
            }
        }, true);

        box.addEventListener('click', function (e) {
            var all = e.target.closest ? e.target.closest('[data-all]') : null;
            if (all) { e.preventDefault(); seeAll(); }
        });
        box.addEventListener('mousemove', function (e) {
            var row = e.target.closest ? e.target.closest('.ws-sg-item') : null;
            var n = rows.indexOf(row);
            if (n !== -1 && n !== active) setActive(n);
        });

        var btn = host.querySelector('button');
        if (btn) btn.addEventListener('click', hide);

        document.addEventListener('click', function (e) {
            if (!host.contains(e.target)) hide();
        });

        loadProducts(); /* pehle se load kar lo taake pehla search fauran chale */
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();