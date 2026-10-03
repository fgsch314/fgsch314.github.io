"""Build the static site from data/*.yaml into dist/.  Local only — no network.

    python3.11 build.py            # build once
    python3.11 build.py --serve    # build and serve on http://localhost:8740
"""
import os
import shutil
import sys
from collections import Counter
from datetime import date
from pathlib import Path

import yaml
from jinja2 import Environment, FileSystemLoader, select_autoescape

HERE = Path(__file__).resolve().parent
DIST = HERE / "dist"
TYPE_LABEL = {"policy": "Policy", "media": "Media", "academic": "Academic"}
LEGACY_FILES = {
    '/wp-content/uploads/2026/03/Frederic-Schneider-1335-110326-4.mp4': '/static/files/aje-interview-2026-03.mp4',
    '/wp-content/uploads/2026/06/GCC-360-Monthly-Report-2026-06-Issue-1.pdf': '/static/files/gcc360-2026-06.pdf',
    '/wp-content/uploads/2026/08/f6aaf817-dad9-42a5-bf72-c2fe0b011fb8.pdf': '/static/files/gcc360-2026-07.pdf',
    '/wp-content/uploads/2026/10/GCC-360-August-2026-Edition.pdf': '/static/files/gcc360-2026-08.pdf',
    '/wp-content/uploads/2026/10/GCC360-September.pdf': '/static/files/gcc360-2026-09.pdf',
    '/wp-content/uploads/2026/03/CV_Frederic-Schneider_March-26.pdf': '/static/files/cv-frederic-schneider.pdf'
}
MONTHS = "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split()


def fmt_date(d):
    d = str(d or "")
    if len(d) >= 7:
        return f"{MONTHS[int(d[5:7]) - 1]} {d[:4]}"
    return d


def load():
    site = yaml.safe_load((HERE / "data/site.yaml").read_text())
    if os.environ.get("FORM_PREVIEW"):  # local layout check only: render the form with a dummy endpoint
        site["contact_form"] = {"endpoint": "http://localhost:9/none", "turnstile_sitekey": "1x00000000000000000000AA"}
    items = yaml.safe_load((HERE / "data/outputs.yaml").read_text())
    for i in items:
        i["date"] = str(i["date"]) if i.get("date") else ""
        i["topics"] = i.get("topics") or []
    items.sort(key=lambda i: i["date"], reverse=True)
    return site, items


def build():
    site, items = load()
    env = Environment(loader=FileSystemLoader(HERE / "templates"), autoescape=select_autoescape())
    env.filters["fdate"] = fmt_date
    counts = Counter(i["type"] for i in items)
    ctx = dict(site=site, items=items, counts=counts, type_label=TYPE_LABEL,
               year=date.today().year, n_total=len(items))
    if DIST.exists():
        shutil.rmtree(DIST)
    (DIST / "work").mkdir(parents=True)
    shutil.copytree(HERE / "static", DIST / "static")
    shutil.copytree(HERE / "diagrams", DIST / "diagrams")
    # Files people may have linked to on the old WordPress site keep their URLs.
    for old, new in LEGACY_FILES.items():
        (DIST / old.lstrip("/")).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy(DIST / new.lstrip("/"), DIST / old.lstrip("/"))

    pages = {
        "index.html": ("index.html", dict(
            latest=[i for i in items if i["type"] != "academic"][:8],
            featured=[i for i in items if i.get("featured")][:3],
            spotlight_items=[i for i in items if site["spotlight"] and site["spotlight"]["topic"] in i["topics"]],
            pubs=[i for i in items if i["type"] == "academic" and i["format"] == "Journal article"][:5],
        )),
        "contact/index.html": ("contact.html", {}),
        "work/index.html": ("work.html", dict(
            years=sorted({i["date"][:4] for i in items if i["date"]}, reverse=True),
        )),
    }
    for out, (tpl, extra) in pages.items():
        (DIST / out).parent.mkdir(parents=True, exist_ok=True)
        (DIST / out).write_text(env.get_template(tpl).render(**ctx, **extra, page=out))
    # Old WordPress URLs keep working (D-003): /iran-war/ -> filtered Work view, etc.
    redirects = {"iran-war": "/work/?topic=iran-war", "policy-analysis": "/work/?type=policy",
                 "news-media": "/work/?type=media", "research": "/work/?type=academic"}
    for slug, target in redirects.items():
        (DIST / slug).mkdir(exist_ok=True)
        (DIST / slug / "index.html").write_text(
            f'<!doctype html><meta charset="utf-8"><link rel="canonical" href="{target}">'
            f'<meta http-equiv="refresh" content="0; url={target}"><a href="{target}">Moved here</a>')
    print(f"built {len(items)} items -> {DIST.relative_to(HERE)}/  ({dict(counts)})")


if __name__ == "__main__":
    build()
    if "--serve" in sys.argv:
        import functools, http.server
        handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=DIST)
        http.server.ThreadingHTTPServer(("127.0.0.1", 8740), handler).serve_forever()
