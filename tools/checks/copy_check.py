"""Word-for-word copy check: compare the visible text of each built page with its design file.

    python3 -I tools/checks/copy_check.py [HANDOFF_SOURCE_DIR] [page ...]

HANDOFF_SOURCE_DIR defaults to $DATTAMSHA_HANDOFF/source ($DATTAMSHA_HANDOFF defaults to
~/dattamsha-handoff). Prints every place where the words differ. Differences we made on
purpose (skip link, Menu button, the Book page form) show up too; a person decides whether
each one is expected.

Client names: the design files still contain client names that were removed from the site
until legal approval. Never restore them from this report. Any difference involving a name
in tools/build.py CLIENT_NAME_HASHES is printed as [client name removed on purpose] and
counted separately, so it never reads as missing copy.
"""

import difflib
import html.parser
import os
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "tools"))
from build import client_name_spans  # noqa: E402

HANDOFF = pathlib.Path(os.environ.get("DATTAMSHA_HANDOFF", pathlib.Path.home() / "dattamsha-handoff")).expanduser()
REMOVED = "[client name removed on purpose]"

PAGES = {
    "Main": "index.html",
    "HowWeWork": "how-we-work/index.html",
    "Platform": "platform/index.html",
    "Clients": "clients/index.html",
    "Trust": "trust/index.html",
    "About": "about/index.html",
    "Book": "book/index.html",
    "Privacy": "privacy/index.html",
    "MondayBrief": "monday-brief/index.html",
}

SKIP = {"script", "style", "svg", "helmet", "head", "title", "template", "noscript"}
VOID = {"br", "img", "input", "meta", "link", "hr", "source", "wbr", "area", "base", "col", "embed", "param", "track"}


class Text(html.parser.HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.depth = 0
        self.stack = []
        self.out = []

    def handle_starttag(self, tag, attrs):
        if tag in VOID:
            if tag == "br":
                self.out.append(" ")
            return
        self.stack.append(tag)
        a = dict(attrs)
        if tag in SKIP or "hidden" in a or a.get("class", "") == "skip-link":
            self.depth += 1
            self.stack[-1] = ("SKIP", tag)

    def handle_endtag(self, tag):
        if tag in VOID:
            return
        while self.stack:
            top = self.stack.pop()
            if isinstance(top, tuple):
                self.depth -= 1
                if top[1] == tag:
                    break
            elif top == tag:
                break
        self.out.append(" ")

    def handle_data(self, data):
        if self.depth == 0:
            self.out.append(data)


def words(markup):
    markup = re.sub(r"<script type=\"text/x-dc\".*?</script>", "", markup, flags=re.S)
    parser = Text()
    parser.feed(markup)
    text = " ".join(parser.out)
    text = re.sub(r"\{\{[^}]*\}\}", " ", text)  # design-tool bindings
    return text.split()


def main():
    args = sys.argv[1:]
    src = pathlib.Path(args.pop(0)) if args and "/" in args[0] else HANDOFF / "source"
    names = args or list(PAGES)
    total = withheld = 0
    for name in names:
        built = ROOT / PAGES[name]
        if not built.exists():
            print(f"== {name}: {PAGES[name]} not built yet")
            continue
        a = words((src / f"{name}.dc.html").read_text(encoding="utf-8"))
        b = words(built.read_text(encoding="utf-8"))
        diffs = [op for op in difflib.SequenceMatcher(None, a, b, autojunk=False).get_opcodes() if op[0] != "equal"]
        names_only = [op for op in diffs if op[0] == "delete" and only_client_names(a[op[1]:op[2]])]
        diffs = [op for op in diffs if op not in names_only]
        total += len(diffs)
        withheld += len(names_only)
        print(f"== {name}: {len(diffs)} difference(s)" + (f", plus {len(names_only)} client name(s) removed on purpose" if names_only else ""))
        for tag, i1, i2, j1, j2 in diffs:
            ctx = mask(" ".join(a[max(0, i1 - 5):i1]))
            print(f"  [{tag}] …{ctx}")
            if i2 > i1:
                print(f"      design: {mask(' '.join(a[i1:i2]))}")
            if j2 > j1:
                print(f"      built : {mask(' '.join(b[j1:j2]))}")
    print(f"total differences: {total}" + (f" (client names removed on purpose, not to be restored: {withheld})" if withheld else ""))


def mask(text):
    """Replace client names with a marker, so this report never shows (or suggests restoring) one."""
    merged = []
    for start, end in sorted(client_name_spans(text)):
        if merged and start <= merged[-1][1] + 1:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    for start, end in reversed(merged):
        text = text[:start] + REMOVED + text[end:]
    return text


def only_client_names(words):
    """True when the deleted words are just client names (and the punctuation around them)."""
    left = re.sub(re.escape(REMOVED), " ", mask(" ".join(words)))
    return REMOVED in mask(" ".join(words)) and not re.search(r"[^\W_]{2,}", left)


if __name__ == "__main__":
    main()
