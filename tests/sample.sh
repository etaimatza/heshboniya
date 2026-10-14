#!/bin/bash
# הדפסת דוגמאות טקסט לשיעור: tests/sample.sh js/content/fractions-a.js f-part [count]
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
JSC=/System/Library/Frameworks/JavaScriptCore.framework/Versions/Current/Helpers/jsc
LINKDIR="$(mktemp -d 2>/dev/null || echo "${TMPDIR:-/tmp}/hm$$")"; mkdir -p "$LINKDIR"
LINK="$LINKDIR/root"; ln -sfn "$ROOT" "$LINK"
F="${1#$ROOT/}"
"$JSC" "$LINK/tests/sample.js" -- "$LINK" "$LINK/$F" "$2" "${3:-4}"
rm -f "$LINK"; rmdir "$LINKDIR" 2>/dev/null
