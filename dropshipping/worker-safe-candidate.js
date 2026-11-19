/**
 * Worker de diagnóstico Yupoo — versão candidata com redirecionamentos validados.
 * Somente leitura: não grava catálogo, não processa pedidos e não acessa a loja principal.
 * Ainda requer testes no ambiente Cloudflare antes de substituir worker.js.
 */
const ALLOWED_ROOT = "yupoo.store";
const MAX_REDIRECTS = 4;
const MAX_HTML_BYTES = 2_000_000;
const MAX_URL_LENGTH = 2048;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors }
  });
}

function allowed(url) {
  return url.protocol === "https:" &&
    !url.username && !url.password &&
    (url.hostname === ALLOWED_ROOT || url.hostname.endsWith("." + ALLOWED_ROOT)) &&
    (!url.port || url.port === "443");
}

function decode(value = "") {
  return value.replace(/&amp;/g, "&").replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

function absolute(raw, base) {
  if (!raw || /^(data:|javascript:|#)/i.test(raw)) return null;
  try {
    const url = new URL(decode(raw), base);
    return allowed(url) ? url.href : null;
  } catch { return null; }
}

function extract(html, base) {
  const links = [];
  const images = [];
  const linkSet = new Set();
  const imageSet = new Set();

  for (const m of html.matchAll(/<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = absolute(m[1], base);
    if (!url || linkSet.has(url)) continue;
    linkSet.add(url);
    links.push({ url, label: decode(m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ")).trim().slice(0, 140) });
    if (links.length >= 150) break;
  }

  for (const m of html.matchAll(/<(?:img|source)\b[^>]*>/gi)) {
    const attrs = [...m[0].matchAll(/([\w:-]+)\s*=\s*["']([^"']+)["']/g)];
    const a = Object.fromEntries(attrs.map(x => [x[1].toLowerCase(), x[2]]));
    const raw = a.src || a["data-src"] || a["data-original"] || a["data-lazy-src"] ||
      a["data-zoom-image"] || a.srcset?.split(",")[0]?.trim().split(/\s+/)[0];
    const url = absolute(raw, base);
    if (!url || imageSet.has(url)) continue;
    imageSet.add(url);
    images.push({ url, alt: decode(a.alt || "").slice(0, 120) });
    if (images.length >= 120) break;
  }

  const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [, ""])[1]
    .replace(/<[^>]*>/g, " ").trim()).slice(0, 240);
  const sizeMatches = [...html.matchAll(/\b(XXL|XL|XXS|XS|S|M|L|3XL|4XL)\b/gi)].map(x => x[1].toUpperCase());
  return { title, links, images, sizesMentioned: [...new Set(sizeMatches)], counts: { links: links.length, images: images.length } };
}

async function fetchHtml(startUrl) {
  let current = new URL(startUrl);
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    if (!allowed(current)) throw new Error("Redirecionamento para endereço não permitido.");
    const upstream = await fetch(current.href, {
      redirect: "manual",
      signal: AbortSignal.timeout(12000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; CatalogReadOnly/1.0)",
        "Accept": "text/html,application/xhtml+xml"
      }
    });

    if ([301, 302, 303, 307, 308].includes(upstream.status)) {
      const location = upstream.headers.get("location");
      if (!location || hop === MAX_REDIRECTS) throw new Error("Limite de redirecionamentos atingido.");
      let next;
      try { next = new URL(location, current); } catch { throw new Error("Destino de redirecionamento inválido."); }
      if (!allowed(next)) throw new Error("Redirecionamento externo bloqueado.");
      current = next;
      continue;
    }

    if (!upstream.ok) throw new Error("Fornecedor respondeu com status " + upstream.status + ".");
    const type = upstream.headers.get("content-type") || "";
    if (!/text\/html|application\/xhtml\+xml/i.test(type)) throw new Error("A página não retornou HTML.");
    const declared = Number(upstream.headers.get("content-length") || 0);
    if (declared > MAX_HTML_BYTES) throw new Error("Página acima do limite permitido.");
    const html = await upstream.text();
    const bytes = new TextEncoder().encode(html).byteLength;
    if (bytes > MAX_HTML_BYTES) throw new Error("Página acima do limite permitido.");
    return { html, finalUrl: current.href, bytes };
  }
  throw new Error("Não foi possível concluir a leitura.");
}

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (request.method !== "POST") return json({ error: "Use POST /inspect." }, 405);

    let body;
    try { body = await request.json(); } catch { return json({ error: "JSON inválido." }, 400); }
    if (typeof body.url !== "string" || body.url.length > MAX_URL_LENGTH) {
      return json({ error: "Informe uma URL Yupoo válida." }, 400);
    }

    let target;
    try { target = new URL(body.url); } catch { return json({ error: "URL inválida." }, 400); }
    if (!allowed(target)) return json({ error: "Somente endereços HTTPS do domínio Yupoo permitido são aceitos." }, 400);

    try {
      const result = await fetchHtml(target.href);
      return json({
        ok: true,
        sourceUrl: target.href,
        finalUrl: result.finalUrl,
        fetchedAt: new Date().toISOString(),
        htmlBytes: result.bytes,
        ...extract(result.html, result.finalUrl),
        note: "Diagnóstico somente de leitura. Tamanhos mencionados não confirmam estoque."
      });
    } catch (error) {
      return json({ error: "Leitura não concluída.", detail: String(error?.message || error) }, 502);
    }
  }
};
