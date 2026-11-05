# piBrick Website

Static GitHub Pages website for **amarullz.com**.

## Structure

- `index.html` — single-page product showcase
- `model.html?id=pocketcm5` — model detail page
- `articles.html` — article index
- `article.html?id=...` — Markdown article reader
- `data/site.json` — **single source of truth** for titles, URLs, prices, model specs, links, FAQ and testimonials
- `content/articles/*.md` — Markdown article bodies
- `assets/` — images, CSS and JavaScript
- `CNAME` — `amarullz.com`

## Adding a model

Add another object to `models` in `data/site.json`. The home model cards and model detail page are already data-driven.

## Adding an article

1. Add a Markdown file under `content/articles/`.
2. Add one object to `articles` in `data/site.json` with `id`, `title`, `date`, `category`, `excerpt`, `cover`, and `file`.
3. The article index and article page will load it automatically with `fetch()`.

## GitHub Pages

Publish the repository with GitHub Pages and keep the included `CNAME`. In Cloudflare, point `amarullz.com` to GitHub Pages using the current GitHub Pages apex A records, or use the DNS records shown by GitHub for the repository.

Because the site loads JSON and Markdown with `fetch()`, test it through HTTP (GitHub Pages, a local static server, etc.), not by opening `index.html` directly as `file://`.
