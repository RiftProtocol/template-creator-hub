// Lovable Cloud function: fetch SOL balance server-side to avoid browser CORS / RPC restrictions.

type Json = Record<string, unknown>;

function json(body: Json, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      // Allow browser calls
      "access-control-allow-origin": "*",
      "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
    },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-headers": "authorization, x-client-info, apikey, content-type",
        "access-control-allow-methods": "POST, OPTIONS",
      },
    });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const publicKey = String(payload?.publicKey ?? "").trim();
  if (!publicKey) return json({ error: "publicKey is required" }, 400);

  // Default Solana RPC (server-side, so no browser CORS issue)
  const rpcUrl = "https://api.mainnet-beta.solana.com";

  const rpcBody = {
    jsonrpc: "2.0",
    id: "getBalance",
    method: "getBalance",
    params: [publicKey, { commitment: "confirmed" }],
  };

  const resp = await fetch(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(rpcBody),
  });

  const text = await resp.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ error: "RPC returned non-JSON", details: text.slice(0, 500) }, 502);
  }

  if (!resp.ok || parsed?.error) {
    return json(
      {
        error: "RPC error",
        status: resp.status,
        details: parsed?.error ?? parsed,
      },
      502,
    );
  }

  const lamports = parsed?.result?.value;
  if (typeof lamports !== "number") {
    return json({ error: "Unexpected RPC response", details: parsed }, 502);
  }

  return json({ lamports });
});
