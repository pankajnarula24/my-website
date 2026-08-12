/* ============================================================
   TEMPORARY DIAGNOSTIC — remove once the Safari issue is fixed.

   HOW TO USE
   1. Upload this file next to index.html
   2. Add this line in index.html, just before </body>:
        <script src="overflow-debug.js"></script>
   3. Open the site in Safari (the browser showing the problem)
   4. A panel appears at the bottom. Wait ~20 seconds so it can
      catch the intermittent case, then tap/click "COPY REPORT"
      and paste the result back to me.

   It changes nothing about the page — it only measures.
   ============================================================ */

(function () {
  'use strict';

  var SAMPLE_MS = 250;      // how often to re-measure
  var DURATION_MS = 30000;  // keep sampling for 30s
  var offenders = {};       // signature -> details
  var timeline = [];        // moments where the page was too wide
  var started = Date.now();

  /* ---------- describe an element compactly ---------- */
  function describe(el) {
    if (el === document.documentElement) return 'html';
    if (el === document.body) return 'body';
    var s = el.tagName.toLowerCase();
    if (el.id) s += '#' + el.id;
    if (el.className && typeof el.className === 'string') {
      var cls = el.className.trim().split(/\s+/).slice(0, 3).join('.');
      if (cls) s += '.' + cls;
    }
    return s;
  }

  function pathOf(el) {
    var parts = [], node = el, guard = 0;
    while (node && node.nodeType === 1 && guard++ < 6) {
      parts.unshift(describe(node));
      if (node === document.body) break;
      node = node.parentElement;
    }
    return parts.join(' > ');
  }

  /* ---------- one measurement pass ---------- */
  function scan() {
    var docEl = document.documentElement;
    var viewport = docEl.clientWidth;
    var scrollW = Math.max(docEl.scrollWidth, document.body ? document.body.scrollWidth : 0);
    var overflowing = scrollW > viewport + 1;

    if (overflowing) {
      timeline.push({
        t: ((Date.now() - started) / 1000).toFixed(1),
        scrollW: scrollW,
        viewport: viewport,
        excess: scrollW - viewport
      });
    }

    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      var cs = window.getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;

      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;

      // Right edge past the viewport, or pushed off to the left
      var overRight = r.right - viewport;
      var overLeft = -r.left;
      if (overRight <= 1 && overLeft <= 1) continue;

      // Ignore elements clipped by an ancestor that actually hides overflow
      var clipped = false, p = el.parentElement, g = 0;
      while (p && g++ < 20) {
        var ps = window.getComputedStyle(p);
        if (ps.overflowX === 'hidden' || ps.overflowX === 'clip' ||
            ps.overflow === 'hidden' || ps.overflow === 'clip') { clipped = true; break; }
        p = p.parentElement;
      }
      if (clipped) continue;

      var sig = pathOf(el);
      var amount = Math.round(Math.max(overRight, overLeft));
      if (!offenders[sig] || offenders[sig].amount < amount) {
        offenders[sig] = {
          amount: amount,
          side: overRight > overLeft ? 'right' : 'left',
          rect: Math.round(r.left) + '..' + Math.round(r.right) +
                ' (w=' + Math.round(r.width) + ')',
          position: cs.position,
          whiteSpace: cs.whiteSpace,
          transform: cs.transform === 'none' ? '' : 'transformed',
          seenAt: ((Date.now() - started) / 1000).toFixed(1) + 's'
        };
      }
    }

    render(viewport, scrollW, overflowing);
  }

  /* ---------- report text ---------- */
  function buildReport() {
    var docEl = document.documentElement;
    var lines = [];
    lines.push('=== SAFARI OVERFLOW REPORT ===');
    lines.push('page: ' + location.href);
    lines.push('UA: ' + navigator.userAgent);
    lines.push('window.innerWidth: ' + window.innerWidth);
    lines.push('documentElement.clientWidth: ' + docEl.clientWidth);
    lines.push('documentElement.scrollWidth: ' + docEl.scrollWidth);
    lines.push('body.scrollWidth: ' + (document.body ? document.body.scrollWidth : 'n/a'));
    lines.push('devicePixelRatio: ' + window.devicePixelRatio);
    lines.push('visualViewport.scale: ' +
      (window.visualViewport ? window.visualViewport.scale : 'n/a'));
    lines.push('');

    lines.push('--- moments page was wider than viewport (' + timeline.length + ') ---');
    if (!timeline.length) {
      lines.push('(none captured)');
    } else {
      var show = timeline.slice(0, 12);
      for (var i = 0; i < show.length; i++) {
        lines.push('  t=' + show[i].t + 's  scrollWidth=' + show[i].scrollW +
                   '  viewport=' + show[i].viewport + '  excess=' + show[i].excess + 'px');
      }
      if (timeline.length > show.length) {
        lines.push('  ... +' + (timeline.length - show.length) + ' more');
      }
    }
    lines.push('');

    var keys = Object.keys(offenders).sort(function (a, b) {
      return offenders[b].amount - offenders[a].amount;
    });
    lines.push('--- elements sticking out (' + keys.length + ') ---');
    if (!keys.length) {
      lines.push('(none found)');
    } else {
      for (var k = 0; k < Math.min(keys.length, 25); k++) {
        var d = offenders[keys[k]];
        lines.push((k + 1) + '. +' + d.amount + 'px past ' + d.side);
        lines.push('   ' + keys[k]);
        lines.push('   x: ' + d.rect + ' | position:' + d.position +
                   ' | white-space:' + d.whiteSpace +
                   (d.transform ? ' | ' + d.transform : '') +
                   ' | first seen ' + d.seenAt);
      }
    }
    return lines.join('\n');
  }

  /* ---------- on-screen panel ---------- */
  var panel, pre, statusEl;

  function buildPanel() {
    panel = document.createElement('div');
    panel.setAttribute('data-overflow-debug', '');
    panel.style.cssText = [
      'position:fixed', 'left:0', 'right:0', 'bottom:0', 'z-index:2147483647',
      'background:#111', 'color:#0f0', 'font:11px/1.35 Menlo,Consolas,monospace',
      'max-height:45vh', 'overflow:auto', 'padding:8px',
      'border-top:2px solid #0f0', 'box-sizing:border-box'
    ].join(';');

    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;flex-wrap:wrap';

    var copyBtn = document.createElement('button');
    copyBtn.textContent = 'COPY REPORT';
    copyBtn.style.cssText =
      'font:bold 12px monospace;padding:8px 12px;background:#0f0;color:#111;' +
      'border:0;border-radius:4px;cursor:pointer';
    copyBtn.onclick = function () {
      var txt = buildReport();
      function done() { copyBtn.textContent = 'COPIED ✓';
        setTimeout(function () { copyBtn.textContent = 'COPY REPORT'; }, 1500); }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(done, function () { selectFallback(txt); });
      } else { selectFallback(txt); }
    };

    var closeBtn = document.createElement('button');
    closeBtn.textContent = 'HIDE';
    closeBtn.style.cssText =
      'font:bold 12px monospace;padding:8px 12px;background:#444;color:#fff;' +
      'border:0;border-radius:4px;cursor:pointer';
    closeBtn.onclick = function () { panel.style.display = 'none'; };

    statusEl = document.createElement('span');
    statusEl.style.cssText = 'color:#ff0';

    bar.appendChild(copyBtn);
    bar.appendChild(closeBtn);
    bar.appendChild(statusEl);

    pre = document.createElement('pre');
    pre.style.cssText = 'margin:0;white-space:pre-wrap;word-break:break-word;color:#0f0';

    panel.appendChild(bar);
    panel.appendChild(pre);
    document.body.appendChild(panel);
  }

  function selectFallback(txt) {
    var ta = document.createElement('textarea');
    ta.value = txt;
    ta.style.cssText = 'position:fixed;left:0;bottom:0;width:100%;height:40vh;z-index:2147483647';
    document.body.appendChild(ta);
    ta.focus(); ta.select();
  }

  function render(viewport, scrollW, overflowing) {
    if (!pre) return;
    var elapsed = ((Date.now() - started) / 1000).toFixed(0);
    statusEl.textContent = 'sampling ' + elapsed + 's/' + (DURATION_MS / 1000) + 's' +
      (overflowing ? '  ⚠ OVERFLOWING NOW (+' + (scrollW - viewport) + 'px)' : '  ok');

    var keys = Object.keys(offenders).sort(function (a, b) {
      return offenders[b].amount - offenders[a].amount;
    });
    var out = 'viewport ' + viewport + ' | scrollWidth ' + scrollW +
              ' | overflow events: ' + timeline.length + '\n';
    if (!keys.length) {
      out += '\nNo element is sticking out right now.\n' +
             'If the scrollbar is visible anyway, keep this open and\n' +
             'scroll/interact until it appears, then copy the report.';
    } else {
      for (var i = 0; i < Math.min(keys.length, 8); i++) {
        out += '\n+' + offenders[keys[i]].amount + 'px  ' + keys[i];
      }
    }
    pre.textContent = out;
  }

  /* ---------- boot ---------- */
  function start() {
    buildPanel();
    scan();
    var iv = setInterval(function () {
      scan();
      if (Date.now() - started > DURATION_MS) {
        clearInterval(iv);
        statusEl.textContent = 'done — tap COPY REPORT';
      }
    }, SAMPLE_MS);

    window.addEventListener('resize', scan);
    window.addEventListener('orientationchange', function () { setTimeout(scan, 300); });
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(start, 400); // let navbar/footer fetches land first
  } else {
    document.addEventListener('DOMContentLoaded', function () { setTimeout(start, 400); });
  }
})();
