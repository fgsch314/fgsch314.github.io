# fredericgschneider.com

Static site built from `data/outputs.yaml` (every output) and `data/site.yaml` (bio, charts, topics).

- Add an output: append an entry to `data/outputs.yaml`, push to `main` — GitHub Actions rebuilds and deploys.
- Local preview: `python3.11 build.py --serve` → http://localhost:8740
