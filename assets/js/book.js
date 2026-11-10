// Book page: "Or leave your question" opens the visitor's mail app with the question
// filled in. Nothing is sent to us or anyone else from this page.
// Without JavaScript the form still works natively, but Chromium then encodes spaces
// as "+", which mail apps show literally; here we build the link with %20 instead.
(function () {
  "use strict";
  var form = document.querySelector(".book-form");
  if (!form) return;
  var question = form.querySelector("textarea[name=body]");
  // "required" accepts a question made only of spaces; treat that as empty too.
  function checkQuestion() {
    var blank = question.value.length > 0 && !question.value.trim();
    question.setCustomValidity(blank ? "Please write your question." : "");
  }
  question.addEventListener("input", checkQuestion);
  form.addEventListener("submit", function (event) {
    checkQuestion();
    if (!form.checkValidity()) {
      // A truly empty field never gets here (the browser blocks it first); spaces-only does.
      event.preventDefault();
      form.reportValidity();
      return;
    }
    event.preventDefault();
    var params = [];
    Array.prototype.forEach.call(form.elements, function (el) {
      // Line breaks as CRLF, per RFC 6068.
      if (el.name) params.push(el.name + "=" + encodeURIComponent(el.value.replace(/\r?\n/g, "\r\n")));
    });
    window.location.href = form.getAttribute("action") + "?" + params.join("&");
  });
})();
