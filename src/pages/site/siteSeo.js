import { useEffect } from "react";

function upsertMeta(name, content) {
  let tag = document.head.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export function useSiteSeo(title, description) {
  useEffect(() => {
    document.title = title;
    upsertMeta("description", description);
  }, [title, description]);
}

