const siteOrigin = "https://novextech.ir";

type PageMetadata = {
  title: string;
  description: string;
  path?: string;
  noindex?: boolean;
  type?: "website" | "article";
  structuredData?: Record<string, unknown>;
};

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.append(element);
  }
  element.content = content;
}

export function setPageMetadata({ title, description, path = "/", noindex = false, type = "website", structuredData }: PageMetadata) {
  const url = new URL(path, siteOrigin).href;
  document.title = title;
  upsertMeta("name", "description", description);
  upsertMeta("name", "robots", noindex ? "noindex, nofollow" : "index, follow");
  upsertMeta("property", "og:title", title);
  upsertMeta("property", "og:description", description);
  upsertMeta("property", "og:url", url);
  upsertMeta("property", "og:type", type);
  upsertMeta("name", "twitter:card", "summary");
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement("link");
    canonical.rel = "canonical";
    document.head.append(canonical);
  }
  canonical.href = url;
  if (structuredData) {
    let script = document.getElementById("novextech-page-jsonld") as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement("script");
      script.id = "novextech-page-jsonld";
      script.type = "application/ld+json";
      const nonce = document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce;
      if (nonce) script.nonce = nonce;
      document.head.append(script);
    }
    script.textContent = JSON.stringify(structuredData);
  } else {
    document.getElementById("novextech-page-jsonld")?.remove();
  }
}
