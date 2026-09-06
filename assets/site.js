(function(){
  // Refuse to be framed (clickjacking); GitHub Pages cannot send X-Frame-Options.
  if (window.top !== window.self) { try { window.top.location = window.self.location; } catch (e) { document.documentElement.style.display = 'none'; } }
})();
document.addEventListener('DOMContentLoaded', function () {
  var m = document.querySelector('.nav .menu'), u = document.querySelector('.nav ul');
  if (m && u) { m.addEventListener('click', function () { u.classList.toggle('open'); m.setAttribute('aria-expanded', u.classList.contains('open') ? 'true' : 'false'); }); }
  var f = document.querySelector('form[data-demo]');
  if (!f) return;
  var id = (f.getAttribute('data-formspree') || '').trim();
  if (/^[A-Za-z0-9]{6,12}$/.test(id)) { f.setAttribute('action', 'https://formspree.io/f/' + id); f.removeAttribute('enctype'); return; }
  // No form backend configured: compose a mail in the visitor's own client. Every field is URL-encoded, never interpolated into markup.
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    var d = new FormData(f), body = '';
    ['name','email','company','role','headcount','region','door'].forEach(function (k) { body += k.charAt(0).toUpperCase() + k.slice(1) + ': ' + (d.get(k) || '') + '\n'; });
    body += '\n' + (d.get('message') || '');
    location.href = 'mailto:daksh@dataproducts.co.in?subject=' + encodeURIComponent('Demo request — ' + (d.get('company') || '')) + '&body=' + encodeURIComponent(body);
  });
});
