#!/bin/bash
# הרצת בדיקות התוכן ללא דפדפן (JavaScriptCore של macOS)
# שימוש: tests/run.sh                 — כל קובצי התוכן
#        tests/run.sh js/content/x.js — קובץ מסוים
# jsc לא מצליח לפתוח נתיבים עם עברית, לכן עובדים דרך קישור סימבולי בנתיב ASCII
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
LINKDIR="$(mktemp -d 2>/dev/null || echo "${TMPDIR:-/tmp}/hm$$")"
mkdir -p "$LINKDIR"
LINK="$LINKDIR/root"
ln -sfn "$ROOT" "$LINK"
FILES=()
if [ $# -gt 0 ]; then
  for f in "$@"; do
    f="${f#$ROOT/}"
    FILES+=("$LINK/$f")
  done
else
  for f in "$ROOT"/js/content/*.js; do FILES+=("$LINK/js/content/$(basename "$f")"); done
fi
"$JSC" "$LINK/tests/harness.js" -- "$LINK" "${FILES[@]}"
STATUS=$?
rm -f "$LINK"; rmdir "$LINKDIR" 2>/dev/null
exit $STATUS
