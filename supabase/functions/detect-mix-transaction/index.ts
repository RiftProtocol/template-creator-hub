import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RPC_URL = "https://api.mainnet-beta.solana.com";
const LAMPORTS_PER_SOL = 1_000_000_000;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId } = await req.json();

    if (!sessionId) {
      return new Response(
        JSON.stringify({ success: false, error: "Session ID required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the session
    const { data: session, error: sessionError } = await supabase
      .from("mix_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ success: false, error: "Session not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("mix_sessions").update({ status: "expired" }).eq("id", sessionId);
      return new Response(
        JSON.stringify({ success: false, error: "Session expired", status: "expired" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If already detected or further
    if (session.status !== "awaiting_deposit") {
      return new Response(
        JSON.stringify({
          success: true,
          found: session.status !== "pending",
          status: session.status,
          txSignature: session.tx_signature_in,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const depositAddress = session.deposit_address;
    const expectedAmount = parseFloat(session.amount_sol);

    console.log(`[detect-mix-transaction] Checking ${depositAddress} for ${expectedAmount} SOL`);

    // Get recent signatures
    const signaturesResponse = await fetch(RPC_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getSignaturesForAddress",
        params: [depositAddress, { limit: 10 }],
      }),
    });

    const signaturesData = await signaturesResponse.json();

    if (!signaturesData.result || signaturesData.result.length === 0) {
      return new Response(
        JSON.stringify({ success: true, found: false, message: "No transactions found yet" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check each transaction
    for (const sig of signaturesData.result) {
      const txResponse = await fetch(RPC_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getTransaction",
          params: [sig.signature, { encoding: "jsonParsed", maxSupportedTransactionVersion: 0 }],
        }),
      });

      const txData = await txResponse.json();
      if (!txData.result) continue;

      const instructions = txData.result.transaction?.message?.instructions || [];

      for (const ix of instructions) {
        if (ix.program === "system" && ix.parsed?.type === "transfer") {
          const { destination, lamports } = ix.parsed.info;
          const solAmount = lamports / LAMPORTS_PER_SOL;

          if (destination === depositAddress && solAmount >= expectedAmount - 0.001) {
            console.log(`[detect-mix-transaction] Found: ${solAmount} SOL, tx: ${sig.signature}`);

            await supabase
              .from("mix_sessions")
              .update({
                status: "deposit_detected",
                tx_signature_in: sig.signature,
                deposit_detected_at: new Date().toISOString(),
              })
              .eq("id", sessionId);

            return new Response(
              JSON.stringify({
                success: true,
                found: true,
                status: "deposit_detected",
                txSignature: sig.signature,
                amountReceived: solAmount,
              }),
              { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, found: false, message: "No matching transaction found yet" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("[detect-mix-transaction] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
