// Shared behaviour for every page. No dependencies, no network calls.
(function () {
  "use strict";

  // GitHub Pages cannot send frame-ancestors or X-Frame-Options, so refuse to run framed.
  if (window.top !== window.self) {
    try { window.top.location = window.self.location.href; } catch (e) { document.documentElement.hidden = true; }
    return;
  }

  // Mobile menu: the Menu button shows and hides the nav below 960px.
  var toggle = document.querySelector(".menu-toggle");
  var menu = document.getElementById("site-menu");
  if (!toggle || !menu) return;

  function setOpen(open) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    menu.classList.toggle("is-open", open);
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") {
      setOpen(false);
      toggle.focus();
    }
  });

  // Close the menu if the window grows past the breakpoint while it is open.
  var wide = window.matchMedia("(min-width: 960px)");
  var onChange = function () { if (wide.matches) setOpen(false); };
  if (wide.addEventListener) wide.addEventListener("change", onChange);
})();
