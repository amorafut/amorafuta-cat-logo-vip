/**
 * Amora Fut — imagens no Cloudflare R2
 *
 * Endpoints:
 *   POST /upload  (autenticado: sessão Supabase de administrador)
 *   GET  /images/:key (leitura pública)
 *
 * Binding R2: AMORA_IMAGES
 * Vars: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY
 */
const ALLOWED_ORIGIN = "https://amorafut.github.io";
const MAX_BYTES = 15 * 1024 * 1024;
const MIME_EXT = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif"
};

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Vary": "Origin"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) }
  });
}
function safeKey(key) {
  return /^[a-f0-9-]{36}\.(jpg|png|webp|avif)$/i.test(key);
}
async function isAdmin(request, env) {
  const authorization = request.headers.get("Authorization") || "";
  if (!authorization.startsWith("Bearer ")) return false;
  const headers = {
    apikey: env.SUPABASE_PUBLISHABLE_KEY,
    Authorization: authorization
  };
  const userResponse = await fetch(env.SUPABASE_URL + "/auth/v1/user", { headers });
  if (!userResponse.ok) return false;
  const user = await userResponse.json();
  if (!user?.id) return false;
  const checkUrl = env.SUPABASE_URL + "/rest/v1/amora_admin_users?select=user_id&user_id=eq." +
    encodeURIComponent(user.id) + "&limit=1";
  const adminResponse = await fetch(checkUrl, { headers });
  if (!adminResponse.ok) return false;
  const rows = await adminResponse.json();
  return Array.isArray(rows) && rows.some(row => row.user_id === user.id);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
    if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "Origem não autorizada." }, 403, origin);

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname.startsWith("/images/")) {
      const key = decodeURIComponent(url.pathname.slice("/images/".length));
      if (!safeKey(key)) return json({ error: "Imagem não encontrada." }, 404, origin);
      const object = await env.AMORA_IMAGES.get(key);
      if (!object) return json({ error: "Imagem não encontrada." }, 404, origin);
      const headers = new Headers(cors(origin));
      headers.set("Content-Type", object.httpMetadata?.contentType || "application/octet-stream");
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
      headers.set("ETag", object.httpEtag);
      return new Response(object.body, { headers });
    }

    if (request.method !== "POST" || url.pathname !== "/upload") {
      return json({ error: "Rota não encontrada." }, 404, origin);
    }
    if (!env.AMORA_IMAGES || !env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
      return json({ error: "Worker ainda não está configurado. Verifique o bucket R2 e as variáveis Supabase." }, 503, origin);
    }
    try {
      if (!await isAdmin(request, env)) return json({ error: "Acesso administrativo não autorizado." }, 401, origin);
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file.arrayBuffer !== "function") return json({ error: "Envie uma imagem no campo file." }, 400, origin);
      const type = String(file.type || "").toLowerCase();
      if (!MIME_EXT[type]) return json({ error: "Formato não permitido. Use JPG, PNG, WebP ou AVIF." }, 415, origin);
      if (file.size <= 0 || file.size > MAX_BYTES) return json({ error: "A imagem deve ter até 15 MB." }, 413, origin);
      const key = crypto.randomUUID() + "." + MIME_EXT[type];
      await env.AMORA_IMAGES.put(key, await file.arrayBuffer(), {
        httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" }
      });
      return json({ key, url: url.origin + "/images/" + key }, 201, origin);
    } catch (error) {
      return json({ error: error?.message || "Falha ao enviar a imagem." }, 500, origin);
    }
  }
};
