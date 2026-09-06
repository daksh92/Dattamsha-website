(function(){
  // Refuse to be framed (clickjacking); GitHub Pages cannot send X-Frame-Options.
  if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; } }
})();
document.addEventListener('DOMContentLoaded', function () {
  var m = document.querySelector('.nav .menu'), u = document.querySelector('.nav ul');
  if (m && u) { m.addEventListener('click', function () { u.classList.toggle('open'); m.setAttribute('aria-expanded', u.classList.contains('open') ? 'true' : 'false'); }); }

  // Demo-request form → Formspree. Submitted with fetch so the visitor stays on the page;
  // if fetch is unavailable or the network fails, the browser's native POST to the same
  // endpoint takes over (Formspree then shows its own confirmation page).
  var f = document.querySelector('form[data-demo]');
  if (!f || !window.fetch || !window.FormData) return;
  var ok = f.querySelector('[data-fs-success]'), err = f.querySelector('[data-fs-error]'), btn = f.querySelector('button[type="submit"]');
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    err.hidden = true; err.textContent = '';
    btn.disabled = true; var label = btn.textContent; btn.textContent = 'Sending…';
    fetch(f.action, { method: 'POST', body: new FormData(f), headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.status >= 200 && res.status < 300 && res.body && res.body.ok !== false) {
          f.reset();
          Array.prototype.forEach.call(f.querySelectorAll('div:not(.fs-msg)'), function (d) { d.hidden = true; });
          ok.hidden = false; ok.scrollIntoView({ block: 'nearest' });
        } else {
          var msgs = (res.body && res.body.errors) ? res.body.errors.map(function (x) { return x.message; }).join(' ') : 'Something went wrong. Please email daksh@dattamsha.co.in directly.';
          err.textContent = msgs; err.hidden = false;
          btn.disabled = false; btn.textContent = label;
        }
      })
      .catch(function () {
        // Network or CSP failure: fall back to the browser's own submission.
        btn.disabled = false; btn.textContent = label;
        f.submit();
      });
  });
});
