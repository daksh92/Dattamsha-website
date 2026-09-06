(function(){
  // Refuse to be framed (clickjacking); GitHub Pages cannot send X-Frame-Options.
  if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; } }
})();
document.addEventListener('DOMContentLoaded', function () {
  var m = document.querySelector('.nav .menu'), u = document.querySelector('.nav > .wrap > ul');
  if (m && u) { m.addEventListener('click', function () { u.classList.toggle('open'); m.setAttribute('aria-expanded', u.classList.contains('open') ? 'true' : 'false'); }); }
  var sb = document.querySelector('.nav .signin-btn'), sl = sb && sb.parentNode;
  if (sb) {
    sb.addEventListener('click', function () { var o = sl.classList.toggle('open'); sb.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    document.addEventListener('click', function (e) { if (!sl.contains(e.target)) { sl.classList.remove('open'); sb.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { sl.classList.remove('open'); sb.setAttribute('aria-expanded', 'false'); } });
  }

  // Demo-request form → Formspree. Submitted with fetch so the visitor stays on the page;
  // if fetch is unavailable or the network fails, the browser's native POST to the same
  // endpoint takes over (Formspree then shows its own confirmation page).
  var f = document.querySelector('form[data-demo]');
  if (!f || !window.fetch || !window.FormData) return;
  var ok = f.querySelector('[data-fs-success]'), err = f.querySelector('[data-fs-error]'), btn = f.querySelector('button[type="submit"]');
  var em = f.querySelector('#email'), rt = f.querySelector('input[name="_replyto"]');
  if (em && rt) { em.addEventListener('input', function () { rt.value = em.value; }); }
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (em && rt) { rt.value = em.value; }
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
