import { useEffect } from "react";

function upsertMeta(attr, key, content) {
  const selector = `meta[${attr}="${key}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function upsertLink(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

export function useSiteSeo(title, description, options = {}) {
  const keywords = Array.isArray(options.keywords) ? options.keywords.join(", ") : options.keywords;

  useEffect(() => {
    const origin = window.location.origin;
    const pathname = options.path || window.location.pathname;
    const canonical = new URL(pathname, origin).toString();
    const imageUrl = new URL(options.image || "/img/login.jpg", origin).toString();
    const type = options.type || "website";
    const robots = options.robots || "index, follow";

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertMeta("name", "author", "VetApp");
    upsertMeta("name", "theme-color", "#5E56A3");
    if (keywords) {
      upsertMeta("name", "keywords", keywords);
    }

    upsertMeta("property", "og:locale", "es_PE");
    upsertMeta("property", "og:site_name", "VetApp");
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:url", canonical);
    upsertMeta("property", "og:image", imageUrl);

    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);

    upsertLink("canonical", canonical);
  }, [title, description, keywords, options.image, options.path, options.robots, options.type]);
}
