/**
 * Diagnóstico de leitura Yupoo — laboratório Dropshipping.
 * Não grava dados, não envia pedidos e não acessa a loja AmoraFut.
 * Configure como Worker independente. Endpoint: POST /inspect
 */
const ALLOWED_HOSTS = ["yupoo.store"];
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function response(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
  });
}

function permitted(url) {
  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.includes(host) || host.endsWith(".yupoo.com");
}

function decodeHtml(value = "") {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

function absolute(raw, base) {
  if (!raw || /^(data:|javascript:|#)/i.test(raw)) return null;
  try { return new URL(decodeHtml(raw), base).href; } catch { return null; }
}

function extract(html, base) {
  const links = [];
  const images = [];
  const seenLinks = new Set();
  const seenImages = new Set();

  for (const match of html.matchAll(/<a\b([^>]*?)href\s*=\s*["']([^"']+)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const href = absolute(match[2], base);
    if (!href || seenLinks.has(href)) continue;
    const host = new URL(href).hostname.toLowerCase();
    if (!(host === "yupoo.store" || host.endsWith(".yupoo.com"))) continue;
    seenLinks.add(href);
    const label = decodeHtml(match[4].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim().slice(0, 180);
    links.push({ url: href, label });
    if (links.length >= 300) break;
  }

  for (const match of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const tag = match[0];
    const attrs = [...tag.matchAll(/([\w:-]+)\s*=\s*["']([^"']+)["']/g)];
    const map = Object.fromEntries(attrs.map(a => [a[1].toLowerCase(), a[2]]));
    const raw = map.src || map["data-src"] || map["data-original"] || map["data-lazy-src"] || map.srcset?.split(",")[0]?.trim().split(/\s+/)[0];
    const src = absolute(raw, base);
    if (!src || seenImages.has(src)) continue;
    const host = new URL(src).hostname.toLowerCase();
    if (!(host === "yupoo.store" || host.endsWith(".yupoo.com") || host.includes("yupoo"))) continue;
    seenImages.add(src);
    images.push({ url: src, alt: decodeHtml(map.alt || "").slice(0, 160) });
    if (images.length >= 250) break;
  }

  const title = decodeHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [,""])[1].replace(/<[^>]*>/g, " ").trim());
  return { title, links, images, counts: { links: links.length, images: images.length } };
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return response({ error: "Use POST /inspect." }, 405);

    let body;
    try { body = await request.json(); } catch { return response({ error: "JSON inválido." }, 400); }
    let target;
    try { target = new URL(String(body.url || "")); } catch { return response({ error: "Informe uma URL válida." }, 400); }
    if (target.protocol !== "https:" || !permitted(target)) {
      return response({ error: "Por segurança, somente https://www.yupoo.store e subdomínios *.yupoo.com são permitidos." }, 400);
    }

    try {
      const upstream = await fetch(target.href, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; AmoraFut-Dropshipping-Test/1.0)", "Accept": "text/html,application/xhtml+xml" },
        redirect: "follow"
      });
      const type = upstream.headers.get("content-type") || "";
      if (!upstream.ok) return response({ error: "O fornecedor respondeu com erro.", status: upstream.status, contentType: type }, 502);
      if (!type.includes("text/html")) return response({ error: "A URL não retornou uma página HTML.", contentType: type }, 415);
      const html = await upstream.text();
      if (html.length > 8_000_000) return response({ error: "Página muito grande para o diagnóstico inicial." }, 413);
      const result = extract(html, upstream.url || target.href);
      return response({
        ok: true,
        sourceUrl: target.href,
        finalUrl: upstream.url || target.href,
        fetchedAt: new Date().toISOString(),
        htmlBytes: new TextEncoder().encode(html).length,
        ...result,
        note: "Diagnóstico somente de leitura. Os links e imagens precisam de validação antes da importação."
      });
    } catch (error) {
      return response({ error: "Não foi possível ler a página do fornecedor.", detail: String(error?.message || error) }, 502);
    }
  }
};
