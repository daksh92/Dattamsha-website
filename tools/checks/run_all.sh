#!/bin/sh
# Every check that must pass before the site ships. Needs a server on :8000 for the browser checks:
#   python3 -m http.server 8000 &
# Every check runs even when an earlier one fails; the exit status is 1 if any failed.
# The build check runs last: it fails on purpose while a [PLACEHOLDER] is still showing (values
# only the site owner can supply), so its list is the last thing on screen.
cd "$(dirname "$0")/../.."
echo "== html-validate"
npx html-validate $(find . -name '*.html' -not -path './node_modules/*' -not -path './_review/*' -not -path './tools/*' -not -path './.venv/*' -not -path './src/*') || STATUS=1
echo "== lychee (internal links and #fragments; [PLACEHOLDER] links are left to the build check)"
lychee --offline --no-progress --include-fragments --index-files index.html --exclude '\[[A-Z0-9 %]+\]' \
  --root-dir "$(pwd)" --exclude-path node_modules --exclude-path _review --exclude-path tools \
  --exclude-path .venv --exclude-path src '**/*.html' || STATUS=1
echo "== browser checks";   node tools/checks/site_checks.mjs || STATUS=1
echo "== build check (stale files, client names, ™ placement, placeholders)"
python3 tools/build.py --check || STATUS=1
exit ${STATUS:-0}
