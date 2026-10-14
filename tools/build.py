#!/usr/bin/env python3
"""בניית חשבוניה לקובץ HTML יחיד.

python3 tools/build.py
  dist/heshboniya.html  — קובץ עצמאי שלם (פותחים בדפדפן, עובד גם בלי שרת)
  dist/artifact.html    — אותו תוכן בלי עטיפת html/head/body (לפרסום כ-Artifact)
"""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DIST = os.path.join(ROOT, 'dist')


def read(rel):
    with open(os.path.join(ROOT, rel), encoding='utf-8') as f:
        return f.read()


def main():
    html = read('index.html')
    missing = []

    def css_repl(m):
        return '<style>\n' + read(m.group(1)) + '\n</style>'

    def js_repl(m):
        rel = m.group(1)
        if not os.path.exists(os.path.join(ROOT, rel)):
            missing.append(rel)
            return ''
        code = read(rel).replace('</script', '<\\/script')
        return '<script>\n/* ' + rel + ' */\n' + code + '\n</script>'

    def fonts_repl(m):
        # פונטים מוטמעים כ-base64 — הקובץ עובד גם בלי אינטרנט
        import base64
        css = read(m.group(1))
        def emb(u):
            data = open(os.path.join(ROOT, 'fonts', u.group(1)), 'rb').read()
            return 'url(data:font/woff2;base64,' + base64.b64encode(data).decode() + ')'
        return '<style>\n' + re.sub(r'url\(([\w-]+\.woff2)\)', emb, css) + '\n</style>'

    html = re.sub(r'<link rel="stylesheet" href="(fonts/fonts\.css)">', fonts_repl, html)
    html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', css_repl, html)
    # בקובץ היחיד אין חשבונות ענן ואין התקנה — רק מצב מקומי
    html = re.sub(r'<script src="vendor/[^"]+"></script>\n?', '', html)
    html = re.sub(r'<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?', '', html)
    html = re.sub(r'<script src="(js/[^"]+)"></script>', js_repl, html)
    os.makedirs(DIST, exist_ok=True)
    with open(os.path.join(DIST, 'heshboniya.html'), 'w', encoding='utf-8') as f:
        f.write(html)

    # גרסת Artifact: בלי doctype/html/head/body — הפלטפורמה עוטפת בעצמה
    head = re.search(r'<head>(.*?)</head>', html, re.S).group(1)
    body = re.search(r'<body>(.*?)</body>', html, re.S).group(1)
    head = re.sub(r'<meta charset[^>]*>\s*', '', head)
    head = re.sub(r'<meta name="viewport"[^>]*>\s*', '', head)
    art = head.strip() + '\n' + body.strip() + '\n'
    with open(os.path.join(DIST, 'artifact.html'), 'w', encoding='utf-8') as f:
        f.write(art)

    size = os.path.getsize(os.path.join(DIST, 'heshboniya.html'))
    print('dist/heshboniya.html  %.0f KB' % (size / 1024))
    print('dist/artifact.html    %.0f KB' % (os.path.getsize(os.path.join(DIST, 'artifact.html')) / 1024))
    if missing:
        print('חסרים (דולגו):', ', '.join(missing))
    return 0


if __name__ == '__main__':
    sys.exit(main())
