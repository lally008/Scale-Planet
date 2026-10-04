/* =========================================================
   Scale Planet - Search Suggestions (Autocomplete)
   Drop-in script: works on every page that has <input id="searchInput">
   - Uses the page's own PRODUCTS list when it exists (index, products,
     product-detail); otherwise uses the built-in copy below.
   - Makes the search button a round, professional icon button.
   ========================================================= */
(function () {
    'use strict';

    var MAX_SUGGESTIONS = 7;

    /* Fallback catalogue (used on pages that don't define PRODUCTS).
       Keep in sync with the PRODUCTS array on products.html. */
    var CM = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/';
    var FALLBACK = [
        { id: 1, name: 'Digital Platform Weighing Scale', cat: 'Platform Scales', badge: 'Best Seller', capacity: '50KG – 200KG', features: ['1g readability', 'Tare function', 'LCD display', 'Rechargeable battery'], img: 'https://image.made-in-china.com/202f0j00iAEtTJcPVRpf/50kg-100kg-150kg-200kg-Digital-Platform-Electronic-Weighing-Scale-with-RS232.webp' },
        { id: 2, name: 'Price Computing Scale', cat: 'Counter Scales', badge: 'Popular', capacity: '3KG – 40KG', features: ['Price calculation', 'LCD/LED display', 'Tare', 'kg / g / lb'], img: 'https://image.made-in-china.com/202f0j00GTQkUSCFajcE/Multiple-Specifications-Available-Good-Quality-Electronic-Price-Computing-Scale.webp' },
        { id: 3, name: 'Livestock / Animal Weighing Scale', cat: 'Animal Scales', badge: 'Heavy Duty', capacity: '1,000KG – 10,000KG', features: ['Guard rails', 'LED indicator', 'RS-232', 'OIML Class III'], img: 'https://image.made-in-china.com/318f0j00etnfHzamHPpJ/livestockanimalsweighingscales-mp4.webp' },
        { id: 4, name: 'Digital Crane Scale', cat: 'Crane Scales', badge: 'Industrial', capacity: 'Up to 10 Ton', features: ['Hook mounted', 'Digital display', 'Heavy-duty', 'Portable'], img: CM + 'EHP%20Kranwaage%20Typ%20LDN%20LD.png' },
        { id: 5, name: 'Shear Beam Load Cell', cat: 'Load Cells', badge: '2 Ton', capacity: 'Example: 2 Ton', features: ['Shear beam', 'Strain-gauge sensor', 'Industrial', 'Platform applications'], img: CM + 'Load%20Cell%20Sensor%20Module%20from%20a%20Digital%20Weighing%20Scale%2002.jpg' },
        { id: 6, name: 'Digital Weighing Indicator', cat: 'Indicators', badge: 'New', capacity: '100KG – 800KG', features: ['Bright LCD', 'Tare', 'Print', 'RS-232 / USB options'], img: 'https://www.jadever.com/js/htmledit/kindeditor/attached/20221012/20221012134030_34681.jpg' },
        { id: 7, name: 'Analytical Laboratory Balance', cat: 'Lab Scales', badge: 'Precision', capacity: '200g – 320g class', features: ['Draft shield', 'High precision', 'Digital display', 'Tare / calibration'], img: 'https://5.imimg.com/data5/SELLER/Default/2024/9/451385583/ZM/KC/AI/5832544/digital-weighing-machine-500x500.jpg' },
        { id: 8, name: 'Industrial Counting Scale', cat: 'Counting Scales', badge: 'Warehouse', capacity: '1.5KG – 30KG', features: ['Piece counting', 'Multiple displays', 'Keypad', 'Rechargeable battery'], img: 'https://cdn1.npcdn.net/images/20210601_971a5e.webp?from=jpg&md5id=d9236c0a634ecbcb339a2646250c420c&new_height=1000&new_width=1000&size=max&type=1&w=-62170008925' },
        { id: 9, name: 'Digital Kitchen Scale', cat: 'Kitchen Scales', badge: 'Compact', capacity: 'Up to 10KG', features: ['LCD display', 'Tare', 'Compact', 'Food weighing'], img: CM + 'Escali%20digital%20kitchen%20scale.jpg' },
        { id: 10, name: 'Digital Body Weight Scale', cat: 'Health Scales', badge: 'Home', capacity: 'Up to 180KG', features: ['Digital display', 'Tempered glass', 'Auto on/off', 'Low battery indicator'], img: CM + 'Digital%20Body%20Scale.jpg' },
        { id: 11, name: 'Portable Hanging / Hook Scale', cat: 'Hanging Scales', badge: 'Portable', capacity: '50KG example', features: ['Backlit LCD', 'Stainless hook', 'Tare', 'Battery operated'], img: CM + 'Crane%20weighting%20device.jpg' },
        { id: 12, name: 'Digital Electronic Weighing Scale', cat: 'Electronic Scales', badge: 'Everyday', capacity: 'Model dependent', features: ['Digital display', 'Load-cell sensing', 'Tare', 'Commercial / lab use'], img: CM + 'Electronic%20Weighing%20Scale.jpg' }
    ];

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
    .ws-sg-thumb img { width: 100%; height: 100%; object-fit: contain; padding: 3px; }\
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

    function catalogue() {
        var list = null;
        try {
            if (typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) && PRODUCTS.length) list = PRODUCTS;
        } catch (e) { list = null; }
        if (!list) list = FALLBACK;
        return list.map(function (p) {
            return {
                id: p.id,
                name: p.name || '',
                cat: p.cat || '',
                capacity: p.capacity || '',
                badge: p.badge || '',
                features: p.features || [],
                img: (p.images && p.images[0]) || p.img || ''
            };
        });
    }

    function search(query) {
        var tokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
        if (!tokens.length) return { tokens: tokens, items: [] };
        var scored = [];
        catalogue().forEach(function (p, idx) {
            var name = p.name.toLowerCase();
            var cat = p.cat.toLowerCase();
            var hay = [p.name, p.cat, p.capacity].concat(p.features).join(' ').toLowerCase();
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

        var rows = [];      /* clickable rows: product links + "see all" */
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
            else window.location.href = 'products.html?search=' + encodeURIComponent(q);
        }

        function render() {
            var q = input.value;
            if (!q.trim()) { hide(); return; }
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
                    html += '<a class="ws-sg-item" role="option" href="product-detail.html?id=' + encodeURIComponent(p.id) + '">' +
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
        input.addEventListener('focus', render);

        /* Keyboard (capture phase so Enter on a highlighted row doesn't also fire the page's own handler) */
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
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
    else init();
})();
