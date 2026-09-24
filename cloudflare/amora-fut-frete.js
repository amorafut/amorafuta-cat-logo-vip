/**
 * Worker de cotação de frete — Amora Fut Streetwear
 * Configure no Cloudflare:
 *   Secret: SUPERFRETE_TOKEN (token de produção)
 *   Endpoint esperado: POST / (ou /cotacao)
 *
 * Entrada JSON: { "cep": "60000000", "quantidade": 2 }
 */
const ALLOWED_ORIGIN = "https://amorafut.github.io";
const SUPERFRETE_URL = "https://api.superfrete.com/api/v0/calculator";

function cors(origin) {
  const allowed = origin === ALLOWED_ORIGIN ? origin : ALLOWED_ORIGIN;
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin"
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) }
  });
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (origin && origin !== ALLOWED_ORIGIN) {
      return json({ error: "Origem não autorizada." }, 403, origin);
    }
    if (request.method !== "POST") {
      return json({ error: "Use POST para solicitar uma cotação." }, 405, origin);
    }
    if (!env.SUPERFRETE_TOKEN) {
      return json({ error: "Token SuperFrete não configurado no Worker." }, 500, origin);
    }

    let input;
    try { input = await request.json(); }
    catch { return json({ error: "Envie um JSON válido." }, 400, origin); }

    const cep = String(input.cep || "").replace(/\D/g, "");
    const quantidade = Number(input.quantidade);
    if (!/^\d{8}$/.test(cep)) {
      return json({ error: "Informe um CEP de destino com 8 dígitos." }, 400, origin);
    }
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
      return json({ error: "Quantidade deve ser um número inteiro entre 1 e 20." }, 400, origin);
    }

    const pacote = {
      height: 4 * quantidade,
      width: 21,
      length: 30,
      weight: Number(((240 * quantidade + 20) / 1000).toFixed(3))
    };

    const payload = {
      from: { postal_code: "60347540" },
      to: { postal_code: cep },
      services: "1,2,17",
      options: {
        own_hand: false,
        receipt: false,
        insurance_value: 0,
        use_insurance_value: false
      },
      package: pacote
    };

    try {
      const response = await fetch(SUPERFRETE_URL, {
        method: "POST",
        headers: {
          "Authorization": "Bearer " + env.SUPERFRETE_TOKEN,
          "User-Agent": "Amora Fut Streetwear (integracao de frete) - amorafut@gmail.com",
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const text = await response.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { message: text.slice(0, 500) }; }
      if (!response.ok) {
        return json({ error: "A SuperFrete recusou a cotação.", status: response.status, details: data }, response.status, origin);
      }
      return json({ pacote, cotacoes: data }, 200, origin);
    } catch {
      return json({ error: "Não foi possível conectar à SuperFrete." }, 502, origin);
    }
  }
};