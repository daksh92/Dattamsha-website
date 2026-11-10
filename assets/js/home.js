// Home page: the Ask Gargi and Birbal demo panels. A scripted demo with illustrative data
// that already sits in the page's HTML; this file only switches what is shown.
// No network calls. Without JavaScript the panels keep their static content.
(function () {
  "use strict";

  // ---- Ask Gargi: pick a question, see its answer ----
  // Without JavaScript the first question shows as answered. With it, the panel starts
  // as designed: nothing picked, and a hint line until a question is chosen.
  var gargi = document.querySelector("[data-gargi]");
  if (gargi) {
    var box = gargi.querySelector("[data-answer-box]");
    var hint = gargi.querySelector("[data-hint]");
    var answerText = box.querySelector(".home-answer__text");
    var answerSource = box.querySelector(".home-answer__source");
    var buttons = Array.prototype.slice.call(gargi.querySelectorAll("button[data-answer]"));
    var answers = {};

    buttons.forEach(function (button) {
      var el = document.getElementById(button.getAttribute("data-answer"));
      answers[button.getAttribute("data-answer")] = {
        text: el.querySelector(".home-answer__text").textContent,
        source: el.querySelector(".home-answer__source").textContent
      };
      button.setAttribute("aria-pressed", "false");
    });
    box.hidden = true;
    hint.hidden = false;

    buttons.forEach(function (button) {
      button.addEventListener("click", function () {
        if (button.getAttribute("aria-pressed") === "true") return;
        buttons.forEach(function (b) { b.setAttribute("aria-pressed", b === button ? "true" : "false"); });
        var answer = answers[button.getAttribute("data-answer")];
        // The wrapper is aria-live="polite" and aria-atomic, so the new answer is read out.
        answerText.textContent = answer.text;
        answerSource.textContent = answer.source;
        hint.hidden = true;
        box.hidden = false;
      });
    });
  }

  // ---- The SQL card: on phones its lines stay whole and the box scrolls sideways ----
  // A box that scrolls needs to be reachable by keyboard. The HTML makes it a tab stop
  // (so it works without JavaScript too); here it stays one only while it actually scrolls.
  var sql = document.querySelector(".home-sql__body");
  if (sql) {
    var syncSql = function () {
      if (sql.scrollWidth > sql.clientWidth) sql.setAttribute("tabindex", "0");
      else sql.removeAttribute("tabindex");
    };
    syncSql();
    window.addEventListener("resize", syncSql);
  }

  // ---- Birbal: play the five investigation steps ----
  var birbal = document.querySelector("[data-birbal]");
  if (birbal) {
    var STEP_MS = 1400;
    var steps = Array.prototype.slice.call(birbal.querySelectorAll("[data-steps] > li"));
    var stepList = birbal.querySelector("[data-steps]");
    var thinking = birbal.querySelector("[data-thinking]");
    var status = birbal.querySelector("[data-status]");
    var play = birbal.querySelector("[data-play]");
    var approve = birbal.querySelector("[data-approve]");
    var replay = birbal.querySelector("[data-replay]");
    var hintLine = document.querySelector("[data-play-hint]");
    var approveLabel = approve.textContent;
    var APPROVED_TEXT = "Nudge approved · sent to Hinjewadi";
    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    var timer = null;
    var shown = 0;
    var returnFocus = false;

    stepList.setAttribute("tabindex", "-1");
    // "Press play…" only makes sense once the Play button exists.
    if (hintLine) hintLine.hidden = false;

    // The tick is decoration: screen readers hear only the words.
    function showApproved() {
      var tick = document.createElement("span");
      tick.setAttribute("aria-hidden", "true");
      tick.textContent = "✓";
      approve.replaceChildren(tick, document.createTextNode(" " + APPROVED_TEXT));
    }

    function announce(text) { status.textContent = text; }

    function stepText(li) {
      return li.querySelector(".home-step__head").textContent + ". " +
             li.querySelector(".home-step__text").textContent;
    }

    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      shown = 0;
      steps.forEach(function (li) { li.hidden = true; });
      thinking.hidden = true;
      approve.hidden = true;
      replay.hidden = true;
      approve.textContent = approveLabel;
      play.hidden = false;
    }

    function finish() {
      if (timer) { clearInterval(timer); timer = null; }
      shown = steps.length;
      steps.forEach(function (li) { li.hidden = false; });
      thinking.hidden = true;
      approve.hidden = false;
      replay.hidden = false;
      // Only take focus back if it is still where start() parked it; the visitor may have moved on.
      if (returnFocus && document.activeElement === stepList) approve.focus({ preventScroll: true });
      returnFocus = false;
    }

    function start(trigger) {
      // The button that was pressed is about to hide; keep keyboard focus in the panel.
      returnFocus = document.activeElement === trigger;
      reset();
      play.hidden = true;
      if (returnFocus) stepList.focus({ preventScroll: true });

      if (reduceMotion.matches) {
        announce(steps.map(stepText).join(" "));
        finish();
        return;
      }

      thinking.hidden = false;
      announce(thinking.textContent);
      timer = setInterval(function () {
        shown += 1;
        if (shown >= steps.length) {
          announce(stepText(steps[steps.length - 1]));
          finish();
        } else {
          steps[shown - 1].hidden = false;
          announce(stepText(steps[shown - 1]));
        }
      }, STEP_MS);
    }

    play.addEventListener("click", function () { start(play); });
    replay.addEventListener("click", function () { start(replay); });
    approve.addEventListener("click", function () {
      showApproved();
      announce(APPROVED_TEXT);
    });

    reset();
  }
})();
